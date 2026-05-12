"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { sendCourseCompleted } from "@/lib/emails/senders";

type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

interface SubmittedAnswer {
  questionId: string;
  answer: string;
}

// Auto-grade MC/TF immediately; SHORT_ANSWER: exact-match if correctAnswer set,
// otherwise queued for instructor review (pending=true).
export async function submitQuizAttempt(
  quizId: string,
  answers: SubmittedAnswer[]
): Promise<ActionResult<{ attemptId: string; score: number; passed: boolean; pending: boolean }>> {
  const session = await auth();
  if (!session) return { ok: false, error: "Unauthorized" };

  const quiz = await db.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: true,
      lesson: { include: { module: { include: { course: { select: { id: true, slug: true } } } } } },
    },
  });
  if (!quiz) return { ok: false, error: "Quiz not found" };
  if (!quiz.lesson) return { ok: false, error: "Quiz not attached to a lesson" };

  const courseId = quiz.lesson.module.course.id;
  const courseSlug = quiz.lesson.module.course.slug;
  const lessonId = quiz.lesson.id;

  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId } },
    select: { id: true, completedAt: true },
  });
  if (!enrollment) return { ok: false, error: "Not enrolled" };

  // Retry limit
  const priorAttempts = await db.quizAttempt.count({
    where: { quizId, userId: session.user.id },
  });
  if (quiz.maxRetries > 0 && priorAttempts >= quiz.maxRetries + 1) {
    return { ok: false, error: "Maximum attempts reached" };
  }

  // Grade
  let earned = 0;
  let possible = 0;
  let hasPending = false;
  const graded: Array<SubmittedAnswer & { isCorrect: boolean | null; pointsEarned: number }> = [];

  for (const q of quiz.questions) {
    possible += q.points;
    const submitted = answers.find((a) => a.questionId === q.id);
    const answer = submitted?.answer?.trim() ?? "";

    if (q.type === "MULTIPLE_CHOICE" || q.type === "TRUE_FALSE") {
      const correct = (q.correctAnswer ?? "").trim().toLowerCase() === answer.toLowerCase();
      if (correct) earned += q.points;
      graded.push({ questionId: q.id, answer, isCorrect: correct, pointsEarned: correct ? q.points : 0 });
    } else {
      // SHORT_ANSWER
      if (q.correctAnswer && q.correctAnswer.trim().length > 0) {
        const correct = q.correctAnswer.trim().toLowerCase() === answer.toLowerCase();
        if (correct) earned += q.points;
        graded.push({ questionId: q.id, answer, isCorrect: correct, pointsEarned: correct ? q.points : 0 });
      } else {
        hasPending = true;
        graded.push({ questionId: q.id, answer, isCorrect: null, pointsEarned: 0 });
      }
    }
  }

  const score = possible > 0 ? Math.round((earned / possible) * 100) : 0;
  // If there are pending SA questions, we hold off on final pass/fail until graded.
  const passed = !hasPending && score >= quiz.passThreshold;

  const attempt = await db.quizAttempt.create({
    data: {
      quizId,
      userId: session.user.id,
      completedAt: hasPending ? null : new Date(),
      score: hasPending ? null : score,
      passed: hasPending ? null : passed,
      answers: graded as unknown as object,
    },
  });

  // Mark lesson complete if passed and no pending
  if (passed) {
    await db.lessonProgress.upsert({
      where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId } },
      create: { enrollmentId: enrollment.id, lessonId, completed: true },
      update: { completed: true },
    });

    // Check course completion
    if (!enrollment.completedAt) {
      const [totalLessons, completedLessons] = await Promise.all([
        db.lesson.count({ where: { module: { courseId } } }),
        db.lessonProgress.count({
          where: { enrollmentId: enrollment.id, completed: true },
        }),
      ]);
      if (totalLessons > 0 && completedLessons >= totalLessons) {
        const updated = await db.enrollment.updateMany({
          where: { id: enrollment.id, completedAt: null },
          data: { completedAt: new Date() },
        });
        if (updated.count > 0) {
          const courseInfo = await db.course.findUnique({
            where: { id: courseId },
            select: { title: true, slug: true },
          });
          if (courseInfo && session.user.email) {
            sendCourseCompleted({
              to: session.user.email,
              userName: session.user.name?.split(" ")[0] ?? "there",
              courseTitle: courseInfo.title,
              courseSlug: courseInfo.slug,
            }).catch((err) => console.error("[course-completed-email]", err));
          }
        }
      }
    }
  }

  revalidatePath(`/courses/${courseSlug}/learn`);
  return {
    ok: true,
    data: { attemptId: attempt.id, score, passed, pending: hasPending },
  };
}

// Admin grading: set the SA answers' correctness and recompute score/passed
export async function gradeQuizAttempt(
  attemptId: string,
  manualGrades: Array<{ questionId: string; isCorrect: boolean }>
): Promise<ActionResult> {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") return { ok: false, error: "Unauthorized" };

  const attempt = await db.quizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      quiz: {
        include: {
          questions: true,
          lesson: {
            include: { module: { include: { course: { select: { id: true, slug: true } } } } },
          },
        },
      },
    },
  });
  if (!attempt) return { ok: false, error: "Attempt not found" };
  if (!attempt.quiz.lesson) return { ok: false, error: "Quiz no longer attached to a lesson" };

  const existing = (attempt.answers as unknown as Array<{
    questionId: string;
    answer: string;
    isCorrect: boolean | null;
    pointsEarned: number;
  }>) ?? [];

  const updated = existing.map((a) => {
    const manual = manualGrades.find((m) => m.questionId === a.questionId);
    if (manual) {
      const q = attempt.quiz.questions.find((qq) => qq.id === a.questionId);
      const pts = q?.points ?? 0;
      return { ...a, isCorrect: manual.isCorrect, pointsEarned: manual.isCorrect ? pts : 0 };
    }
    return a;
  });

  const earned = updated.reduce((s, a) => s + a.pointsEarned, 0);
  const possible = attempt.quiz.questions.reduce((s, q) => s + q.points, 0);
  const score = possible > 0 ? Math.round((earned / possible) * 100) : 0;
  const passed = score >= attempt.quiz.passThreshold;

  await db.quizAttempt.update({
    where: { id: attemptId },
    data: {
      score,
      passed,
      completedAt: new Date(),
      answers: updated as unknown as object,
    },
  });

  // Mark lesson complete if passed
  if (passed) {
    const courseId = attempt.quiz.lesson.module.course.id;
    const enrollment = await db.enrollment.findUnique({
      where: { userId_courseId: { userId: attempt.userId, courseId } },
      select: { id: true },
    });
    if (enrollment) {
      await db.lessonProgress.upsert({
        where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId: attempt.quiz.lesson.id } },
        create: { enrollmentId: enrollment.id, lessonId: attempt.quiz.lesson.id, completed: true },
        update: { completed: true },
      });
    }
  }

  revalidatePath("/admin/grading");
  return { ok: true };
}
