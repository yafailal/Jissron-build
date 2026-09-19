"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized");
  return session;
}

async function log(userId: string, action: string, metadata?: object) {
  try {
    await db.activityLog.create({
      data: { userId, action, entity: "Payout", entityId: "—", metadata: metadata ?? {} },
    });
  } catch {
    /* non-fatal */
  }
}

/**
 * Mark all currently-pending PAID orders for this instructor as paid out.
 * Records the timestamp on each order so future loads exclude them from pending.
 */
export async function markInstructorPaidOut(instructorId: string): Promise<ActionResult<{ count: number }>> {
  try {
    const session = await requireAdmin();
    const now = new Date();
    const result = await db.order.updateMany({
      where: {
        status: "PAID",
        instructorPayoutAt: null,
        OR: [
          { course: { instructorId } },
          { liveSession: { hostId: instructorId } },
          { consultBooking: { consultant: { userId: instructorId } } },
        ],
      },
      data: { instructorPayoutAt: now },
    });
    await log(session.user.id, "INSTRUCTOR_PAYOUT_MARKED", { instructorId, count: result.count, at: now.toISOString() });
    revalidatePath("/admin/payouts");
    return { ok: true, data: { count: result.count } };
  } catch (err) {
    console.error(err);
    return { ok: false, error: "Failed to mark as paid out" };
  }
}

/**
 * Undo a payout — reset instructorPayoutAt to null for ALL orders of this instructor.
 * Use sparingly (correcting mistakes). Logs the action with a count.
 */
export async function undoInstructorPayout(instructorId: string): Promise<ActionResult<{ count: number }>> {
  try {
    const session = await requireAdmin();
    const result = await db.order.updateMany({
      where: {
        status: "PAID",
        instructorPayoutAt: { not: null },
        OR: [
          { course: { instructorId } },
          { liveSession: { hostId: instructorId } },
          { consultBooking: { consultant: { userId: instructorId } } },
        ],
      },
      data: { instructorPayoutAt: null },
    });
    await log(session.user.id, "INSTRUCTOR_PAYOUT_UNDONE", { instructorId, count: result.count });
    revalidatePath("/admin/payouts");
    return { ok: true, data: { count: result.count } };
  } catch (err) {
    console.error(err);
    return { ok: false, error: "Failed to undo payout" };
  }
}
