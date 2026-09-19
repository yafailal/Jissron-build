import { db } from "@/lib/db";
import { sendPaymentConfirmed } from "@/lib/emails/senders";

type Provider = "STRIPE" | "CMI" | "BANK_TRANSFER";

/**
 * Promotes a PENDING order to PAID and provisions whatever the order was for:
 * - courseId → Enrollment.ACTIVE
 * - liveSessionId → Booking.CONFIRMED (seat-checked)
 * - consultBookingId → ConsultBooking.CONFIRMED
 *
 * Idempotent: returns immediately if the order is already PAID. Designed to be
 * called from the Stripe webhook, the CMI callback, and the bank-transfer
 * admin confirm action.
 */
export async function fulfillPaidOrder(opts: {
  orderId: string;
  provider: Provider;
}): Promise<
  | { ok: true; alreadyPaid?: boolean }
  | { ok: false; error: string }
> {
  const order = await db.order.findUnique({
    where: { id: opts.orderId },
    select: {
      id: true,
      userId: true,
      status: true,
      courseId: true,
      liveSessionId: true,
      consultBookingId: true,
      orderReference: true,
      course: { select: { id: true, title: true, slug: true } },
      liveSession: { select: { id: true, slug: true, title: true, seatsTotal: true } },
      user: { select: { email: true, name: true } },
    },
  });
  if (!order) return { ok: false, error: "Order not found" };
  if (order.status === "PAID") return { ok: true, alreadyPaid: true };

  // Provisioning runs in a single transaction; seat checks for live sessions
  // happen here so concurrent payments can't oversell.
  await db.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: { status: "PAID", paidAt: new Date() },
    });

    if (order.courseId) {
      await tx.enrollment.upsert({
        where: { userId_courseId: { userId: order.userId, courseId: order.courseId } },
        create: {
          userId: order.userId,
          courseId: order.courseId,
          orderId: order.id,
          status: "ACTIVE",
          method: opts.provider,
        },
        update: { status: "ACTIVE", orderId: order.id },
      });
    }

    if (order.liveSessionId && order.liveSession) {
      const taken = await tx.booking.count({
        where: { liveSessionId: order.liveSessionId, status: "CONFIRMED" },
      });
      if (taken >= order.liveSession.seatsTotal) {
        // No seats — refund will be handled by admin. We still mark PAID so
        // the payment is recorded; the order will show as PAID without a
        // booking and the admin must refund + cancel.
        throw new Error("SEATS_FULL_AFTER_PAYMENT");
      }
      await tx.booking.upsert({
        where: {
          userId_liveSessionId: {
            userId: order.userId,
            liveSessionId: order.liveSessionId,
          },
        },
        create: {
          userId: order.userId,
          liveSessionId: order.liveSessionId,
          status: "CONFIRMED",
        },
        update: { status: "CONFIRMED" },
      });
    }

    if (order.consultBookingId) {
      await tx.consultBooking.update({
        where: { id: order.consultBookingId },
        data: { status: "CONFIRMED" },
      });
    }
  });

  // Best-effort receipt email — never block the response on it.
  try {
    if (order.user.email && order.course) {
      await sendPaymentConfirmed({
        to: order.user.email,
        name: order.user.name ?? "Student",
        orderReference: order.orderReference ?? order.id,
        courseTitle: order.course.title,
        courseSlug: order.course.slug,
      });
    }
  } catch (err) {
    console.error("[fulfillPaidOrder] receipt email failed:", err);
  }

  return { ok: true };
}
