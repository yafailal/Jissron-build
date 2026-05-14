"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getStripeClient } from "@/lib/stripe";

type Result = { ok: true; message: string } | { ok: false; error: string };

/**
 * Admin-initiated refund.
 *
 * For STRIPE orders: calls the Stripe Refunds API on the linked PaymentIntent,
 * then marks the order REFUNDED. (The charge.refunded webhook will fire too,
 * and is a no-op due to status idempotency.)
 *
 * For BANK_TRANSFER and CMI orders: only flips the order to REFUNDED here —
 * the admin is expected to issue the actual money-out via their bank / CMI
 * dashboard separately, then click the button here to reflect it in JissrON.
 *
 * Side effects:
 * - Enrollment for the linked course is CANCELLED (student loses access).
 * - Booking for the linked live session is removed (frees the seat).
 */
export async function refundOrder(orderId: string): Promise<Result> {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return { ok: false, error: "Admin only" };
  }

  const order = await db.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      status: true,
      paymentMethod: true,
      amountCents: true,
      currency: true,
      orderReference: true,
      userId: true,
      courseId: true,
      liveSessionId: true,
    },
  });
  if (!order) return { ok: false, error: "Order not found" };
  if (order.status === "REFUNDED") return { ok: false, error: "Already refunded" };
  if (order.status !== "PAID") {
    return { ok: false, error: `Only PAID orders can be refunded (this one is ${order.status})` };
  }

  let stripeMessage = "";

  if (order.paymentMethod === "STRIPE") {
    try {
      const { client } = await getStripeClient();
      // Find the PaymentIntent for this order. We stored orderId in the
      // session metadata, so search PaymentIntents by metadata. Stripe doesn't
      // let us filter PIs by metadata directly via the API; instead we look up
      // via the Checkout Session that we kept on the customer side. Simplest:
      // search the PI list for one whose metadata matches.
      const intents = await client.paymentIntents.search({
        query: `metadata['orderId']:'${order.id}'`,
        limit: 1,
      });
      const pi = intents.data[0];
      if (!pi) {
        return {
          ok: false,
          error: "Couldn't locate Stripe PaymentIntent for this order — refund manually in Stripe and mark this order as refunded.",
        };
      }
      const refund = await client.refunds.create({
        payment_intent: pi.id,
        metadata: { orderId: order.id, orderReference: order.orderReference ?? "" },
      });
      stripeMessage = ` Stripe refund ${refund.id} issued.`;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Stripe error";
      return { ok: false, error: `Stripe refund failed: ${message}` };
    }
  }

  // Flip the order, revoke access, free seats. One transaction so partial
  // failures don't leave the system half-refunded.
  await db.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: { status: "REFUNDED" },
    });
    if (order.courseId) {
      await tx.enrollment.updateMany({
        where: { userId: order.userId, courseId: order.courseId, status: "ACTIVE" },
        data: { status: "REVOKED" },
      });
    }
    if (order.liveSessionId) {
      await tx.booking.deleteMany({
        where: { userId: order.userId, liveSessionId: order.liveSessionId },
      });
    }
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${order.id}`);

  const manualNote =
    order.paymentMethod === "BANK_TRANSFER"
      ? " Reminder: issue the actual bank transfer back to the customer."
      : order.paymentMethod === "CMI"
      ? " Reminder: issue the refund in your CMI dashboard."
      : "";

  return {
    ok: true,
    message: `Order refunded.${stripeMessage}${manualNote}`,
  };
}
