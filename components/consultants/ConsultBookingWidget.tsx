"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { Loader2, CreditCard } from "lucide-react";
import { bookConsult } from "@/lib/actions/consults";

interface DaySlots {
  dateIso: string; // YYYY-MM-DD
  dayLabel: string;
  slotsIso: string[]; // ISO strings (the full scheduledFor)
}

interface Props {
  consultantId: string;
  durationMins: number;
  rateMadCents: number;
  rateUsdCents: number;
  daySlots: DaySlots[];
  cmiConfigured: boolean;
  stripeConfigured: boolean;
  isAuthenticated: boolean;
  signinHref: string;
}

export function ConsultBookingWidget({
  consultantId,
  durationMins,
  rateMadCents,
  rateUsdCents,
  daySlots,
  cmiConfigured,
  stripeConfigured,
  isAuthenticated,
  signinHref,
}: Props) {
  const t = useTranslations("Consultants.widget");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [activeDate, setActiveDate] = useState(daySlots[0]?.dateIso ?? "");
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"STRIPE" | "CMI">(
    cmiConfigured ? "CMI" : "STRIPE"
  );

  const activeDay = useMemo(
    () => daySlots.find((d) => d.dateIso === activeDate),
    [daySlots, activeDate]
  );

  const isFree =
    (paymentMethod === "CMI" ? rateMadCents : rateUsdCents) <= 0;
  const priceLabel =
    paymentMethod === "CMI"
      ? rateMadCents > 0
        ? `${Math.round(rateMadCents / 100).toLocaleString("fr-MA")} MAD`
        : t("free")
      : rateUsdCents > 0
      ? `$${(rateUsdCents / 100).toFixed(2)}`
      : t("free");

  if (!isAuthenticated) {
    return (
      <a
        href={signinHref}
        className="block w-full text-center h-11 leading-[44px] rounded-full bg-primary text-white text-[13px] font-bold hover:bg-primary-hover transition-colors"
      >
        {t("signIn")}
      </a>
    );
  }

  if (daySlots.length === 0) {
    return (
      <div className="bg-bg-soft border border-line rounded-2xl p-4 text-[13px] text-muted">
        {t("noSlots")}
      </div>
    );
  }

  function handleBook() {
    if (!selectedSlot) {
      toast.error(t("pickTimeFirst"));
      return;
    }
    startTransition(async () => {
      const r = await bookConsult({
        consultantId,
        scheduledForIso: selectedSlot,
        notes,
        paymentMethod,
      });
      if (r.ok) {
        toast.success(isFree ? t("bookedFree") : t("redirecting"));
        router.push(r.checkoutUrl);
      } else {
        toast.error(r.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Date pills */}
      <div>
        <p className="text-[10.5px] uppercase tracking-wider font-bold text-muted mb-2">{t("pickDay")}</p>
        <div className="flex flex-wrap gap-1.5">
          {daySlots.map((d) => (
            <button
              key={d.dateIso}
              type="button"
              onClick={() => {
                setActiveDate(d.dateIso);
                setSelectedSlot(null);
              }}
              className={`h-8 px-3.5 rounded-full border text-[13px] font-semibold transition-colors ${
                activeDate === d.dateIso
                  ? "bg-primary text-white border-primary"
                  : "bg-primary-softer border-primary-soft text-ink hover:border-primary-mid"
              }`}
            >
              {d.dayLabel}
            </button>
          ))}
        </div>
      </div>

      {/* Time slots */}
      <div>
        <p className="text-[10.5px] uppercase tracking-wider font-bold text-muted mb-2">
          {t("pickTime", { count: durationMins })}
        </p>
        {activeDay && activeDay.slotsIso.length > 0 ? (
          <div className="grid grid-cols-3 gap-1.5">
            {activeDay.slotsIso.map((iso) => {
              const slotDate = new Date(iso);
              const hh = String(slotDate.getUTCHours()).padStart(2, "0");
              const mm = String(slotDate.getUTCMinutes()).padStart(2, "0");
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => setSelectedSlot(iso)}
                  className={`h-8 rounded-full border text-[13px] font-semibold transition-colors ${
                    selectedSlot === iso
                      ? "bg-primary text-white border-primary"
                      : "bg-primary-softer border-primary-soft text-ink hover:border-primary-mid"
                  }`}
                >
                  {hh}:{mm}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-[12px] text-muted py-3 text-center bg-bg-soft rounded-2xl">{t("noSlotsDay")}</p>
        )}
        <p className="text-[10.5px] text-muted mt-1.5">{t("utcNote")}</p>
      </div>

      {/* Notes */}
      <div>
        <p className="text-[10.5px] uppercase tracking-wider font-bold text-muted mb-2">
          {t("discuss")} <span className="font-medium text-muted normal-case">{t("optional")}</span>
        </p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder={t("notesPlaceholder")}
          className="w-full text-[12.5px] text-ink p-2.5 rounded-md border border-line bg-white focus:border-primary-bright focus:outline-none focus:ring-2 focus:ring-primary-bright/35 transition-colors resize-y"
        />
      </div>

      {/* Payment method (only if paid + both configured) */}
      {(rateMadCents > 0 || rateUsdCents > 0) && (
        <div>
          <p className="text-[10.5px] uppercase tracking-wider font-bold text-muted mb-2">{t("payWith")}</p>
          <div className="grid grid-cols-2 gap-1.5">
            {cmiConfigured && (
              <button
                type="button"
                onClick={() => setPaymentMethod("CMI")}
                className={`h-10 px-3 rounded-full border text-[12px] font-bold transition-colors ${
                  paymentMethod === "CMI"
                    ? "bg-primary text-white border-primary"
                    : "bg-primary-softer border-primary-soft text-ink hover:border-primary-mid"
                }`}
              >
                {t("madCardCmi")}
              </button>
            )}
            {stripeConfigured && (
              <button
                type="button"
                onClick={() => setPaymentMethod("STRIPE")}
                className={`h-10 px-3 rounded-full border text-[12px] font-bold transition-colors ${
                  paymentMethod === "STRIPE"
                    ? "bg-primary text-white border-primary"
                    : "bg-primary-softer border-primary-soft text-ink hover:border-primary-mid"
                }`}
              >
                {t("usdCardStripe")}
              </button>
            )}
          </div>
          {!cmiConfigured && !stripeConfigured && (
            <p className="text-[11px] text-amber-700 mt-1.5">
              {t("noMethods")}
            </p>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={handleBook}
        disabled={pending || !selectedSlot}
        className="inline-flex w-full items-center justify-center gap-1.5 h-11 rounded-full bg-primary text-white text-[13px] font-bold hover:bg-primary-hover transition-colors disabled:opacity-50"
      >
        {pending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {t("reserving")}
          </>
        ) : isFree ? (
          t("bookSlot")
        ) : (
          <>
            <CreditCard className="w-4 h-4" />
            {t("bookAndPay", { price: priceLabel })}
          </>
        )}
      </button>
    </div>
  );
}
