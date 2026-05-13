"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { nextOrderReference } from "@/lib/utils/counter";
import { isCmiConfigured } from "@/lib/cmi";

type Result =
  | { ok: true; orderId: string }
  | { ok: false; error: string };

/**
 * Creates a PENDING order tied to CMI and redirects the student to the
 * /checkout/cmi/[orderId] page, which auto-submits the signed form to CMI's
 * hosted payment page.
 *
 * The actual hash signing happens in the checkout page (server component) so
 * the StoreKey never leaves the server.
 */
export async function createCmiOrder(courseId: string): Promise<Result> {
  const session = await auth();
  if (!session) redirect("/signin");

  const settings = await db.siteSettings.findUnique({
    where: { id: "default" },
    select: {
      cmiEnabled: true,
      cmiTestMode: true,
      cmiMerchantId: true,
      cmiStoreKey: true,
    },
  });
  if (!settings || !isCmiConfigured(settings)) {
    return { ok: false, error: "Card payments are not yet configured." };
  }

  const course = await db.course.findUnique({
    where: { id: courseId, status: "PUBLISHED" },
    select: { id: true, priceMadCents: true },
  });
  if (!course) return { ok: false, error: "Course not found." };
  if (course.priceMadCents <= 0) {
    return { ok: false, error: "Use the free enrollment flow for free courses." };
  }

  // Already enrolled? Send them to the dashboard.
  const existing = await db.enrollment.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId } },
    select: { id: true },
  });
  if (existing) redirect("/dashboard");

  // Re-use an existing pending CMI order if one is in flight — avoids
  // duplicate references / double-charges on rapid clicks.
  const pending = await db.order.findFirst({
    where: { userId: session.user.id, courseId, status: "PENDING", paymentMethod: "CMI" },
    select: { id: true },
  });
  if (pending) {
    return { ok: true, orderId: pending.id };
  }

  const orderReference = await nextOrderReference();
  const order = await db.order.create({
    data: {
      userId: session.user.id,
      courseId,
      status: "PENDING",
      paymentMethod: "CMI",
      amountCents: course.priceMadCents,
      currency: "MAD",
      orderReference,
    },
    select: { id: true },
  });

  return { ok: true, orderId: order.id };
}
