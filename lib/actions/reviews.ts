"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type Result = { ok: true; reviewId: string } | { ok: false; error: string };

/**
 * Submit (or update) the current user's review for a course.
 *
 * Gates:
 * - Must be signed in.
 * - Must have an ACTIVE enrollment for this course.
 * - Must have completed the course (Enrollment.completedAt set). This matches
 *   the marketing copy "what learners say after finishing the course".
 *
 * Idempotent: the model's @@unique([userId, courseId]) means a second call
 * from the same user updates the existing row instead of inserting a dupe.
 */
export async function submitReview(opts: {
  courseId: string;
  courseSlug: string;
  rating: number;
  comment: string;
}): Promise<Result> {
  const session = await auth();
  if (!session) return { ok: false, error: "Please sign in first" };

  const rating = Math.round(opts.rating);
  if (rating < 1 || rating > 5) return { ok: false, error: "Rating must be 1–5 stars" };

  const comment = opts.comment.trim().slice(0, 2000);

  const enrollment = await db.enrollment.findFirst({
    where: { userId: session.user.id, courseId: opts.courseId, status: "ACTIVE" },
    select: { id: true, completedAt: true },
  });
  if (!enrollment) {
    return { ok: false, error: "You can only review courses you're enrolled in" };
  }
  if (!enrollment.completedAt) {
    return { ok: false, error: "Finish the course before leaving a review" };
  }

  const saved = await db.review.upsert({
    where: { userId_courseId: { userId: session.user.id, courseId: opts.courseId } },
    create: {
      userId: session.user.id,
      courseId: opts.courseId,
      rating,
      comment: comment || null,
    },
    update: {
      rating,
      comment: comment || null,
    },
    select: { id: true },
  });

  revalidatePath(`/courses/${opts.courseSlug}`);
  revalidatePath("/dashboard");

  return { ok: true, reviewId: saved.id };
}

export async function deleteMyReview(opts: {
  courseId: string;
  courseSlug: string;
}): Promise<{ ok: boolean; error?: string }> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sign in first" };

  await db.review.deleteMany({
    where: { userId: session.user.id, courseId: opts.courseId },
  });

  revalidatePath(`/courses/${opts.courseSlug}`);
  return { ok: true };
}
