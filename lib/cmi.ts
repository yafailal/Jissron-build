// CMI (Centre Monétique Interbancaire) — Moroccan card acquiring.
// Hosted payment page integration. We never touch card data.
//
// Reference: CMI integration manual, hash v3 algorithm.
//
// FLOW:
//   1. Build a payment form from buildCmiFormData(order, settings)
//   2. POST that form (auto-submitted via /checkout/cmi/[orderId]) to PAYMENT_URL
//   3. CMI hosts the card-entry page (incl. 3DS challenge)
//   4. CMI POSTs back to our okUrl / failUrl with response + HASH
//   5. verifyCmiHash() confirms the callback truly came from CMI before we
//      transition the order

import crypto from "crypto";
import { db } from "@/lib/db";

// Currency code 504 = MAD (per ISO 4217)
export const CMI_CURRENCY_MAD = "504";

export const CMI_PAYMENT_URL = {
  test: "https://testpayment.cmi.co.ma/fim/est3Dgate",
  prod: "https://payment.cmi.co.ma/fim/est3Dgate",
} as const;

export interface CmiSettings {
  cmiEnabled: boolean;
  cmiTestMode: boolean;
  cmiMerchantId: string | null;
  cmiStoreKey: string | null;
}

export function isCmiConfigured(s: CmiSettings): boolean {
  return Boolean(s.cmiEnabled && s.cmiMerchantId && s.cmiStoreKey);
}

export function cmiPaymentUrl(testMode: boolean): string {
  return testMode ? CMI_PAYMENT_URL.test : CMI_PAYMENT_URL.prod;
}

/**
 * CMI v3 hash algorithm:
 *   1. Collect all form parameters EXCEPT `hash` and `encoding`
 *   2. Sort keys alphabetically (case-insensitive)
 *   3. Join all values + storeKey with the "|" character
 *   4. Escape any literal "|" or "\" in values (CMI rule)
 *   5. SHA-512 over the result
 *   6. Base64-encode the digest
 */
export function generateCmiHash(
  params: Record<string, string>,
  storeKey: string
): string {
  const escape = (v: string) =>
    v.replace(/\\/g, "\\\\").replace(/\|/g, "\\|");

  // Keys to ignore per spec
  const ignored = new Set(["hash", "encoding"]);
  const sortedKeys = Object.keys(params)
    .filter((k) => !ignored.has(k.toLowerCase()))
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

  const joined =
    sortedKeys.map((k) => escape(params[k] ?? "")).join("|") +
    "|" +
    escape(storeKey);

  const digest = crypto.createHash("sha512").update(joined, "utf-8").digest();
  return digest.toString("base64");
}

export interface BuildFormOpts {
  merchantId: string;
  storeKey: string;
  // Order info
  orderRef: string; // unique per-payment-attempt identifier (Order.orderReference)
  amountCents: number; // we charge in MAD whole centimes
  // Routing back to our app
  okUrl: string;
  failUrl: string;
  // Optional customer info — CMI accepts billing fields, helpful for receipts
  email?: string;
  billName?: string;
  // Display
  lang?: "ar" | "fr" | "en";
}

/**
 * Builds the form payload (including the signed `hash`) ready to POST to CMI.
 * The browser will auto-submit it from /checkout/cmi/[orderId].
 */
export function buildCmiFormData(opts: BuildFormOpts): Record<string, string> {
  // Random nonce — required by CMI hash spec
  const rnd = `${Date.now()}${Math.floor(Math.random() * 1_000_000)}`;

  // CMI expects amount as decimal MAD (e.g. "120.00")
  const amount = (opts.amountCents / 100).toFixed(2);

  const params: Record<string, string> = {
    clientid: opts.merchantId,
    storetype: "3D_PAY_HOSTING",
    hashAlgorithm: "ver3",
    TranType: "PreAuth", // Bank captures funds via PreAuth + auto-capture; safe default
    amount,
    currency: CMI_CURRENCY_MAD,
    oid: opts.orderRef,
    okUrl: opts.okUrl,
    failUrl: opts.failUrl,
    lang: opts.lang ?? "fr",
    rnd,
    encoding: "utf-8",
    refreshtime: "5",
    callbackUrl: opts.okUrl, // server-side notification mirror; CMI accepts the same URL
  };

  if (opts.email) params.email = opts.email;
  if (opts.billName) params.BillToName = opts.billName;

  params.hash = generateCmiHash(params, opts.storeKey);
  return params;
}

/**
 * Verifies a callback hash. CMI sends back `HASH` (or `hash` depending on
 * config) plus a full set of params. We re-compute and compare.
 *
 * If they differ, the callback is forged / tampered — DO NOT trust the order
 * transition.
 */
export function verifyCmiHash(
  body: Record<string, string>,
  storeKey: string
): boolean {
  const sentHash = body.HASH ?? body.hash ?? "";
  if (!sentHash) return false;

  // Use the same alg as outbound. CMI excludes hash + encoding from the input.
  const computed = generateCmiHash(body, storeKey);

  // Constant-time compare to avoid timing attacks
  if (sentHash.length !== computed.length) return false;
  return crypto.timingSafeEqual(
    Buffer.from(sentHash, "utf-8"),
    Buffer.from(computed, "utf-8")
  );
}

/**
 * Convenience: returns true if the callback reports a successful payment.
 * CMI sends ProcReturnCode "00" for approvals; Response "Approved" is the
 * human-readable status.
 */
export function isCmiCallbackApproved(body: Record<string, string>): boolean {
  return body.ProcReturnCode === "00" && (body.Response ?? "").toLowerCase() === "approved";
}

// ─── Server-side config check helper ────────────────────────────────────────

/**
 * Returns true iff CMI is enabled AND credentials are present in SiteSettings.
 * Safe to call from server components / actions; reads the singleton settings row.
 */
export async function isCmiConfiguredServer(): Promise<boolean> {
  const settings = await db.siteSettings.findUnique({
    where: { id: "default" },
    select: { cmiEnabled: true, cmiMerchantId: true, cmiStoreKey: true },
  });
  return Boolean(settings?.cmiEnabled && settings?.cmiMerchantId && settings?.cmiStoreKey);
}
