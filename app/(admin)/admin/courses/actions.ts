"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import type { Prisma } from "@prisma/client";
import { CourseSchema, type CourseFormValues, type FAQFormValues, type LessonFormValues, type QuizFormValues, type AssignmentFormValues } from "./schema";

type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized");
  return session;
}

async function logActivity(
  userId: string,
  action: string,
  entityId: string,
  metadata?: Prisma.InputJsonValue
) {
  try {
    await db.activityLog.create({
      data: { userId, action, entity: "Course", entityId, metadata },
    });
  } catch {
    // non-fatal
  }
}

function buildLessonData(lesson: LessonFormValues) {
  return {
    title: lesson.title,
    type: lesson.type,
    durationSeconds: lesson.durationSeconds,
    isPreview: lesson.isPreview,
    order: lesson.order,
    videoGuid: lesson.type === "VIDEO" ? (lesson.videoGuid ?? null) : null,
    videoUrl: lesson.type === "VIDEO" ? (lesson.videoUrl ?? null) : null,
    audioUrl: lesson.type === "AUDIO" ? (lesson.audioUrl ?? null) : null,
    pdfUrl: lesson.type === "PDF" ? (lesson.pdfUrl ?? null) : null,
    htmlContent: lesson.type === "HTML" ? (lesson.htmlContent ?? null) : null,
    textContent: lesson.type === "TEXT" ? (lesson.textContent ?? null) : null,
  };
}

type Tx = Parameters<Parameters<typeof db.$transaction>[0]>[0];

async function syncQuizForLesson(
  tx: Tx,
  lessonId: string,
  existingQuizId: string | null,
  quiz: QuizFormValues
): Promise<string> {
  let quizId = existingQuizId;
  if (quizId) {
    await tx.quiz.update({
      where: { id: quizId },
      data: {
        title: quiz.title,
        description: quiz.description ?? null,
        passThreshold: quiz.passThreshold,
        maxRetries: quiz.maxRetries,
        showCorrectAnswers: quiz.showCorrectAnswers,
        shuffleQuestions: quiz.shuffleQuestions,
      },
    });
  } else {
    const created = await tx.quiz.create({
      data: {
        title: quiz.title,
        description: quiz.description ?? null,
        passThreshold: quiz.passThreshold,
        maxRetries: quiz.maxRetries,
        showCorrectAnswers: quiz.showCorrectAnswers,
        shuffleQuestions: quiz.shuffleQuestions,
      },
    });
    quizId = created.id;
    await tx.lesson.update({ where: { id: lessonId }, data: { quizId } });
  }

  const incomingIds = quiz.questions.filter((q) => q.id).map((q) => q.id!);
  await tx.quizQuestion.deleteMany({
    where: { quizId, id: { notIn: incomingIds } },
  });
  for (let i = 0; i < quiz.questions.length; i++) {
    const q = quiz.questions[i];
    const payload = {
      type: q.type,
      prompt: q.prompt,
      points: q.points,
      order: i,
      options: q.options as Prisma.InputJsonValue,
      correctAnswer: q.correctAnswer ?? null,
      explanation: q.explanation ?? null,
    };
    if (q.id) {
      await tx.quizQuestion.update({ where: { id: q.id }, data: payload });
    } else {
      await tx.quizQuestion.create({ data: { quizId, ...payload } });
    }
  }
  return quizId;
}

async function syncAssignmentForLesson(
  tx: Tx,
  lessonId: string,
  existingAssignmentId: string | null,
  assignment: AssignmentFormValues
): Promise<string> {
  if (existingAssignmentId) {
    await tx.assignment.update({
      where: { id: existingAssignmentId },
      data: {
        title: assignment.title,
        instructions: assignment.instructions,
        maxFileSizeMb: assignment.maxFileSizeMb,
        allowedFileTypes: assignment.allowedFileTypes,
        dueOffsetDays: assignment.dueOffsetDays ?? null,
        passingGrade: assignment.passingGrade,
      },
    });
    return existingAssignmentId;
  }
  const created = await tx.assignment.create({
    data: {
      title: assignment.title,
      instructions: assignment.instructions,
      maxFileSizeMb: assignment.maxFileSizeMb,
      allowedFileTypes: assignment.allowedFileTypes,
      dueOffsetDays: assignment.dueOffsetDays ?? null,
      passingGrade: assignment.passingGrade,
    },
  });
  await tx.lesson.update({ where: { id: lessonId }, data: { assignmentId: created.id } });
  return created.id;
}

