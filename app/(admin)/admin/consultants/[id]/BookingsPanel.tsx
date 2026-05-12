"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { Loader2, X, CalendarClock } from "lucide-react";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { cancelConsultBooking, rescheduleConsultBooking } from "../actions";

interface BookingRow {
  id: string;
  scheduledFor: Date;
  durationMins: number;
  status: string;
  notes: string | null;
  student: { id: string; name: string | null; email: string };
}

interface Props {
  upcoming: BookingRow[];
  past: BookingRow[];
}

const STATUS_COLOR: Record<string, string> = {
  CONFIRMED: "bg-green-100 text-green-700",
  PENDING: "bg-primary-soft text-primary",
  CANCELLED: "bg-red-100 text-red-600",
  COMPLETED: "bg-bg-soft text-muted border border-line",
};

export function BookingsPanel({ upcoming, past }: Props) {
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const rows = tab === "upcoming" ? upcoming : past;

  return (
    <div className="bg-white rounded-lg border border-line">
      <div className="px-3 py-2 border-b border-line flex items-center gap-1">
        <TabButton active={tab === "upcoming"} onClick={() => setTab("upcoming")}>
          Upcoming · {upcoming.length}
        </TabButton>
        <TabButton active={tab === "past"} onClick={() => setTab("past")}>
          Past · {past.length}
        </TabButton>
      </div>
      {rows.length === 0 ? (
        <p className="text-[12px] text-muted py-10 text-center">
          {tab === "upcoming" ? "No upcoming bookings." : "No past bookings."}
        </p>
      ) : (
        <ul>
          {rows.map((b) => (
            <BookingItem key={b.id} booking={b} canEdit={tab === "upcoming"} />
          ))}
        </ul>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-8 px-3 rounded-md text-[12.5px] font-semibold transition-colors ${
        active ? "bg-primary text-white" : "text-muted hover:text-ink hover:bg-bg-soft"
      }`}
    >
      {children}
    </button>
  );
}

function BookingItem({ booking, canEdit }: { booking: BookingRow; canEdit: boolean }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState(
    toDateTimeLocal(new Date(booking.scheduledFor))
  );

  const doCancel = () => {
    startTransition(async () => {
      const res = await cancelConsultBooking(booking.id);
      if (res.ok) {
        toast.success("Booking cancelled");
        router.refresh();
      } else {
        toast.error(res.error ?? "Failed to cancel");
      }
      setCancelOpen(false);
    });
  };

  const doReschedule = () => {
    startTransition(async () => {
      const res = await rescheduleConsultBooking(booking.id, new Date(rescheduleDate).toISOString());
      if (res.ok) {
        toast.success("Booking rescheduled");
        setRescheduling(false);
        router.refresh();
      } else {
        toast.error(res.error ?? "Failed to reschedule");
      }
    });
  };

  return (
    <li className="px-3 py-2.5 border-b border-line last:border-0">
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[13px] font-semibold text-ink truncate">
              {booking.student.name ?? booking.student.email}
            </p>
            <span
              className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                STATUS_COLOR[booking.status] ?? "bg-bg-soft text-muted"
              }`}
            >
              {booking.status}
            </span>
          </div>
          <p className="text-[11.5px] text-muted mt-0.5">
            {format(new Date(booking.scheduledFor), "EEE MMM d, yyyy · HH:mm")} · {booking.durationMins} min
          </p>
          {booking.notes && (
            <p className="text-[11.5px] text-muted mt-1 line-clamp-2 italic">&ldquo;{booking.notes}&rdquo;</p>
          )}
        </div>
        {canEdit && booking.status !== "CANCELLED" && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setRescheduling((v) => !v)}
              className="inline-flex items-center gap-1 h-7 px-2 rounded-md border border-line text-[11.5px] font-semibold text-muted hover:text-ink hover:bg-bg-soft transition-colors"
              title="Reschedule"
            >
              <CalendarClock className="w-3 h-3" />
              Reschedule
            </button>
            <button
              type="button"
              onClick={() => setCancelOpen(true)}
              className="inline-flex items-center gap-1 h-7 px-2 rounded-md border border-line text-[11.5px] font-semibold text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors"
              title="Cancel booking"
            >
              <X className="w-3 h-3" />
              Cancel
            </button>
          </div>
        )}
      </div>
      {rescheduling && (
        <div className="mt-2 flex items-center gap-2">
          <input
            type="datetime-local"
            value={rescheduleDate}
            onChange={(e) => setRescheduleDate(e.target.value)}
            className="h-8 rounded-md border border-line bg-white px-2 text-[12px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button
            type="button"
            onClick={doReschedule}
            className="inline-flex items-center gap-1 h-8 px-3 rounded-md bg-primary text-white text-[12px] font-bold hover:bg-primary-hover transition-colors"
          >
            <Loader2 className="w-3 h-3 hidden" />
            Save
          </button>
          <button
            type="button"
            onClick={() => setRescheduling(false)}
            className="h-8 px-2 text-[12px] text-muted hover:text-ink"
          >
            Cancel
          </button>
        </div>
      )}
      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={(o) => !o && setCancelOpen(false)}
        title="Cancel this booking?"
        description={`This will mark the booking as CANCELLED. The student will see the change. This action can be reversed by rescheduling.`}
        confirmLabel="Yes, cancel it"
        destructive
        onConfirm={doCancel}
      />
    </li>
  );
}

function toDateTimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
