// CMI sends both the okUrl (success) and failUrl (failure) callbacks to this
// endpoint. We:
//   1. Parse the form-encoded body
//   2. Look up our store key + verify the HASH
//   3. Look up the order by `oid` (orderReference)
//   4. If approved + hash valid → transition order to PAID, create enrollment, send receipt email
//   5. If declined → leave order PENDING (or flip to CANCELLED) and redirect to a failure page
//
// CMI then immediately follows up with the user's browser, which renders a
// redirect (302) response from this handler taking them back to our app.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { isCmiCallbackApproved, verifyCmiHash } from "@/lib/cmi";
import { sendPaymentConfirmed } from "@/lib/emails/senders";

export const runtime = "nodejs";

function bodyToRecord(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") out[key] = value;
  }
  return out;
}

export async function POST(req: NextRequest) {
  const baseUrl = process.env.NEXTAUTH_URL ?? new URL(req.url).origin;

  let body: Record<string, string>;
  try {
    const fd = await req.formData();
    body = bodyToRecord(fd);
  } catch (err) {
    console.error("[cmi/callback] failed to parse body:", err);
    return NextResponse.redirect(`${baseUrl}/?error=cmi_bad_request`, 303);
  }

  const settings = await db.siteSettings.findUnique({
    where: { id: "default" },
    select: { cmiStoreKey: true },
  });
  const storeKey = settings?.cmiStoreKey;
  if (!storeKey) {
    console.error("[cmi/callback] no store key configured");
    return NextResponse.redirect(`${baseUrl}/?error=cmi_not_configured`, 303);
  }

  // Hash check — mandatory. Tampered callbacks must not transition orders.
  const hashOk = verifyCmiHash(body, storeKey);
  if (!hashOk) {
    console.error("[cmi/callback] hash verification failed", { oid: body.oid });
    return NextResponse.redirect(`${baseUrl}/?error=cmi_bad_signature`, 303);
  }

  const orderRef = body.oid;
  if (!orderRef) {
    console.error("[cmi/callback] missing oid in body");
    return NextResponse.redirect(`${baseUrl}/?error=cmi_missing_oid`, 303);
  }

  const order = await db.order.findUnique({
    where: { orderReference: orderRef },
    select: {
      id: true,
      userId: true,
      status: true,
      courseId: true,
      orderReference: true,
      course: { select: { id: true, title: true, slug: true } },
      user: { select: { email: true, name: true } },
    },
  });

  if (!order) {
    console.error("[cmi/callback] no order for oid", { orderRef });
    return NextResponse.redirect(`${baseUrl}/?error=cmi_order_not_found`, 303);
  }

  // Always stash the raw callback for debugging / dispute support.
  await db.order.update({
    where: { id: order.id },
    data: {
      cmiResponseRaw: body as unknown as object,
      cmiTransactionId: body.TransId ?? body.TransID ?? undefined,
    },
  });

  // Idempotency — if the order is already PAID we just send the student home.
  if (order.status === "PAID") {
    return NextResponse.redirect(`${baseUrl}/checkout/${order.id}/confirmation`, 303);
  }

  const approved = isCmiCallbackApproved(body);

  if (!approved) {
    // Declined / cancelled — flag the order and send the student to a failure view.
    await db.order.update({
      where: { id: order.id },
      data: { status: "CANCELLED" },
    });
    return NextResponse.redirect(
      `${baseUrl}/checkout/${order.id}?error=cmi_declined&reason=${encodeURIComponent(body.ErrMsg ?? "Payment declined")}`,
      303
    );
  }

  // Approved — promote order, create enrollment, email the receipt.
  if (!order.courseId || !order.course) {
    console.error("[cmi/callback] approved order missing course link", { id: order.id });
    return NextResponse.redirect(`${baseUrl}/dashboard?error=cmi_no_course`, 303);
  }

  const courseId = order.courseId;
  const course = order.course;

  await db.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: { status: "PAID", paidAt: new Date() },
    });
    await tx.enrollment.upsert({
      where: { userId_courseId: { userId: order.userId, courseId } },
      create: {
        userId: order.userId,
        courseId,
        orderId: order.id,
        status: "ACTIVE",
        method: "CMI",
      },
      update: { status: "ACTIVE", orderId: order.id },
    });
  });

  try {
    if (order.user.email) {
      await sendPaymentConfirmed({
        to: order.user.email,
        name: order.user.name ?? "Student",
        orderReference: order.orderReference ?? order.id,
        courseTitle: course.title,
        courseSlug: course.slug,
      });
    }
  } catch (err) {
    console.error("[cmi/callback] sendPaymentConfirmed failed:", err);
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${order.id}`);
  return NextResponse.redirect(`${baseUrl}/checkout/${order.id}/confirmation`, 303);
}

// CMI sometimes also pings the callback as GET during smoke tests; treat it as
// a no-op redirect home.
export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEXTAUTH_URL ?? new URL(req.url).origin;
  return NextResponse.redirect(`${baseUrl}/`, 303);
}