async function persistLessonExtras(
  tx: Tx,
  lessonId: string,
  lesson: LessonFormValues,
  existing: { quizId: string | null; assignmentId: string | null }
) {
  if (lesson.type === "QUIZ" && lesson.quiz) {
    await syncQuizForLesson(tx, lessonId, existing.quizId, lesson.quiz);
    if (existing.assignmentId) {
      await tx.assignmentSubmission.deleteMany({ where: { assignmentId: existing.assignmentId } });
      await tx.lesson.update({ where: { id: lessonId }, data: { assignmentId: null } });
      await tx.assignment.delete({ where: { id: existing.assignmentId } });
    }
    return;
  }
  if (lesson.type === "ASSIGNMENT" && lesson.assignment) {
    await syncAssignmentForLesson(tx, lessonId, existing.assignmentId, lesson.assignment);
    if (existing.quizId) {
      await tx.quizAttempt.deleteMany({ where: { quizId: existing.quizId } });
      await tx.lesson.update({ where: { id: lessonId }, data: { quizId: null } });
      await tx.quiz.delete({ where: { id: existing.quizId } });
    }
    return;
  }
  // Lesson is now neither QUIZ nor ASSIGNMENT — clear both if previously set
  if (existing.quizId) {
    await tx.quizAttempt.deleteMany({ where: { quizId: existing.quizId } });
    await tx.lesson.update({ where: { id: lessonId }, data: { quizId: null } });
    await tx.quiz.delete({ where: { id: existing.quizId } });
  }
  if (existing.assignmentId) {
    await tx.assignmentSubmission.deleteMany({ where: { assignmentId: existing.assignmentId } });
    await tx.lesson.update({ where: { id: lessonId }, data: { assignmentId: null } });
    await tx.assignment.delete({ where: { id: existing.assignmentId } });
  }
}

async function syncFAQs(
  tx: Parameters<Parameters<typeof db.$transaction>[0]>[0],
  courseId: string,
  faqs: FAQFormValues[]
) {
  const incomingIds = faqs.filter((f) => f.id).map((f) => f.id!);
  await tx.courseFAQ.deleteMany({
    where: { courseId, id: { notIn: incomingIds } },
  });
  for (let i = 0; i < faqs.length; i++) {
    const faq = faqs[i];
    if (faq.id) {
      await tx.courseFAQ.update({
        where: { id: faq.id },
        data: { question: faq.question, answer: faq.answer, order: i },
      });
    } else {
      await tx.courseFAQ.create({
        data: { courseId, question: faq.question, answer: faq.answer, order: i },
      });
    }
  }
}

