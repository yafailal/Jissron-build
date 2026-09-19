// Stripe — international USD card payments via Stripe Checkout (hosted).
//
// Configuration precedence (highest first):
//   1. Env vars: STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET
//   2. SiteSettings fields: stripeSecretKey, stripePublishableKey, stripeWebhookSecret
//
// The server-only `stripe` SDK client is created lazily per-request because the
// secret key may be admin-configurable at runtime.

import Stripe from "stripe";
import { db } from "@/lib/db";

interface StripeConfig {
  secretKey: string;
  publishableKey: string;
  webhookSecret: string;
}

async function loadStripeConfig(): Promise<StripeConfig | null> {
  const envSecret = process.env.STRIPE_SECRET_KEY;
  const envPub = process.env.STRIPE_PUBLISHABLE_KEY;
  const envWebhook = process.env.STRIPE_WEBHOOK_SECRET;

  // Fast path: all three env vars set
  if (envSecret && envPub && envWebhook) {
    return { secretKey: envSecret, publishableKey: envPub, webhookSecret: envWebhook };
  }

  const settings = await db.siteSettings.findUnique({
    where: { id: "default" },
    select: {
      stripeEnabled: true,
      stripeSecretKey: true,
      stripePublishableKey: true,
      stripeWebhookSecret: true,
    },
  });
  if (!settings || !settings.stripeEnabled) return null;

  const secretKey = envSecret || settings.stripeSecretKey || "";
  const publishableKey = envPub || settings.stripePublishableKey || "";
  const webhookSecret = envWebhook || settings.stripeWebhookSecret || "";

  if (!secretKey || !publishableKey || !webhookSecret) return null;
  return { secretKey, publishableKey, webhookSecret };
}

/**
 * Returns `true` iff Stripe is enabled AND every credential is present.
 * Safe to call from server components.
 */
export async function isStripeConfigured(): Promise<boolean> {
  return (await loadStripeConfig()) !== null;
}

/**
 * Lazily-constructed Stripe client. Throws if Stripe isn't configured — call
 * `isStripeConfigured()` first if you need a soft check.
 */
export async function getStripeClient(): Promise<{ client: Stripe; config: StripeConfig }> {
  const config = await loadStripeConfig();
  if (!config) throw new Error("Stripe is not configured");
  const client = new Stripe(config.secretKey, {
    // Pin an API version so the Stripe team rolling out changes doesn't break
    // us. Update intentionally.
    apiVersion: "2026-04-22.dahlia",
    typescript: true,
  });
  return { client, config };
}
