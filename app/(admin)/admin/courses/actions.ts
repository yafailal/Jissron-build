"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import type { Prisma } from "@prisma/client";
import { CourseSchema, type CourseFormValues, type FAQFormValues, type LessonFormValues } from "./schema";

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
      });
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
          await tx.lesson.deleteMany({
            where: { moduleId: mod.id, id: { notIn: incomingLessonIds } },
          });
          for (const lesson of mod.lessons) {
            if (lesson.id) {
              await tx.lesson.update({
                where: { id: lesson.id },
                data: buildLessonData(lesson),
              });
            } else {
              await tx.lesson.create({
                data: { moduleId: mod.id, ...buildLessonData(lesson) },
              });
            }
          }
        } else {
          await tx.module.create({
            data: {
              courseId: id,
              title: mod.title,
              order: mod.order,
              lessons: {
                create: mod.lessons.map((l) => buildLessonData(l)),
              },
            },
          });
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