function revalidateCourse(slug?: string) {
  revalidatePath("/admin/courses");
  revalidatePath("/");
  if (slug) revalidatePath(`/courses/${slug}`);
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createCourse(
  values: CourseFormValues
): Promise<ActionResult<{ id: string; slug: string }>> {
  try {
    const session = await requireAdmin();
    const parsed = CourseSchema.safeParse(values);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.errors[0]?.message ?? "Validation failed" };
    }

    const { modules, faqs, ...rest } = parsed.data;

    const existing = await db.course.findUnique({ where: { slug: rest.slug } });
    if (existing) return { ok: false, error: "A course with this slug already exists" };

    const course = await db.$transaction(async (tx) => {
      const created = await tx.course.create({
        data: {
          ...rest,
          priceCents: rest.priceUsdCents,
          oldPriceCents: rest.oldPriceUsdCents ?? null,
          publishedAt: rest.status === "PUBLISHED" ? new Date() : null,
          modules: {
            create: modules.map((mod) => ({
              title: mod.title,
              order: mod.order,
              lessons: {
                create: mod.lessons.map((lesson) => buildLessonData(lesson)),
              },
            })),
          },
        },
        include: { modules: { include: { lessons: true } } },
      });
      // Persist quiz/assignment for each newly-created lesson, matching by order index
      for (let mi = 0; mi < created.modules.length; mi++) {
        const createdMod = created.modules.find((m) => m.order === modules[mi].order) ?? created.modules[mi];
        const sortedLessons = [...createdMod.lessons].sort((a, b) => a.order - b.order);
        for (let li = 0; li < modules[mi].lessons.length; li++) {
          const formLesson = modules[mi].lessons[li];
          const dbLesson = sortedLessons.find((l) => l.order === formLesson.order) ?? sortedLessons[li];
          if (!dbLesson) continue;
          await persistLessonExtras(tx, dbLesson.id, formLesson, { quizId: null, assignmentId: null });
        }
      }
      await syncFAQs(tx, created.id, faqs);
      return created;
    });

    await logActivity(session.user.id, "COURSE_CREATED", course.id, { title: course.title });
    revalidateCourse(course.slug);
    return { ok: true, data: { id: course.id, slug: course.slug } };
  } catch (err) {
    console.error(err);
    return { ok: false, error: "Failed to create course" };
  }
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateCourse(
  id: string,
  values: CourseFormValues
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const parsed = CourseSchema.safeParse(values);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.errors[0]?.message ?? "Validation failed" };
    }

    const { modules, faqs, ...rest } = parsed.data;

    const existing = await db.course.findUnique({ where: { id } });
    if (!existing) return { ok: false, error: "Course not found" };

    // Detect publish event
    const wasPublished = existing.status !== "PUBLISHED" && rest.status === "PUBLISHED";

    await db.$transaction(async (tx) => {
      // Delete removed modules/lessons, then upsert
      const incomingModuleIds = modules.filter((m) => m.id).map((m) => m.id!);
      await tx.module.deleteMany({
        where: { courseId: id, id: { notIn: incomingModuleIds } },
      });

      for (const mod of modules) {
        const incomingLessonIds = mod.lessons.filter((l) => l.id).map((l) => l.id!);

        if (mod.id) {
          await tx.module.update({
            where: { id: mod.id },
            data: { title: mod.title, order: mod.order },
          });
          // Read existing lesson quiz/assignment FKs before destructive delete so we can
          // clean up orphaned Quiz/Assignment rows.
          const removedLessons = await tx.lesson.findMany({
            where: { moduleId: mod.id, id: { notIn: incomingLessonIds } },
            select: { id: true, quizId: true, assignmentId: true },
          });
          if (removedLessons.length > 0) {
            const removedLessonIds = removedLessons.map((l) => l.id);
            const removedQuizIds = removedLessons.map((l) => l.quizId).filter((x): x is string => !!x);
            const removedAssignmentIds = removedLessons
              .map((l) => l.assignmentId)
              .filter((x): x is string => !!x);
            await tx.lessonProgress.deleteMany({ where: { lessonId: { in: removedLessonIds } } });
            await tx.quizAttempt.deleteMany({ where: { quizId: { in: removedQuizIds } } });
            await tx.assignmentSubmission.deleteMany({
              where: { assignmentId: { in: removedAssignmentIds } },
            });
            await tx.lesson.deleteMany({ where: { id: { in: removedLessonIds } } });
            if (removedQuizIds.length) await tx.quiz.deleteMany({ where: { id: { in: removedQuizIds } } });
            if (removedAssignmentIds.length)
              await tx.assignment.deleteMany({ where: { id: { in: removedAssignmentIds } } });
          }
          for (const lesson of mod.lessons) {
            if (lesson.id) {
              const existingLesson = await tx.lesson.findUnique({
                where: { id: lesson.id },
                select: { quizId: true, assignmentId: true },
              });
              await tx.lesson.update({
                where: { id: lesson.id },
                data: buildLessonData(lesson),
              });
              await persistLessonExtras(tx, lesson.id, lesson, {
                quizId: existingLesson?.quizId ?? null,
                assignmentId: existingLesson?.assignmentId ?? null,
              });
            } else {
              const created = await tx.lesson.create({
                data: { moduleId: mod.id, ...buildLessonData(lesson) },
              });
              await persistLessonExtras(tx, created.id, lesson, { quizId: null, assignmentId: null });
            }
          }
        } else {
          const createdMod = await tx.module.create({
            data: {
              courseId: id,
              title: mod.title,
              order: mod.order,
              lessons: {
                create: mod.lessons.map((l) => buildLessonData(l)),
              },
            },
            include: { lessons: true },
          });
          const sortedLessons = [...createdMod.lessons].sort((a, b) => a.order - b.order);
          for (let li = 0; li < mod.lessons.length; li++) {
            const formLesson = mod.lessons[li];
            const dbLesson = sortedLessons.find((l) => l.order === formLesson.order) ?? sortedLessons[li];
            if (!dbLesson) continue;
            await persistLessonExtras(tx, dbLesson.id, formLesson, { quizId: null, assignmentId: null });
          }
        }
      }

      await tx.course.update({
        where: { id },
        data: {
          ...rest,
          priceCents: rest.priceUsdCents,
          oldPriceCents: rest.oldPriceUsdCents ?? null,
          publishedAt: wasPublished ? new Date() : existing.publishedAt,
        },
      });

      await syncFAQs(tx, id, faqs);
    });

    await logActivity(session.user.id, "COURSE_UPDATED", id, { title: rest.title });
    revalidateCourse(rest.slug);
    return { ok: true };
  } catch (err) {
    console.error(err);
    return { ok: false, error: "Failed to update course" };
  }
}

