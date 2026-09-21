"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import type { Prisma } from "@prisma/client";
import { LiveSessionSchema, type LiveSessionFormValues } from "./schema";

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
      data: { userId, action, entity: "LiveSession", entityId, metadata },
    });
  } catch {
    // non-fatal
  }
}

function revalidateLive() {
  revalidatePath("/admin/live");
  revalidatePath("/");
  revalidatePath("/live");
}

export async function createLiveSession(
  values: LiveSessionFormValues
): Promise<ActionResult<{ id: string; slug: string }>> {
  try {
    const session = await requireAdmin();
    const parsed = LiveSessionSchema.safeParse(values);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.errors[0]?.message ?? "Validation failed" };
    }

    const existing = await db.liveSession.findUnique({ where: { slug: parsed.data.slug } });
    if (existing) return { ok: false, error: "A session with this slug already exists" };

    const ls = await db.liveSession.create({
      data: {
        ...parsed.data,
        priceCents: parsed.data.priceUsdCents,
        startsAt: new Date(parsed.data.startsAt),
        meetingUrl: parsed.data.meetingUrl ?? null,
        recordingUrl: parsed.data.recordingUrl ?? null,
      },
    });

    await logActivity(session.user.id, "LIVE_CREATED", ls.id, { title: ls.title });
    revalidateLive();
    return { ok: true, data: { id: ls.id, slug: ls.slug } };
  } catch (err) {
    console.error(err);
    return { ok: false, error: "Failed to create session" };
  }
}

export async function updateLiveSession(
  id: string,
  values: LiveSessionFormValues
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const parsed = LiveSessionSchema.safeParse(values);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.errors[0]?.message ?? "Validation failed" };
    }

    await db.liveSession.update({
      where: { id },
      data: {
        ...parsed.data,
        priceCents: parsed.data.priceUsdCents,
        startsAt: new Date(parsed.data.startsAt),
        meetingUrl: parsed.data.meetingUrl ?? null,
      },
    });

    await logActivity(session.user.id, "LIVE_UPDATED", id, { title: parsed.data.title });
    revalidateLive();
    return { ok: true };
  } catch (err) {
    console.error(err);
    return { ok: false, error: "Failed to update session" };
  }
}

export async function deleteLiveSession(id: string): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const ls = await db.liveSession.findUnique({ where: { id } });
    if (!ls) return { ok: false, error: "Session not found" };

    await db.liveSession.delete({ where: { id } });
    await logActivity(session.user.id, "LIVE_DELETED", id, { title: ls.title });
    revalidateLive();
    return { ok: true };
  } catch (err) {
    console.error(err);
    return { ok: false, error: "Failed to delete session" };
  }
}

export async function setLiveSessionStatus(
  id: string,
  status: "SCHEDULED" | "LIVE" | "ENDED" | "CANCELLED"
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const ls = await db.liveSession.findUnique({ where: { id }, select: { id: true, title: true } });
    if (!ls) return { ok: false, error: "Session not found" };

    await db.liveSession.update({ where: { id }, data: { status } });
    await logActivity(session.user.id, `LIVE_${status}`, id, { title: ls.title });
    revalidateLive();
    return { ok: true };
  } catch (err) {
    console.error(err);
    return { ok: false, error: "Failed to update status" };
  }
}

export async function bulkDeleteLiveSessions(ids: string[]): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    await db.liveSession.deleteMany({ where: { id: { in: ids } } });
    await logActivity(session.user.id, "LIVE_BULK_DELETED", "multiple", { ids });
    revalidateLive();
    return { ok: true };
  } catch (err) {
    console.error(err);
    return { ok: false, error: "Failed to delete sessions" };
  }
}
