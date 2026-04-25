// Phase 6.5: Webhook scaffolding with signature verification.
// Phase 6.5+: Add event handlers (order_created, subscription_created, etc.)
//             to create Order + Enrollment rows once KYC is approved.

import { NextRequest, NextResponse } from "next/server";
import { getLemonSqueezyConfig, verifyLemonSqueezyWebhookSignature } from "@/lib/lemon-squeezy";

export async function POST(req: NextRequest) {
  // Read raw body as text — must happen before any parsing for signature verification
  const rawBody = await req.text();
  const signature = req.headers.get("x-signature") ?? "";

  const config = await getLemonSqueezyConfig();
  if (!config) {
    console.warn("[lemon-squeezy webhook] received event but LS is not configured");
    return NextResponse.json(
      { error: "Lemon Squeezy not configured" },
      { status: 503 }
    );
  }

  const isValid = verifyLemonSqueezyWebhookSignature(rawBody, signature, config.webhookSecret);
  if (!isValid) {
    console.warn(
      `[lemon-squeezy webhook] invalid signature — received: ${signature.slice(0, 16)}...`
    );
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Signature verified — parse and log
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const meta = payload.meta as Record<string, unknown> | undefined;
  const eventName = meta?.event_name ?? "unknown";
  const customData = meta?.custom_data;

  console.log(`[lemon-squeezy webhook] event="${eventName}"`, {
    customData,
    dataKeys: payload.data ? Object.keys(payload.data as object) : [],
  });

  // Phase 6.5+: handle order_created, subscription_created, etc.
  return NextResponse.json({
    received: true,
    processed: false,
    reason: "Phase 6.5 scaffolding — events not yet processed",
  });
}