// ─── Delete ───────────────────────────────────────────────────────────────────

async function describeBlockingRelations(courseIds: string[]): Promise<string | null> {
  // Returns a human-readable summary of why these courses can't be deleted, or null if none.
  const blockers = await db.course.findMany({
    where: { id: { in: courseIds } },
    select: {
      id: true,
      title: true,
      _count: {
        select: {
          enrollments: true,
          orders: true,
          reviews: true,
          modules: true,
        },
      },
    },
  });
  const blocking = blockers.filter((c) =>
    c._count.enrollments > 0 || c._count.orders > 0 || c._count.reviews > 0
  );
  if (blocking.length === 0) return null;
  const lines = blocking.map((c) => {
    const parts: string[] = [];
    if (c._count.orders > 0) parts.push(`${c._count.orders} order${c._count.orders === 1 ? "" : "s"}`);
    if (c._count.enrollments > 0) parts.push(`${c._count.enrollments} enrollment${c._count.enrollments === 1 ? "" : "s"}`);
    if (c._count.reviews > 0) parts.push(`${c._count.reviews} review${c._count.reviews === 1 ? "" : "s"}`);
    return `“${c.title}” has ${parts.join(", ")}`;
  });
  return lines.join("; ") + ". Archive them instead.";
}

export async function deleteCourse(id: string): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const course = await db.course.findUnique({ where: { id } });
    if (!course) return { ok: false, error: "Course not found" };

    await db.course.delete({ where: { id } });
    await logActivity(session.user.id, "COURSE_DELETED", id, { title: course.title });
    revalidateCourse(course.slug);
    return { ok: true };
  } catch (err) {
    console.error(err);
    // Foreign-key violation — surface what's blocking
    const errCode = (err as { code?: string })?.code;
    if (errCode === "P2003" || errCode === "P2014") {
      const reason = await describeBlockingRelations([id]).catch(() => null);
      if (reason) return { ok: false, error: reason };
    }
    return { ok: false, error: "Failed to delete course" };
  }
}

// ─── Force delete (cascade — destructive) ────────────────────────────────────

