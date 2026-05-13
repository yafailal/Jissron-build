"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendCourseCompleted } from "@/lib/emails/senders";
import { issueCertificate } from "@/lib/actions/certificates";

// Resolves the enrollment for the current user + the course containing lessonId.
// Returns enrollment id, lesson info, and user details needed for emails.
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
    select: { id: true, completedAt: true },
  });
  if (!enrollment) throw new Error("Not enrolled");

  return {
    enrollmentId: enrollment.id,
    alreadyCompleted: enrollment.completedAt !== null,
    lesson,
    courseId: lesson.module.courseId,
    userId: session.user.id,
    userEmail: session.user.email ?? "",
    userName: session.user.name?.split(" ")[0] ?? "there",
  };
}

// Checks if all lessons in the course are now complete for this enrollment.
// If so, stamps completedAt (idempotent — only updates when null) and returns
// justCompleted=true so the caller can fire the email.
async function checkAndMarkCourseCompleted(
  enrollmentId: string,
  courseId: string
): Promise<{ justCompleted: boolean; courseTitle: string; courseSlug: string }> {
  const [totalLessons, completedLessons, course] = await Promise.all([
    db.lesson.count({
      where: { module: { courseId } },
    }),
    db.lessonProgress.count({
      where: { enrollmentId, completed: true },
    }),
    db.course.findUnique({
      where: { id: courseId },
      select: { title: true, slug: true },
    }),
  ]);

  if (!course) return { justCompleted: false, courseTitle: "", courseSlug: "" };
  if (totalLessons === 0 || completedLessons < totalLessons) {
    return { justCompleted: false, courseTitle: course.title, courseSlug: course.slug };
  }

  // Atomic: only stamps if completedAt is still null
  const updated = await db.enrollment.updateMany({
    where: { id: enrollmentId, completedAt: null },
    data: { completedAt: new Date() },
  });

  return {
    justCompleted: updated.count > 0,
    courseTitle: course.title,
    courseSlug: course.slug,
  };
}

// ── Update watch progress ─────────────────────────────────────────────────────
// - Never decrements watchedSecs (rewind-safe)
// - Auto-completes at ≥ 90% of durationSeconds

export async function updateLessonProgress(
  lessonId: string,
  watchedSecs: number
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { enrollmentId, alreadyCompleted, lesson, courseId, userId, userEmail, userName } =
      await resolveEnrollment(lessonId);

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

    if (autoComplete && !alreadyCompleted) {
      const { justCompleted, courseTitle, courseSlug } =
        await checkAndMarkCourseCompleted(enrollmentId, lesson.module.courseId);
      if (justCompleted) {
        sendCourseCompleted({ to: userEmail, userName, courseTitle, courseSlug }).catch(
          (err) => console.error("[course-completed-email]", err)
        );
        issueCertificate({ userId, courseId }).catch(
          (err) => console.error("[issue-certificate]", err)
        );
      }
    }

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
    const { enrollmentId, alreadyCompleted, courseId, userId, userEmail, userName } =
      await resolveEnrollment(lessonId);

    await db.lessonProgress.upsert({
      where: { enrollmentId_lessonId: { enrollmentId, lessonId } },
      create: { enrollmentId, lessonId, completed: true },
      update: { completed: true },
    });

    if (!alreadyCompleted) {
      const { justCompleted, courseTitle, courseSlug } =
        await checkAndMarkCourseCompleted(enrollmentId, courseId);
      if (justCompleted) {
        sendCourseCompleted({ to: userEmail, userName, courseTitle, courseSlug }).catch(
          (err) => console.error("[course-completed-email]", err)
        );
        issueCertificate({ userId, courseId }).catch(
          (err) => console.error("[issue-certificate]", err)
        );
      }
    }

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
