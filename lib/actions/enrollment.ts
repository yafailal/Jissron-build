"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCurrentCurrency } from "@/lib/currency-server";

export async function enrollInFreeCourse(
  courseId: string
): Promise<{ ok: false; error: string } | { ok: true; enrollmentId: string }> {
  const session = await auth();
  if (!session) {
    redirect(`/signin`);
  }

  const course = await db.course.findUnique({
    where: { id: courseId, status: "PUBLISHED" },
    select: { id: true, slug: true, priceMadCents: true, priceUsdCents: true },
  });

  if (!course) {
    return { ok: false, error: "Course not found." };
  }

  if (course.priceMadCents !== 0 || course.priceUsdCents !== 0) {
    return { ok: false, error: "This course requires payment." };
  }

  const existing = await db.enrollment.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId } },
    select: { id: true },
  });

  if (existing) {
    redirect(`/dashboard?enrolled=${course.slug}`);
  }

  const currency = await getCurrentCurrency();

  const enrollment = await db.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        userId: session.user.id,
        courseId,
        status: "PAID",
        paymentMethod: "NONE",
        amountCents: 0,
        currency,
        paidAt: new Date(),
      },
    });

    return tx.enrollment.create({
      data: {
        userId: session.user.id,
        courseId,
        orderId: order.id,
        status: "ACTIVE",
        // TODO: method is deprecated in favor of Order.paymentMethod — remove in a future cleanup pass
        method: "FREE",
      },
      select: { id: true },
    });
  });

  redirect(`/dashboard?enrolled=${course.slug}`);

  // redirect() throws so this line is unreachable, but satisfies the return type
  return { ok: true, enrollmentId: enrollment.id };
}
