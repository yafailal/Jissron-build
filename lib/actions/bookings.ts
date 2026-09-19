"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { nextOrderReference } from "@/lib/utils/counter";
import { getStripeClient, isStripeConfigured } from "@/lib/stripe";
import { isCmiConfiguredServer } from "@/lib/cmi";

type BookResult =
  | { ok: true; bookingId: string }
  | { ok: false; error: string };

/**
 * Books a seat in a free live session.
 *
 * Seat enforcement uses an interactive transaction with `Serializable`
 * isolation so concurrent bookings can't oversell. We count current
 * CONFIRMED bookings inside the txn and insert only if seats are left.
 * The model's @@unique([userId, liveSessionId]) handles duplicate clicks
 * from the same user.
 *
 * Paid sessions are handled by the Stripe/CMI checkout flow which creates
 * the Booking on webhook confirmation — this action only does free.
 */
export async function bookFreeLiveSession(sessionId: string): Promise<BookResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sign in to book a seat" };

  const live = await db.liveSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      slug: true,
      isFree: true,
      seatsTotal: true,
      status: true,
      startsAt: true,
    },
  });
  if (!live) return { ok: false, error: "Session not found" };
  if (!live.isFree) return { ok: false, error: "This is a paid session — use checkout instead" };
  if (live.status === "CANCELLED") return { ok: false, error: "This session was cancelled" };
  if (live.status === "ENDED") return { ok: false, error: "This session has already ended" };

  try {
    const booking = await db.$transaction(
      async (tx) => {
        const taken = await tx.booking.count({
          where: { liveSessionId: sessionId, status: "CONFIRMED" },
        });
        if (taken >= live.seatsTotal) {
          throw new Error("SEATS_FULL");
        }
        return tx.booking.create({
          data: {
            userId: session.user.id,
            liveSessionId: sessionId,
            status: "CONFIRMED",
          },
          select: { id: true },
        });
      },
      { isolationLevel: "Serializable" }
    );

    revalidatePath(`/live/${live.slug}`);
    revalidatePath("/live");
    revalidatePath("/dashboard");

    return { ok: true, bookingId: booking.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message === "SEATS_FULL") {
      return { ok: false, error: "Sorry — all seats for this session are taken" };
    }
    // Prisma P2002 from the @@unique constraint = user already booked
    if (message.includes("Unique constraint")) {
      return { ok: false, error: "You're already booked for this session" };
    }
    return { ok: false, error: "Couldn't book the seat — please try again" };
  }
}

/**
 * Cancel a user's own booking. Frees up the seat.
 * Only allowed before the session starts.
 */
export async function cancelLiveSessionBooking(bookingId: string): Promise<{ ok: boolean; error?: string }> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sign in first" };

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { liveSession: { select: { slug: true, startsAt: true, status: true } } },
  });
  if (!booking) return { ok: false, error: "Booking not found" };
  if (booking.userId !== session.user.id) return { ok: false, error: "Not your booking" };
  if (booking.liveSession.status === "LIVE" || booking.liveSession.status === "ENDED") {
    return { ok: false, error: "Session is already live or ended" };
  }
  if (booking.liveSession.startsAt.getTime() <= Date.now()) {
    return { ok: false, error: "Can't cancel after the session has started" };
  }

  await db.booking.delete({ where: { id: bookingId } });
  revalidatePath(`/live/${booking.liveSession.slug}`);
  revalidatePath("/live");
  revalidatePath("/dashboard");
  return { ok: true };
}

type PaymentMethod = "STRIPE" | "CMI";

type CheckoutResult =
  | { ok: true; orderId: string; checkoutUrl: string }
  | { ok: false; error: string };

/**
 * Book a seat in a paid live session via Stripe or CMI.
 *
 * Creates a PENDING Order linked to the LiveSession via `liveSessionId`.
 * Does NOT create the Booking yet — that happens on webhook confirmation
 * inside `fulfillPaidOrder`, which also re-checks seat availability so we
 * don't oversell after a slow payment.
 *
 * For sessions priced at 0 in the chosen currency, callers should fall back
 * to `bookFreeLiveSession`.
 */
export async function createPaidLiveSessionCheckout(opts: {
  sessionId: string;
  paymentMethod: PaymentMethod;
}): Promise<CheckoutResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sign in first" };

  const live = await db.liveSession.findUnique({
    where: { id: opts.sessionId },
    select: {
      id: true,
      slug: true,
      title: true,
      isFree: true,
      seatsTotal: true,
      priceMadCents: true,
      priceUsdCents: true,
      status: true,
      startsAt: true,
    },
  });
  if (!live) return { ok: false, error: "Session not found" };
  if (live.isFree) {
    return { ok: false, error: "This is a free session — use the regular booking flow" };
  }
  if (live.status === "CANCELLED") return { ok: false, error: "This session was cancelled" };
  if (live.status === "ENDED") return { ok: false, error: "This session already ended" };

  // Already booked?
  const existing = await db.booking.findUnique({
    where: { userId_liveSessionId: { userId: session.user.id, liveSessionId: live.id } },
    select: { id: true },
  });
  if (existing) return { ok: false, error: "You're already booked for this session" };

  // Seat capacity at order-create time. Note: this is best-effort; the real
  // re-check happens at payment-fulfillment time inside fulfillPaidOrder.
  const taken = await db.booking.count({
    where: { liveSessionId: live.id, status: "CONFIRMED" },
  });
  if (taken >= live.seatsTotal) {
    return { ok: false, error: "Sorry — all seats are taken" };
  }

  const isCmi = opts.paymentMethod === "CMI";
  const amountCents = isCmi ? live.priceMadCents : live.priceUsdCents;
  const currency = isCmi ? "MAD" : "USD";
  if (amountCents <= 0) {
    return { ok: false, error: `No ${currency} price set for this session` };
  }

  if (isCmi) {
    if (!(await isCmiConfiguredServer())) {
      return { ok: false, error: "CMI card payments aren't configured yet" };
    }
  } else {
    if (!(await isStripeConfigured())) {
      return { ok: false, error: "Stripe payments aren't configured yet" };
    }
  }

  // Re-use an existing in-flight pending order for the same session
  const pending = await db.order.findFirst({
    where: {
      userId: session.user.id,
      liveSessionId: live.id,
      status: "PENDING",
      paymentMethod: opts.paymentMethod,
    },
    select: { id: true, orderReference: true },
  });

  const orderReference = pending?.orderReference ?? (await nextOrderReference());
  const orderId =
    pending?.id ??
    (await db.order.create({
      data: {
        userId: session.user.id,
        liveSessionId: live.id,
        status: "PENDING",
        paymentMethod: opts.paymentMethod,
        amountCents,
        currency,
        orderReference,
      },
      select: { id: true },
    })).id;

  if (isCmi) {
    return { ok: true, orderId, checkoutUrl: `/checkout/cmi/${orderId}` };
  }

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
            name: live.title,
            description: `Live session on ${live.startsAt.toUTCString()}`,
          },
        },
        quantity: 1,
      },
    ],
    success_url: `${baseUrl}/checkout/${orderId}/confirmation?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/live/${live.slug}?cancelled=1`,
    customer_email: session.user.email ?? undefined,
    client_reference_id: orderReference,
    metadata: {
      orderId,
      orderReference,
      userId: session.user.id,
      liveSessionId: live.id,
    },
  });
  if (!checkout.url) return { ok: false, error: "Stripe returned no checkout URL" };
  return { ok: true, orderId, checkoutUrl: checkout.url };
}
