// Stripe webhook handler.
//
// Events we listen for:
//   - checkout.session.completed → mark Order PAID + create Enrollment
//   - charge.refunded             → mark Order REFUNDED
//
// Stripe signs every event. We verify the signature against our endpoint
// secret BEFORE doing anything else.

import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripeClient } from "@/lib/stripe";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { fulfillPaidOrder } from "@/lib/actions/fulfill-order";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  // Raw bytes are mandatory for signature verification — never await req.json() here.
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";

  let stripe: { client: Stripe; config: { webhookSecret: string } };
  try {
    stripe = await getStripeClient();
  } catch {
    console.warn("[stripe webhook] received event but Stripe is not configured");
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.client.webhooks.constructEvent(rawBody, signature, stripe.config.webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.warn(`[stripe webhook] signature verification failed: ${msg}`);
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "charge.refunded":
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;
      default:
        // We acknowledge unknown events so Stripe doesn't keep retrying. Add
        // new cases above when we start using them.
        break;
    }
  } catch (err) {
    console.error(`[stripe webhook] handler for ${event.type} threw:`, err);
    // Return 500 so Stripe retries — webhooks must be idempotent on our side
    // so retries don't cause double enrolments.
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

// ─── Handlers ───────────────────────────────────────────────────────────────

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  // We attached orderId in metadata when creating the session. Prefer that;
  // fall back to client_reference_id (== orderReference) for resilience.
  const orderId = session.metadata?.orderId;
  const orderRef = session.client_reference_id ?? session.metadata?.orderReference;

  const order = await db.order.findFirst({
    where: orderId
      ? { id: orderId }
      : orderRef
      ? { orderReference: orderRef }
      : { id: "__no_match__" },
    select: { id: true },
  });

  if (!order) {
    console.error("[stripe webhook] checkout.session.completed: no matching order", {
      sessionId: session.id,
      orderId,
      orderRef,
    });
    return;
  }

  const result = await fulfillPaidOrder({ orderId: order.id, provider: "STRIPE" });
  if (!result.ok) {
    console.error("[stripe webhook] fulfillPaidOrder failed:", result.error);
    throw new Error(result.error);
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${order.id}`);
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  // Stripe doesn't pass our metadata on a Charge directly — but it does carry
  // the payment_intent. The Checkout session links to the payment_intent, and
  // we stored orderReference as client_reference_id. Look up via PI metadata
  // when present, else fall back to a `Order.refundedAt` search by amount.
  const piId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
  if (!piId) {
    console.warn("[stripe webhook] refund without payment_intent — skipping", { chargeId: charge.id });
    return;
  }

  // Stripe Charges don't carry our orderId metadata directly, but PaymentIntent
  // and the Checkout Session do. Resolve via the PaymentIntent's metadata.
  const stripe = await getStripeClient();
  const pi = await stripe.client.paymentIntents.retrieve(piId);
  const orderId = pi.metadata?.orderId;
  const orderRef = pi.metadata?.orderReference;

  if (!orderId && !orderRef) {
    console.warn("[stripe webhook] refund — no orderId/orderReference in PaymentIntent metadata", { piId });
    return;
  }

  const order = await db.order.findFirst({
    where: orderId ? { id: orderId } : { orderReference: orderRef! },
    select: { id: true, status: true },
  });
  if (!order) {
    console.error("[stripe webhook] refund — no matching order", { piId, orderId, orderRef });
    return;
  }

  if (order.status === "REFUNDED") return; // idempotent

  await db.order.update({
    where: { id: order.id },
    data: { status: "REFUNDED" },
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${order.id}`);
}
