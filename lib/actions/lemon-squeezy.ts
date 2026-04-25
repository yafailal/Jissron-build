"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isLemonSqueezyConfigured, generateLemonSqueezyCheckoutUrl } from "@/lib/lemon-squeezy";

type CheckoutResult =
  | { ok: true; checkoutUrl: string }
  | { ok: false; error: string };

export async function createLemonSqueezyCheckout(courseId: string): Promise<CheckoutResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "You must be signed in to purchase" };

  if (!(await isLemonSqueezyConfigured())) {
    return { ok: false, error: "USD payments not yet available" };
  }

  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { lemonSqueezyVariantId: true, title: true },
  });

  if (!course) return { ok: false, error: "Course not found" };

  if (!course.lemonSqueezyVariantId) {
    return { ok: false, error: "This course doesn't have USD pricing configured" };
  }

  try {
    const checkoutUrl = await generateLemonSqueezyCheckoutUrl({
      courseId,
      userId: session.user.id,
      variantId: course.lemonSqueezyVariantId,
    });
    return { ok: true, checkoutUrl };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { ok: false, error: message };
  }
}
