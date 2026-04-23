"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import type { Prisma } from "@prisma/client";
import { ConsultantSchema, type ConsultantFormValues } from "./schema";

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
      data: { userId, action, entity: "Consultant", entityId, metadata },
    });
  } catch {
    // non-fatal
  }
}

function revalidateConsultants() {
  revalidatePath("/admin/consultants");
  revalidatePath("/");
  revalidatePath("/consultants");
}

function buildAvailabilityJson(days: string[], typicalHours: string | null | undefined) {
  return days.map((day) => ({ day, hours: typicalHours ?? "" }));
}

export async function createConsultant(
  values: ConsultantFormValues
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireAdmin();
    const parsed = ConsultantSchema.safeParse(values);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.errors[0]?.message ?? "Validation failed" };
    }

    const data = parsed.data;

    let targetUserId = data.userId;

    // Create new user if needed
    if (!targetUserId) {
      const existing = await db.user.findUnique({ where: { email: data.newUserEmail! } });
      if (existing) {
        targetUserId = existing.id;
      } else {
        const newUser = await db.user.create({
          data: {
            name: data.newUserName!,
            email: data.newUserEmail!,
            role: "INSTRUCTOR",
          },
        });
        targetUserId = newUser.id;
      }
    }

    // Check if consultant already exists for this user
    const existingConsultant = await db.consultant.findUnique({ where: { userId: targetUserId } });
    if (existingConsultant) {
      return { ok: false, error: "This user is already a consultant" };
    }

    const consultant = await db.consultant.create({
      data: {
        userId: targetUserId,
        tagline: data.tagline ?? null,
        bio: data.bio,
        ratePerSession: data.ratePerSession,
        durationMins: data.durationMins,
        skills: data.skills,
        avatarGradient: data.avatarUrl ?? null,
        availability: buildAvailabilityJson(data.availableDays, data.typicalHours),
        acceptsNew: data.acceptsNew,
        isFeatured: data.isFeatured,
      },
    });

    await logActivity(session.user.id, "CONSULTANT_CREATED", consultant.id, { userId: targetUserId });
    revalidateConsultants();
    return { ok: true, data: { id: consultant.id } };
  } catch (err) {
    console.error(err);
    return { ok: false, error: "Failed to create consultant" };
  }
}

export async function updateConsultant(
  id: string,
  values: ConsultantFormValues
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const parsed = ConsultantSchema.safeParse(values);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.errors[0]?.message ?? "Validation failed" };
    }

    const data = parsed.data;

    await db.consultant.update({
      where: { id },
      data: {
        tagline: data.tagline ?? null,
        bio: data.bio,
        ratePerSession: data.ratePerSession,
        durationMins: data.durationMins,
        skills: data.skills,
        avatarGradient: data.avatarUrl ?? null,
        availability: buildAvailabilityJson(data.availableDays, data.typicalHours),
        acceptsNew: data.acceptsNew,
        isFeatured: data.isFeatured,
      },
    });

    await logActivity(session.user.id, "CONSULTANT_UPDATED", id);
    revalidateConsultants();
    return { ok: true };
  } catch (err) {
    console.error(err);
    return { ok: false, error: "Failed to update consultant" };
  }
}

export async function deleteConsultant(id: string): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    await db.consultant.delete({ where: { id } });
    await logActivity(session.user.id, "CONSULTANT_DELETED", id);
    revalidateConsultants();
    return { ok: true };
  } catch (err) {
    console.error(err);
    return { ok: false, error: "Failed to delete consultant" };
  }
}

export async function bulkDeleteConsultants(ids: string[]): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    await db.consultant.deleteMany({ where: { id: { in: ids } } });
    await logActivity(session.user.id, "CONSULTANT_BULK_DELETED", "multiple", { ids });
    revalidateConsultants();
    return { ok: true };
  } catch (err) {
    console.error(err);
    return { ok: false, error: "Failed to delete consultants" };
  }
}

export async function getAvailableUsers() {
  const consultantUserIds = await db.consultant.findMany({ select: { userId: true } });
  const taken = new Set(consultantUserIds.map((c) => c.userId));
  const users = await db.user.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, role: true },
  });
  return users.filter((u) => !taken.has(u.id));
}
