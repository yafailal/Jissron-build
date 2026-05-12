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
        ratePerSessionMadCents: data.ratePerSessionMadCents,
        ratePerSessionUsdCents: data.ratePerSessionUsdCents,
        ratePerSession: data.ratePerSessionUsdCents,
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
        ratePerSessionMadCents: data.ratePerSessionMadCents,
        ratePerSessionUsdCents: data.ratePerSessionUsdCents,
        ratePerSession: data.ratePerSessionUsdCents,
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

// ─── Calendar: recurring availability slots ──────────────────────────────────

// Stored on Consultant.availability as JSON:
// [{ day: 'mon' | 'tue' | ..., slots: [{ start: 'HH:mm', end: 'HH:mm' }, ...] }]
export type AvailabilityDay = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
export interface AvailabilitySlot {
  start: string; // "HH:mm"
  end: string;
}
export interface AvailabilityDayEntry {
  day: AvailabilityDay;
  slots: AvailabilitySlot[];
}

const TIME_RE = /^\d{2}:\d{2}$/;
const DAYS: AvailabilityDay[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

function validateAvailability(input: unknown): AvailabilityDayEntry[] | null {
  if (!Array.isArray(input)) return null;
  const out: AvailabilityDayEntry[] = [];
  for (const entry of input) {
    if (!entry || typeof entry !== "object") return null;
    const day = (entry as { day?: string }).day;
    const slotsRaw = (entry as { slots?: unknown }).slots;
    if (!day || !DAYS.includes(day as AvailabilityDay)) return null;
    if (!Array.isArray(slotsRaw)) return null;
    const slots: AvailabilitySlot[] = [];
    for (const s of slotsRaw) {
      if (!s || typeof s !== "object") return null;
      const start = (s as { start?: string }).start;
      const end = (s as { end?: string }).end;
      if (!start || !end || !TIME_RE.test(start) || !TIME_RE.test(end)) return null;
      if (start >= end) return null;
      slots.push({ start, end });
    }
    out.push({ day: day as AvailabilityDay, slots });
  }
  return out;
}

export async function updateConsultantCalendar(
  id: string,
  availability: unknown,
  timezone: string
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const cleaned = validateAvailability(availability);
    if (cleaned === null) {
      return { ok: false, error: "Invalid availability format" };
    }
    if (typeof timezone !== "string" || timezone.length === 0 || timezone.length > 64) {
      return { ok: false, error: "Invalid timezone" };
    }

    const c = await db.consultant.findUnique({ where: { id }, select: { id: true } });
    if (!c) return { ok: false, error: "Consultant not found" };

    await db.consultant.update({
      where: { id },
      data: {
        availability: cleaned as unknown as Prisma.InputJsonValue,
        timezone,
      },
    });
    await logActivity(session.user.id, "CONSULTANT_CALENDAR_UPDATED", id, { slots: cleaned.length, timezone });
    revalidateConsultants();
    return { ok: true };
  } catch (err) {
    console.error(err);
    return { ok: false, error: "Failed to update calendar" };
  }
}

// ─── Bookings: cancel / reschedule ────────────────────────────────────────────

export async function cancelConsultBooking(bookingId: string): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const booking = await db.consultBooking.findUnique({
      where: { id: bookingId },
      select: { id: true, consultantId: true, status: true },
    });
    if (!booking) return { ok: false, error: "Booking not found" };
    if (booking.status === "CANCELLED") return { ok: false, error: "Already cancelled" };

    await db.consultBooking.update({
      where: { id: bookingId },
      data: { status: "CANCELLED" },
    });
    await logActivity(session.user.id, "CONSULT_BOOKING_CANCELLED", bookingId, {
      consultantId: booking.consultantId,
    });
    revalidatePath(`/admin/consultants/${booking.consultantId}`);
    revalidateConsultants();
    return { ok: true };
  } catch (err) {
    console.error(err);
    return { ok: false, error: "Failed to cancel booking" };
  }
}

export async function rescheduleConsultBooking(
  bookingId: string,
  newScheduledFor: string
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const date = new Date(newScheduledFor);
    if (Number.isNaN(date.getTime())) {
      return { ok: false, error: "Invalid date" };
    }
    const booking = await db.consultBooking.findUnique({
      where: { id: bookingId },
      select: { id: true, consultantId: true },
    });
    if (!booking) return { ok: false, error: "Booking not found" };

    await db.consultBooking.update({
      where: { id: bookingId },
      data: { scheduledFor: date, status: "CONFIRMED" },
    });
    await logActivity(session.user.id, "CONSULT_BOOKING_RESCHEDULED", bookingId, {
      consultantId: booking.consultantId,
      newScheduledFor: date.toISOString(),
    });
    revalidatePath(`/admin/consultants/${booking.consultantId}`);
    revalidateConsultants();
    return { ok: true };
  } catch (err) {
    console.error(err);
    return { ok: false, error: "Failed to reschedule booking" };
  }
}

export async function setConsultantAvailability(
  id: string,
  acceptsNew: boolean
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const c = await db.consultant.findUnique({ where: { id }, select: { id: true, userId: true } });
    if (!c) return { ok: false, error: "Consultant not found" };

    await db.consultant.update({ where: { id }, data: { acceptsNew } });
    await logActivity(
      session.user.id,
      acceptsNew ? "CONSULTANT_OPENED" : "CONSULTANT_CLOSED",
      id,
      { acceptsNew }
    );
    revalidateConsultants();
    return { ok: true };
  } catch (err) {
    console.error(err);
    return { ok: false, error: "Failed to update availability" };
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
