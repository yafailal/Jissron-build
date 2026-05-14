import { db } from "@/lib/db";

export interface AvailabilitySlot { start: string; end: string }
export interface AvailabilityDayEntry { day: string; slots: AvailabilitySlot[] }

export const DAYS_ORDER = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

/**
 * Parse the consultant.availability JSON into a strongly-shaped array,
 * tolerating older shapes (e.g. `{day, hours: "..."}`) by treating them as
 * having no slots. The homepage already crashed once on bad shapes; never
 * again.
 */
export function parseAvailability(raw: unknown): AvailabilityDayEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: AvailabilityDayEntry[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const day = (entry as { day?: unknown }).day;
    const slotsRaw = (entry as { slots?: unknown }).slots;
    if (typeof day !== "string") continue;
    if (!Array.isArray(slotsRaw)) continue;
    const slots: AvailabilitySlot[] = [];
    for (const s of slotsRaw) {
      if (!s || typeof s !== "object") continue;
      const start = (s as { start?: unknown }).start;
      const end = (s as { end?: unknown }).end;
      if (typeof start !== "string" || typeof end !== "string") continue;
      slots.push({ start, end });
    }
    out.push({ day, slots });
  }
  return out;
}

export async function listPublicConsultants() {
  return db.consultant.findMany({
    where: { acceptsNew: true },
    include: {
      user: { select: { id: true, name: true, image: true } },
      category: { select: { id: true, name: true, slug: true } },
    },
    orderBy: [{ isFeatured: "desc" }, { avgRating: "desc" }, { totalSessions: "desc" }],
  });
}

export async function getConsultantById(id: string) {
  return db.consultant.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, image: true, bio: true } },
      category: { select: { id: true, name: true, slug: true } },
    },
  });
}

/**
 * Generate concrete bookable 30-min slots for the next `daysAhead` days,
 * starting `minMinutesFromNow` after the current moment. Removes slots
 * that collide with existing ConsultBookings.
 *
 * Day labels in availability are stored as "mon", "tue", ... — we line
 * those up with each calendar date and split each range into the
 * consultant's session duration.
 */
export async function generateBookableSlots(opts: {
  consultantId: string;
  durationMins: number;
  availability: AvailabilityDayEntry[];
  daysAhead?: number;
  minMinutesFromNow?: number;
}): Promise<{ date: Date; slots: Date[] }[]> {
  const { consultantId, durationMins, availability } = opts;
  const daysAhead = opts.daysAhead ?? 14;
  const minFromNow = opts.minMinutesFromNow ?? 60;

  const now = Date.now();
  const earliest = now + minFromNow * 60_000;

  // Existing bookings in our horizon — we'll filter against these
  const horizonEnd = new Date(now + daysAhead * 24 * 60 * 60_000);
  const taken = await db.consultBooking.findMany({
    where: {
      consultantId,
      scheduledFor: { gte: new Date(now), lt: horizonEnd },
      status: { in: ["CONFIRMED", "PENDING"] },
    },
    select: { scheduledFor: true, durationMins: true },
  });
  const takenRanges = taken.map((b) => ({
    start: b.scheduledFor.getTime(),
    end: b.scheduledFor.getTime() + b.durationMins * 60_000,
  }));

  const byDay = new Map(availability.map((a) => [a.day, a.slots]));
  const out: { date: Date; slots: Date[] }[] = [];

  for (let offset = 0; offset < daysAhead; offset++) {
    const day = new Date();
    day.setUTCDate(day.getUTCDate() + offset);
    day.setUTCHours(0, 0, 0, 0);
    const dayKey = DAYS_ORDER[day.getUTCDay()];
    const ranges = byDay.get(dayKey);
    if (!ranges || ranges.length === 0) continue;

    const slots: Date[] = [];
    for (const r of ranges) {
      const [sh, sm] = r.start.split(":").map(Number);
      const [eh, em] = r.end.split(":").map(Number);
      const rangeStart = new Date(day);
      rangeStart.setUTCHours(sh, sm, 0, 0);
      const rangeEnd = new Date(day);
      rangeEnd.setUTCHours(eh, em, 0, 0);
      for (
        let t = rangeStart.getTime();
        t + durationMins * 60_000 <= rangeEnd.getTime();
        t += durationMins * 60_000
      ) {
        if (t < earliest) continue;
        const slotEnd = t + durationMins * 60_000;
        const collides = takenRanges.some((b) => b.start < slotEnd && b.end > t);
        if (collides) continue;
        slots.push(new Date(t));
      }
    }
    if (slots.length > 0) out.push({ date: day, slots });
  }
  return out;
}
