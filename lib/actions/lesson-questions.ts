"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

// Anyone enrolled in the course (or the course instructor / an admin) can
// post questions and replies on a lesson.
async function resolveLessonAccess(lessonId: string) {
  const session = await auth();
  if (!session) return { ok: false as const, error: "Unauthorized" };

  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      module: {
        select: {
          course: {
            select: { id: true, slug: true, instructorId: true },
          },
        },
      },
    },
  });
  if (!lesson) return { ok: false as const, error: "Lesson not found" };

  const course = lesson.module.course;
  const userId = session.user.id;
  const role = session.user.role;

  if (role === "ADMIN" || course.instructorId === userId) {
    return { ok: true as const, lesson, course, userId, role };
  }

  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: course.id } },
    select: { id: true, status: true },
  });
  if (!enrollment || enrollment.status !== "ACTIVE") {
    return { ok: false as const, error: "Not enrolled in this course" };
  }

  return { ok: true as const, lesson, course, userId, role };
}

export async function postLessonQuestion(
  lessonId: string,
  body: string
): Promise<ActionResult<{ id: string }>> {
  const trimmed = body.trim();
  if (trimmed.length === 0) return { ok: false, error: "Question can't be empty" };
  if (trimmed.length > 4000) return { ok: false, error: "Too long (max 4000 chars)" };

  const access = await resolveLessonAccess(lessonId);
  if (!access.ok) return access;

  const question = await db.lessonQuestion.create({
    data: { lessonId, userId: access.userId, body: trimmed },
    select: { id: true },
  });

  revalidatePath(`/courses/${access.course.slug}/learn`);
  return { ok: true, data: { id: question.id } };
}

export async function postLessonQuestionReply(
  questionId: string,
  body: string
): Promise<ActionResult<{ id: string }>> {
  const trimmed = body.trim();
  if (trimmed.length === 0) return { ok: false, error: "Reply can't be empty" };
  if (trimmed.length > 4000) return { ok: false, error: "Too long (max 4000 chars)" };

  const session = await auth();
  if (!session) return { ok: false, error: "Unauthorized" };

  const question = await db.lessonQuestion.findUnique({
    where: { id: questionId },
    select: { lessonId: true },
  });
  if (!question) return { ok: false, error: "Question not found" };

  const access = await resolveLessonAccess(question.lessonId);
  if (!access.ok) return access;

  const reply = await db.lessonQuestionReply.create({
    data: { questionId, userId: access.userId, body: trimmed },
    select: { id: true },
  });

  revalidatePath(`/courses/${access.course.slug}/learn`);
  return { ok: true, data: { id: reply.id } };
}

export async function deleteLessonQuestion(questionId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Unauthorized" };

  const question = await db.lessonQuestion.findUnique({
    where: { id: questionId },
    select: {
      userId: true,
      lesson: {
        select: { module: { select: { course: { select: { slug: true, instructorId: true } } } } },
      },
    },
  });
  if (!question) return { ok: false, error: "Question not found" };

  const canDelete =
    session.user.role === "ADMIN" ||
    question.userId === session.user.id ||
    question.lesson.module.course.instructorId === session.user.id;
  if (!canDelete) return { ok: false, error: "Not allowed" };

  await db.lessonQuestion.delete({ where: { id: questionId } });
  revalidatePath(`/courses/${question.lesson.module.course.slug}/learn`);
  return { ok: true };
}

export async function deleteLessonQuestionReply(replyId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Unauthorized" };

  const reply = await db.lessonQuestionReply.findUnique({
    where: { id: replyId },
    select: {
      userId: true,
      question: {
        select: {
          lesson: {
            select: { module: { select: { course: { select: { slug: true, instructorId: true } } } } },
          },
        },
      },
    },
  });
  if (!reply) return { ok: false, error: "Reply not found" };

  const canDelete =
    session.user.role === "ADMIN" ||
    reply.userId === session.user.id ||
    reply.question.lesson.module.course.instructorId === session.user.id;
  if (!canDelete) return { ok: false, error: "Not allowed" };

  await db.lessonQuestionReply.delete({ where: { id: replyId } });
  revalidatePath(`/courses/${reply.question.lesson.module.course.slug}/learn`);
  return { ok: true };
}

export async function toggleLessonQuestionResolved(
  questionId: string
): Promise<ActionResult<{ resolved: boolean }>> {
  const session = await auth();
  if (!session) return { ok: false, error: "Unauthorized" };

  const question = await db.lessonQuestion.findUnique({
    where: { id: questionId },
    select: {
      resolved: true,
      userId: true,
      lesson: {
        select: { module: { select: { course: { select: { slug: true, instructorId: true } } } } },
      },
    },
  });
  if (!question) return { ok: false, error: "Question not found" };

  const canToggle =
    session.user.role === "ADMIN" ||
    question.userId === session.user.id ||
    question.lesson.module.course.instructorId === session.user.id;
  if (!canToggle) return { ok: false, error: "Not allowed" };

  const next = !question.resolved;
  await db.lessonQuestion.update({
    where: { id: questionId },
    data: { resolved: next },
  });

  revalidatePath(`/courses/${question.lesson.module.course.slug}/learn`);
  return { ok: true, data: { resolved: next } };
}
