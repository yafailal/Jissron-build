"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function enrollInFreeCourse(courseSlug: string): Promise<
  { ok: false; error: string } | { ok: true }
> {
  const session = await auth();
  if (!session) {
    redirect(`/signin?callbackUrl=/courses/${courseSlug}`);
  }

  // Email must be verified before enrolling
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { emailVerified: true },
  });

  if (!user?.emailVerified) {
    return { ok: false, error: "Please verify your email before enrolling." };
  }

  const course = await db.course.findUnique({
    where: { slug: courseSlug, status: "PUBLISHED" },
    select: { id: true, priceMadCents: true, priceUsdCents: true },
  });

  if (!course) {
    return { ok: false, error: "Course not found." };
  }

  if (course.priceMadCents !== 0 || course.priceUsdCents !== 0) {
    return { ok: false, error: "This course requires payment." };
  }

  // Upsert so a duplicate click is silent
  await db.enrollment.upsert({
    where: { userId_courseId: { userId: session.user.id, courseId: course.id } },
    create: {
      userId: session.user.id,
      courseId: course.id,
      method: "FREE",
      status: "ACTIVE",
    },
    update: { status: "ACTIVE" }, // re-activate if it was somehow revoked
  });

  redirect(`/learn/${courseSlug}`);
}
