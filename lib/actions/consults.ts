"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { nextOrderReference } from "@/lib/utils/counter";
import { getStripeClient, isStripeConfigured } from "@/lib/stripe";
import { isCmiConfiguredServer } from "@/lib/cmi";
import { parseAvailability } from "@/lib/data/consultants";

type PaymentMethod = "STRIPE" | "CMI";

type Result =
  | { ok: true; orderId: string; bookingId: string; checkoutUrl: string }
  | { ok: false; error: string };

/**
 * Books a 1-on-1 consult slot and routes the student to checkout.
 *
 * Flow:
 * 1. Re-validate the requested slot against the consultant's availability JSON
 *    and existing bookings (slot collision check).
 * 2. Create a PENDING ConsultBooking holding the slot.
 * 3. Create a PENDING Order linked to the booking via `consultBookingId`.
 * 4. Create a Stripe Checkout Session or return a redirect to /checkout/cmi/[orderId].
 * 5. On webhook success, `fulfillPaidOrder` flips ConsultBooking → CONFIRMED.
 *
 * If the rate is 0 (free consult), the booking is confirmed immediately and
 * the user is sent to their dashboard.
 */
export async function bookConsult(opts: {
  consultantId: string;
  scheduledForIso: string;
  notes?: string;
  paymentMethod: PaymentMethod;
}): Promise<Result> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sign in first" };

  const consultant = await db.consultant.findUnique({
    where: { id: opts.consultantId },
    include: { user: { select: { id: true, name: true } } },
  });
  if (!consultant) return { ok: false, error: "Consultant not found" };
  if (!consultant.acceptsNew) {
    return { ok: false, error: "This consultant isn't accepting new bookings right now" };
  }
  if (consultant.userId === session.user.id) {
    return { ok: false, error: "You can't book a session with yourself" };
  }

  const scheduledFor = new Date(opts.scheduledForIso);
  if (isNaN(scheduledFor.getTime())) {
    return { ok: false, error: "Invalid date/time" };
  }
  if (scheduledFor.getTime() <= Date.now() + 30 * 60_000) {
    return { ok: false, error: "Pick a slot at least 30 minutes from now" };
  }

  // Validate the slot falls inside one of the consultant's declared ranges.
  const availability = parseAvailability(consultant.availability);
  const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const dayKey = DAY_KEYS[scheduledFor.getUTCDay()];
  const dayRanges = availability.find((a) => a.day === dayKey)?.slots ?? [];
  const hh = String(scheduledFor.getUTCHours()).padStart(2, "0");
  const mm = String(scheduledFor.getUTCMinutes()).padStart(2, "0");
  const slotTime = `${hh}:${mm}`;
  const inRange = dayRanges.some((r) => {
    // Slot must start at-or-after r.start and finish at-or-before r.end
    const slotEnd = new Date(scheduledFor.getTime() + consultant.durationMins * 60_000);
    const seh = String(slotEnd.getUTCHours()).padStart(2, "0");
    const sem = String(slotEnd.getUTCMinutes()).padStart(2, "0");
    const slotEndStr = `${seh}:${sem}`;
    return slotTime >= r.start && slotEndStr <= r.end;
  });
  if (!inRange) {
    return { ok: false, error: "That time isn't in this consultant's availability" };
  }

  // Collision check against existing pending/confirmed bookings
  const collidingEnd = new Date(scheduledFor.getTime() + consultant.durationMins * 60_000);
  const collision = await db.consultBooking.findFirst({
    where: {
      consultantId: opts.consultantId,
      status: { in: ["CONFIRMED", "PENDING"] },
      // Any booking that overlaps [scheduledFor, collidingEnd)
      scheduledFor: { lt: collidingEnd },
    },
    select: { scheduledFor: true, durationMins: true },
  });
  if (collision) {
    const colEnd = new Date(collision.scheduledFor.getTime() + collision.durationMins * 60_000);
    if (colEnd > scheduledFor) {
      return { ok: false, error: "That slot was just taken — pick another time" };
    }
  }

  // Pricing: prefer the currency tied to the payment method
  const isCmi = opts.paymentMethod === "CMI";
  const amountCents = isCmi ? consultant.ratePerSessionMadCents : consultant.ratePerSessionUsdCents;
  const currency = isCmi ? "MAD" : "USD";
  const isFree = amountCents <= 0;

  if (!isFree) {
    if (isCmi) {
      if (!(await isCmiConfiguredServer())) {
        return { ok: false, error: "CMI card payments aren't configured yet" };
      }
    } else {
      if (!(await isStripeConfigured())) {
        return { ok: false, error: "Stripe payments aren't configured yet" };
      }
    }
  }

  const trimmedNotes = (opts.notes ?? "").trim().slice(0, 1000) || null;

  // Create booking + order in one transaction so we never leave a booking
  // without a matching order.
  const orderReference = await nextOrderReference();
  const { booking, order } = await db.$transaction(async (tx) => {
    const booking = await tx.consultBooking.create({
      data: {
        studentId: session.user.id,
        consultantId: opts.consultantId,
        scheduledFor,
        durationMins: consultant.durationMins,
        status: isFree ? "CONFIRMED" : "PENDING",
        notes: trimmedNotes,
      },
      select: { id: true },
    });
    const order = await tx.order.create({
      data: {
        userId: session.user.id,
        consultBookingId: booking.id,
        status: isFree ? "PAID" : "PENDING",
        paidAt: isFree ? new Date() : null,
        paymentMethod: isFree ? "NONE" : opts.paymentMethod,
        amountCents,
        currency,
        orderReference,
      },
      select: { id: true },
    });
    return { booking, order };
  });

  if (isFree) {
    revalidatePath("/dashboard");
    return {
      ok: true,
      bookingId: booking.id,
      orderId: order.id,
      checkoutUrl: "/dashboard?booked=consult",
    };
  }

  if (isCmi) {
    return {
      ok: true,
      bookingId: booking.id,
      orderId: order.id,
      checkoutUrl: `/checkout/cmi/${order.id}`,
    };
  }

  // Stripe — create checkout session
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const { client } = await getStripeClient();
  const checkout = await client.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: amountCents,
          product_data: {
            name: `Consult with ${consultant.user.name ?? "your consultant"}`,
            description: `${consultant.durationMins}-min session on ${scheduledFor.toUTCString()}`,
          },
        },
        quantity: 1,
      },
    ],
    success_url: `${baseUrl}/checkout/${order.id}/confirmation?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/consultants/${opts.consultantId}?cancelled=1`,
    customer_email: session.user.email ?? undefined,
    client_reference_id: orderReference,
    metadata: {
      orderId: order.id,
      orderReference,
      userId: session.user.id,
      consultBookingId: booking.id,
    },
  });

  if (!checkout.url) {
    return { ok: false, error: "Stripe returned no checkout URL" };
  }
  return {
    ok: true,
    bookingId: booking.id,
    orderId: order.id,
    checkoutUrl: checkout.url,
  };
}
