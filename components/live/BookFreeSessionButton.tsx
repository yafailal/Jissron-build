"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { Loader2, Check } from "lucide-react";
import { bookFreeLiveSession, cancelLiveSessionBooking } from "@/lib/actions/bookings";

interface Props {
  sessionId: string;
  bookingId: string | null;
  seatsLeft: number;
  isAuthenticated: boolean;
  signinHref: string;
  cancellable: boolean; // false if session already started or ended
}

export function BookFreeSessionButton({
  sessionId,
  bookingId,
  seatsLeft,
  isAuthenticated,
  signinHref,
  cancellable,
}: Props) {
  const t = useTranslations("Live.book");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [optimisticBookingId, setOptimisticBookingId] = useState<string | null>(bookingId);

  const booked = !!optimisticBookingId;

  if (!isAuthenticated) {
    return (
      <a
        href={signinHref}
        className="block w-full text-center h-11 leading-[44px] rounded-md bg-primary text-white text-[13px] font-700 hover:bg-primary-hover transition-colors"
      >
        {t("signIn")}
      </a>
    );
  }

  if (booked) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-center gap-1.5 h-11 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[13px] font-700">
          <Check className="w-4 h-4" />
          {t("booked")}
        </div>
        {cancellable && (
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (!optimisticBookingId) return;
              if (!confirm(t("confirmCancel"))) return;
              const id = optimisticBookingId;
              setOptimisticBookingId(null);
              startTransition(async () => {
                const result = await cancelLiveSessionBooking(id);
                if (!result.ok) {
                  setOptimisticBookingId(id);
                  toast.error(result.error ?? t("cancelFailed"));
                } else {
                  toast.success(t("cancelled"));
                  router.refresh();
                }
              });
            }}
            className="block w-full text-center h-9 rounded-md border border-line text-[12px] font-600 text-muted hover:text-red-600 hover:border-red-300 transition-colors disabled:opacity-50"
          >
            {pending ? t("cancelling") : t("cancelSeat")}
          </button>
        )}
      </div>
    );
  }

  if (seatsLeft <= 0) {
    return (
      <button
        type="button"
        disabled
        className="block w-full text-center h-11 rounded-md bg-bg-soft border border-line text-muted text-[13px] font-700 cursor-not-allowed"
      >
        {t("soldOut")}
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const result = await bookFreeLiveSession(sessionId);
          if (!result.ok) {
            toast.error(result.error);
          } else {
            setOptimisticBookingId(result.bookingId);
            toast.success(t("reserved"));
            router.refresh();
          }
        });
      }}
      className="inline-flex w-full items-center justify-center gap-1.5 h-11 rounded-md bg-primary text-white text-[13px] font-700 hover:bg-primary-hover transition-colors disabled:opacity-60"
    >
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          {t("reserving")}
        </>
      ) : (
        t("reserve")
      )}
    </button>
  );
}
