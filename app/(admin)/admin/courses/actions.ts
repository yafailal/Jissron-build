"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import type { Prisma } from "@prisma/client";
import { CourseSchema, type CourseFormValues } from "./schema";

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

    const { modules, ...rest } = parsed.data;

    const existing = await db.course.findUnique({ where: { slug: rest.slug } });
    if (existing) return { ok: false, error: "A course with this slug already exists" };

    const course = await db.course.create({
      data: {
        ...rest,
        publishedAt: rest.status === "PUBLISHED" ? new Date() : null,
        modules: {
          create: modules.map((mod) => ({
            title: mod.title,
            order: mod.order,
            lessons: {
              create: mod.lessons.map((lesson) => ({
                title: lesson.title,
                videoUrl: lesson.videoUrl,
                durationSeconds: lesson.durationSeconds,
                isPreview: lesson.isPreview,
                order: lesson.order,
              })),
            },
          })),
        },
      },
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

    const { modules, ...rest } = parsed.data;

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
                data: {
                  title: lesson.title,
                  videoUrl: lesson.videoUrl,
                  durationSeconds: lesson.durationSeconds,
                  isPreview: lesson.isPreview,
                  order: lesson.order,
                },
              });
            } else {
              await tx.lesson.create({
                data: {
                  moduleId: mod.id,
                  title: lesson.title,
                  videoUrl: lesson.videoUrl,
                  durationSeconds: lesson.durationSeconds,
                  isPreview: lesson.isPreview,
                  order: lesson.order,
                },
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
                create: mod.lessons.map((l) => ({
                  title: l.title,
                  videoUrl: l.videoUrl,
                  durationSeconds: l.durationSeconds,
                  isPreview: l.isPreview,
                  order: l.order,
                })),
              },
            },
          });
        }
      }

      await tx.course.update({
        where: { id },
        data: {
          ...rest,
          publishedAt: wasPublished ? new Date() : existing.publishedAt,
        },
      });
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
    return { ok: false, error: "Failed to delete course" };
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