// Deletes a course AND every related record: modules + lessons (via cascade),
// LessonProgress, QuizAttempt, AssignmentSubmission, Quiz, Assignment, Review,
// Enrollment, Order. Wrapped in a transaction. Irreversible.
export async function bulkForceDeleteCourses(ids: string[]): Promise<ActionResult<{ counts: Record<string, number> }>> {
  if (ids.length === 0) return { ok: false, error: "No courses selected" };
  try {
    const session = await requireAdmin();

    // Gather every related child id before we start deleting.
    const courses = await db.course.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        title: true,
        modules: {
          select: {
            id: true,
            lessons: { select: { id: true, quizId: true, assignmentId: true } },
          },
        },
      },
    });
    if (courses.length === 0) return { ok: false, error: "No matching courses found" };

    const lessons = courses.flatMap((c) => c.modules.flatMap((m) => m.lessons));
    const lessonIds = lessons.map((l) => l.id);
    const quizIds = lessons.map((l) => l.quizId).filter((x): x is string => !!x);
    const assignmentIds = lessons.map((l) => l.assignmentId).filter((x): x is string => !!x);

    const counts = {
      courses: courses.length,
      lessons: lessonIds.length,
      quizzes: quizIds.length,
      assignments: assignmentIds.length,
    };

    // Order matters — leaf children first, then parents.
    // Module → Lesson is onDelete: Cascade, so deleting modules wipes lessons.
    // But LessonProgress / QuizAttempt / AssignmentSubmission default to Restrict,
    // so they must be removed before their parents.
    await db.$transaction([
      // Leaf records that block deeper cascades
      db.lessonProgress.deleteMany({ where: { lessonId: { in: lessonIds } } }),
      db.quizAttempt.deleteMany({ where: { quizId: { in: quizIds } } }),
      db.assignmentSubmission.deleteMany({ where: { assignmentId: { in: assignmentIds } } }),
      // Now safe to drop modules — lessons cascade with them; the lesson rows
      // hold FK to Quiz/Assignment (referencing side) so deleting lessons is fine.
      db.module.deleteMany({ where: { courseId: { in: ids } } }),
      // Quiz cascades QuizQuestion automatically; Assignment has no remaining children.
      db.quiz.deleteMany({ where: { id: { in: quizIds } } }),
      db.assignment.deleteMany({ where: { id: { in: assignmentIds } } }),
      // Course-level children that the schema doesn't auto-cascade.
      db.review.deleteMany({ where: { courseId: { in: ids } } }),
      db.enrollment.deleteMany({ where: { courseId: { in: ids } } }),
      db.order.deleteMany({ where: { courseId: { in: ids } } }),
      // Finally, the courses themselves. CourseFAQ auto-cascades.
      db.course.deleteMany({ where: { id: { in: ids } } }),
    ]);

    await logActivity(session.user.id, "COURSE_BULK_FORCE_DELETED", "multiple", {
      ids,
      titles: courses.map((c) => c.title),
      counts,
    });
    revalidateCourse();
    return { ok: true, data: { counts } };
  } catch (err) {
    console.error(err);
    return {
      ok: false,
      error: `Force-delete failed: ${(err as Error)?.message?.slice(0, 200) ?? "unknown"}`,
    };
  }
}

// ─── Bulk delete ──────────────────────────────────────────────────────────────

export async function bulkDeleteCourses(ids: string[]): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    await db.course.deleteMany({ where: { id: { in: ids } } });
    await logActivity(session.user.id, "COURSE_BULK_DELETED", "multiple", { ids });
    revalidateCourse();
    return { ok: true };
  } catch (err) {
    console.error(err);
    const errCode = (err as { code?: string })?.code;
    if (errCode === "P2003" || errCode === "P2014") {
      const reason = await describeBlockingRelations(ids).catch(() => null);
      if (reason) return { ok: false, error: reason };
    }
    return { ok: false, error: "Failed to delete courses" };
  }
}

// ─── Publish / Unpublish ──────────────────────────────────────────────────────

export async function setCourseStatus(
  id: string,
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED"
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const course = await db.course.findUnique({ where: { id } });
    if (!course) return { ok: false, error: "Course not found" };

    const wasPublished = course.status !== "PUBLISHED" && status === "PUBLISHED";
    await db.course.update({
      where: { id },
      data: {
        status,
        publishedAt: wasPublished ? new Date() : course.publishedAt,
      },
    });

    await logActivity(session.user.id, `COURSE_${status}`, id, { title: course.title });
    revalidateCourse(course.slug);
    return { ok: true };
  } catch (err) {
    console.error(err);
    return { ok: false, error: "Failed to update status" };
  }
}
