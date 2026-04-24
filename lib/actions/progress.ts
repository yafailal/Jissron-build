"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// Resolves the enrollment for the current user + the course containing lessonId.
// Returns { enrollmentId, lesson } or throws if not enrolled.
async function resolveEnrollment(lessonId: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    select: {
      durationSeconds: true,
      module: { select: { courseId: true } },
    },
  });
  if (!lesson) throw new Error("Lesson not found");

  const enrollment = await db.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: session.user.id,
        courseId: lesson.module.courseId,
      },
    },
    select: { id: true },
  });
  if (!enrollment) throw new Error("Not enrolled");

  return { enrollmentId: enrollment.id, lesson };
}

// ── Update watch progress ─────────────────────────────────────────────────────
// - Never decrements watchedSecs (rewind-safe)
// - Auto-completes at ≥ 90% of durationSeconds

export async function updateLessonProgress(
  lessonId: string,
  watchedSecs: number
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { enrollmentId, lesson } = await resolveEnrollment(lessonId);

    const existing = await db.lessonProgress.findUnique({
      where: { enrollmentId_lessonId: { enrollmentId, lessonId } },
      select: { watchedSecs: true, completed: true },
    });

    const newWatchedSecs = Math.max(watchedSecs, existing?.watchedSecs ?? 0);

    const autoComplete =
      !existing?.completed &&
      lesson.durationSeconds > 0 &&
      newWatchedSecs >= lesson.durationSeconds * 0.9;

    await db.lessonProgress.upsert({
      where: { enrollmentId_lessonId: { enrollmentId, lessonId } },
      create: {
        enrollmentId,
        lessonId,
        watchedSecs: newWatchedSecs,
        completed: autoComplete,
      },
      update: {
        watchedSecs: newWatchedSecs,
        ...(autoComplete ? { completed: true } : {}),
      },
    });

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// ── Mark lesson complete (manual) ─────────────────────────────────────────────

export async function markLessonComplete(
  lessonId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { enrollmentId } = await resolveEnrollment(lessonId);

    await db.lessonProgress.upsert({
      where: { enrollmentId_lessonId: { enrollmentId, lessonId } },
      create: { enrollmentId, lessonId, completed: true },
      update: { completed: true },
    });

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// ── Mark lesson incomplete (undo) ─────────────────────────────────────────────
// Does NOT reset watchedSecs.

export async function markLessonIncomplete(
  lessonId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { enrollmentId } = await resolveEnrollment(lessonId);

    await db.lessonProgress.upsert({
      where: { enrollmentId_lessonId: { enrollmentId, lessonId } },
      create: { enrollmentId, lessonId, completed: false },
      update: { completed: false },
    });

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
