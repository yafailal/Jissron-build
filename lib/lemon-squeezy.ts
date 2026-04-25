import crypto from "crypto";
import { db } from "@/lib/db";

// Phase 6.5: Lemon Squeezy scaffolding for USD card payments.
// Phase 6.5+: Replace generateLemonSqueezyCheckoutUrl stub with real LS API call post-KYC.

interface LemonSqueezyConfig {
  apiKey: string;
  storeId: string;
  webhookSecret: string;
}

// Resolve config: env vars take precedence, fall back to Site Settings.
// Returns null if any required field is missing OR lemonSqueezyEnabled is false.
export async function getLemonSqueezyConfig(): Promise<LemonSqueezyConfig | null> {
  const envApiKey = process.env.LEMON_SQUEEZY_API_KEY;
  const envStoreId = process.env.LEMON_SQUEEZY_STORE_ID;
  const envWebhookSecret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;

  const settings = await db.siteSettings.findUnique({
    where: { id: "default" },
    select: {
      lemonSqueezyEnabled: true,
      lemonSqueezyApiKey: true,
      lemonSqueezyStoreId: true,
      lemonSqueezyWebhookSecret: true,
    },
  });

  if (!settings?.lemonSqueezyEnabled) return null;

  const apiKey = envApiKey || settings.lemonSqueezyApiKey || "";
  const storeId = envStoreId || settings.lemonSqueezyStoreId || "";
  const webhookSecret = envWebhookSecret || settings.lemonSqueezyWebhookSecret || "";

  if (!apiKey || !storeId || !webhookSecret) return null;

  return { apiKey, storeId, webhookSecret };
}

// Single source of truth for feature gating.
export async function isLemonSqueezyConfigured(): Promise<boolean> {
  return (await getLemonSqueezyConfig()) !== null;
}

// Phase 6.5+: Replace with real LS Checkout API call post-KYC.
// Signature is final — only the body is a stub.
export async function generateLemonSqueezyCheckoutUrl(_params: {
  courseId: string;
  userId: string;
  variantId: string;
}): Promise<string> {
  throw new Error(
    "Lemon Squeezy not yet implemented — Phase 6.5+ post-KYC"
  );
}

// Real implementation — not stubbed.
// HMAC-SHA256 of the raw request body with the webhook secret.
// Uses constant-time comparison to prevent timing attacks.
export function verifyLemonSqueezyWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expected = crypto
      .createHmac("sha256", secret)
      .update(rawBody, "utf8")
      .digest("hex");

    const expectedBuf = Buffer.from(expected, "hex");
    const receivedBuf = Buffer.from(signature, "hex");

    if (expectedBuf.length !== receivedBuf.length) return false;

    return crypto.timingSafeEqual(expectedBuf, receivedBuf);
  } catch {
    return false;
  }
}
