"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { useLocale, useTranslations } from "next-intl";
import { dateFnsLocale } from "@/components/admin/dateLocale";
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
  CONFIRMED: "bg-primary-bright/15 text-primary",
  PENDING: "bg-primary-soft text-primary",
  CANCELLED: "bg-rose-100 text-rose-700",
  COMPLETED: "bg-bg-soft text-muted border border-line",
};

export function BookingsPanel({ upcoming, past }: Props) {
  const t = useTranslations("AdminConsultants");
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const rows = tab === "upcoming" ? upcoming : past;

  return (
    <div className="bg-white rounded-2xl border border-line">
      <div className="px-3 py-2 border-b border-line flex items-center gap-1">
        <TabButton active={tab === "upcoming"} onClick={() => setTab("upcoming")}>
          {t("bookings.upcoming")} · {upcoming.length}
        </TabButton>
        <TabButton active={tab === "past"} onClick={() => setTab("past")}>
          {t("bookings.past")} · {past.length}
        </TabButton>
      </div>
      {rows.length === 0 ? (
        <p className="text-[12px] text-muted py-10 text-center">
          {tab === "upcoming" ? t("bookings.noUpcoming") : t("bookings.noPast")}
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
      className={`h-8 px-3 rounded-full text-[12.5px] font-semibold transition-colors ${
        active ? "bg-primary text-white" : "bg-primary-softer text-ink border border-primary-soft hover:border-primary-mid"
      }`}
    >
      {children}
    </button>
  );
}

function BookingItem({ booking, canEdit }: { booking: BookingRow; canEdit: boolean }) {
  const t = useTranslations("AdminConsultants");
  const locale = useLocale();
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
        toast.success(t("bookings.cancelled"));
        router.refresh();
      } else {
        toast.error(res.error ?? t("bookings.cancelFailed"));
      }
      setCancelOpen(false);
    });
  };

  const doReschedule = () => {
    startTransition(async () => {
      const res = await rescheduleConsultBooking(booking.id, new Date(rescheduleDate).toISOString());
      if (res.ok) {
        toast.success(t("bookings.rescheduled"));
        setRescheduling(false);
        router.refresh();
      } else {
        toast.error(res.error ?? t("bookings.rescheduleFailed"));
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
              {t.has(`bookings.status.${booking.status}`) ? t(`bookings.status.${booking.status}`) : booking.status}
            </span>
          </div>
          <p className="text-[11.5px] text-muted mt-0.5">
            {format(new Date(booking.scheduledFor), "EEE MMM d, yyyy · HH:mm", { locale: dateFnsLocale(locale) })} · {t("bookings.minutes", { count: booking.durationMins })}
          </p>
          {booking.notes && (
            <p className="text-[11.5px] text-muted mt-1 line-clamp-2">&ldquo;{booking.notes}&rdquo;</p>
          )}
        </div>
        {canEdit && booking.status !== "CANCELLED" && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setRescheduling((v) => !v)}
              className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full border border-line text-[11.5px] font-semibold text-muted hover:text-ink hover:bg-bg-soft transition-colors"
              title={t("bookings.reschedule")}
            >
              <CalendarClock className="w-3 h-3" />
              {t("bookings.reschedule")}
            </button>
            <button
              type="button"
              onClick={() => setCancelOpen(true)}
              className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full border border-line text-[11.5px] font-semibold text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors"
              title={t("bookings.cancelBooking")}
            >
              <X className="w-3 h-3" />
              {t("bookings.cancel")}
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
            className="h-8 rounded-md border border-line bg-white px-2 text-[12px] text-ink focus:outline-none focus:ring-2 focus:ring-primary-bright/35"
          />
          <button
            type="button"
            onClick={doReschedule}
            className="inline-flex items-center gap-1 h-8 px-3 rounded-full bg-primary text-white text-[12px] font-bold hover:bg-primary-hover transition-colors"
          >
            <Loader2 className="w-3 h-3 hidden" />
            {t("cal.save")}
          </button>
          <button
            type="button"
            onClick={() => setRescheduling(false)}
            className="h-8 px-2 text-[12px] text-muted hover:text-ink"
          >
            {t("bookings.cancel")}
          </button>
        </div>
      )}
      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={(o) => !o && setCancelOpen(false)}
        title={t("bookings.cancelTitle")}
        description={t("bookings.cancelDescription")}
        confirmLabel={t("bookings.cancelConfirm")}
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
