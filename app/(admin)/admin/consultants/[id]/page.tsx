import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/PageHeader";
import { ConsultantForm } from "../ConsultantForm";
import { getAvailableUsers, type AvailabilityDayEntry } from "../actions";
import { AvailabilityEditor } from "./AvailabilityEditor";
import { BookingsPanel } from "./BookingsPanel";
import { ConsultantTabs } from "./ConsultantTabs";

export const metadata = { title: "Edit Consultant — JissrON Admin" };

export default async function EditConsultantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [consultant, availableUsers] = await Promise.all([
    db.consultant.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, email: true, image: true } } },
    }),
    getAvailableUsers(),
  ]);

  if (!consultant) notFound();

  const now = new Date();
  const [upcoming, past] = await Promise.all([
    db.consultBooking.findMany({
      where: { consultantId: id, scheduledFor: { gte: now } },
      orderBy: { scheduledFor: "asc" },
      include: { student: { select: { id: true, name: true, email: true } } },
    }),
    db.consultBooking.findMany({
      where: { consultantId: id, scheduledFor: { lt: now } },
      orderBy: { scheduledFor: "desc" },
      take: 50,
      include: { student: { select: { id: true, name: true, email: true } } },
    }),
  ]);

  // Coerce stored JSON to typed availability shape. Drops legacy {day,hours} entries
  // and any slot that doesn't have valid start/end strings.
  const rawAvail = consultant.availability as unknown;
  const DAYS = new Set(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]);
  const TIME_RE = /^\d{2}:\d{2}$/;
  const availability: AvailabilityDayEntry[] = Array.isArray(rawAvail)
    ? (rawAvail as unknown[]).flatMap((entry) => {
        if (!entry || typeof entry !== "object") return [];
        const e = entry as { day?: unknown; slots?: unknown };
        if (typeof e.day !== "string" || !DAYS.has(e.day)) return [];
        if (!Array.isArray(e.slots)) return [];
        const cleanSlots = (e.slots as unknown[]).flatMap((s) => {
          if (!s || typeof s !== "object") return [];
          const slot = s as { start?: unknown; end?: unknown };
          if (
            typeof slot.start !== "string" ||
            typeof slot.end !== "string" ||
            !TIME_RE.test(slot.start) ||
            !TIME_RE.test(slot.end)
          ) {
            return [];
          }
          return [{ start: slot.start, end: slot.end }];
        });
        return [{ day: e.day as AvailabilityDayEntry["day"], slots: cleanSlots }];
      })
    : [];

  return (
    <div>
      <PageHeader
        title={consultant.user.name ?? consultant.user.email}
        description="Edit consultant profile and calendar"
        backHref="/admin/consultants"
      />
      <ConsultantTabs
        editTab={<ConsultantForm consultant={consultant} availableUsers={availableUsers} />}
        calendarTab={
          <div className="space-y-3">
            <AvailabilityEditor
              consultantId={consultant.id}
              initialAvailability={availability}
              initialTimezone={consultant.timezone}
            />
            <BookingsPanel upcoming={upcoming} past={past} />
          </div>
        }
      />
    </div>
  );
}
