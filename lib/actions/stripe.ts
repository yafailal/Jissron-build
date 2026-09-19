"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { nextOrderReference } from "@/lib/utils/counter";
import { getStripeClient, isStripeConfigured } from "@/lib/stripe";

type CheckoutResult =
  | { ok: true; checkoutUrl: string }
  | { ok: false; error: string };

/**
 * Creates a Stripe Checkout Session for the given course and returns the
 * hosted-page URL. We also create a PENDING Order in our DB with the session
 * id so the webhook can resolve it cleanly on `checkout.session.completed`.
 */
export async function createStripeCheckout(courseId: string): Promise<CheckoutResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "You must be signed in to purchase" };

  if (!(await isStripeConfigured())) {
    return { ok: false, error: "USD payments are not yet configured" };
  }

  const course = await db.course.findUnique({
    where: { id: courseId, status: "PUBLISHED" },
    select: {
      id: true,
      slug: true,
      title: true,
      priceUsdCents: true,
      stripePriceId: true,
    },
  });
  if (!course) return { ok: false, error: "Course not found" };
  if (!course.stripePriceId) {
    return { ok: false, error: "This course doesn't have USD pricing configured" };
  }
  if (course.priceUsdCents <= 0) {
    return { ok: false, error: "Use the free enrollment flow for free courses" };
  }

  // Re-use a pending Stripe order if one's already in flight
  const pending = await db.order.findFirst({
    where: {
      userId: session.user.id,
      courseId,
      status: "PENDING",
      paymentMethod: "STRIPE",
    },
    select: { id: true, orderReference: true },
  });

  const orderReference = pending?.orderReference ?? (await nextOrderReference());
  const orderId =
    pending?.id ??
    (await db.order.create({
      data: {
        userId: session.user.id,
        courseId,
        status: "PENDING",
        paymentMethod: "STRIPE",
        amountCents: course.priceUsdCents,
        currency: "USD",
        orderReference,
      },
      select: { id: true },
    })).id;

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  try {
    const { client } = await getStripeClient();
    const checkout = await client.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: course.stripePriceId, quantity: 1 }],
      success_url: `${baseUrl}/checkout/${orderId}/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/courses/${course.slug}?stripe_cancelled=1`,
      customer_email: session.user.email ?? undefined,
      client_reference_id: orderReference,
      metadata: {
        orderId,
        orderReference,
        userId: session.user.id,
        courseId,
      },
    });

    if (!checkout.url) {
      return { ok: false, error: "Stripe returned no checkout URL" };
    }
    return { ok: true, checkoutUrl: checkout.url };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown Stripe error";
    return { ok: false, error: message };
  }
}
