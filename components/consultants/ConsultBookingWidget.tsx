"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
        : "Free"
      : rateUsdCents > 0
      ? `$${(rateUsdCents / 100).toFixed(2)}`
      : "Free";

  if (!isAuthenticated) {
    return (
      <a
        href={signinHref}
        className="block w-full text-center h-11 leading-[44px] rounded-md bg-primary text-white text-[13px] font-700 hover:bg-primary-hover transition-colors"
      >
        Sign in to book
      </a>
    );
  }

  if (daySlots.length === 0) {
    return (
      <div className="bg-bg-soft border border-line rounded-md p-4 text-[13px] text-muted">
        No open slots in the next 2 weeks. Try again soon — consultants update their hours regularly.
      </div>
    );
  }

  function handleBook() {
    if (!selectedSlot) {
      toast.error("Pick a time first");
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
        toast.success(isFree ? "Booked — check your dashboard" : "Redirecting to checkout…");
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
        <p className="text-[10.5px] uppercase tracking-wider font-700 text-muted mb-2">Pick a day</p>
        <div className="flex flex-wrap gap-1.5">
          {daySlots.map((d) => (
            <button
              key={d.dateIso}
              type="button"
              onClick={() => {
                setActiveDate(d.dateIso);
                setSelectedSlot(null);
              }}
              className={`h-9 px-3 rounded-md border text-[12px] font-700 transition-colors ${
                activeDate === d.dateIso
                  ? "bg-primary text-white border-primary"
                  : "bg-white border-line text-ink hover:border-primary/40"
              }`}
            >
              {d.dayLabel}
            </button>
          ))}
        </div>
      </div>

      {/* Time slots */}
      <div>
        <p className="text-[10.5px] uppercase tracking-wider font-700 text-muted mb-2">
          Pick a time ({durationMins} min)
        </p>
        {activeDay && activeDay.slotsIso.length > 0 ? (
          <div className="grid grid-cols-3 gap-1.5">
            {activeDay.slotsIso.map((iso) => {
              const t = new Date(iso);
              const hh = String(t.getUTCHours()).padStart(2, "0");
              const mm = String(t.getUTCMinutes()).padStart(2, "0");
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => setSelectedSlot(iso)}
                  className={`h-9 rounded-md border text-[12px] font-600 transition-colors ${
                    selectedSlot === iso
                      ? "bg-primary text-white border-primary"
                      : "bg-white border-line text-ink hover:border-primary/40"
                  }`}
                >
                  {hh}:{mm}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-[12px] text-muted py-3 text-center bg-bg-soft rounded-md">No slots that day.</p>
        )}
        <p className="text-[10.5px] text-muted mt-1.5">Times shown in UTC.</p>
      </div>

      {/* Notes */}
      <div>
        <p className="text-[10.5px] uppercase tracking-wider font-700 text-muted mb-2">
          What do you want to discuss? <span className="font-500 text-muted normal-case">(optional)</span>
        </p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder="Give your consultant a heads-up so they come prepared."
          className="w-full text-[12.5px] text-ink p-2.5 rounded-md border border-line bg-white focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15 transition-colors resize-y"
        />
      </div>

      {/* Payment method (only if paid + both configured) */}
      {(rateMadCents > 0 || rateUsdCents > 0) && (
        <div>
          <p className="text-[10.5px] uppercase tracking-wider font-700 text-muted mb-2">Pay with</p>
          <div className="grid grid-cols-2 gap-1.5">
            {cmiConfigured && (
              <button
                type="button"
                onClick={() => setPaymentMethod("CMI")}
                className={`h-10 px-3 rounded-md border text-[12px] font-700 transition-colors ${
                  paymentMethod === "CMI"
                    ? "bg-primary-soft text-primary border-primary/40"
                    : "bg-white border-line text-ink hover:border-primary/40"
                }`}
              >
                MAD card (CMI)
              </button>
            )}
            {stripeConfigured && (
              <button
                type="button"
                onClick={() => setPaymentMethod("STRIPE")}
                className={`h-10 px-3 rounded-md border text-[12px] font-700 transition-colors ${
                  paymentMethod === "STRIPE"
                    ? "bg-primary-soft text-primary border-primary/40"
                    : "bg-white border-line text-ink hover:border-primary/40"
                }`}
              >
                USD card (Stripe)
              </button>
            )}
          </div>
          {!cmiConfigured && !stripeConfigured && (
            <p className="text-[11px] text-amber-700 mt-1.5">
              No card payment methods are configured yet. Contact us to book.
            </p>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={handleBook}
        disabled={pending || !selectedSlot}
        className="inline-flex w-full items-center justify-center gap-1.5 h-11 rounded-md bg-primary text-white text-[13px] font-700 hover:bg-primary-hover transition-colors disabled:opacity-50"
      >
        {pending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Reserving…
          </>
        ) : isFree ? (
          "Book this slot"
        ) : (
          <>
            <CreditCard className="w-4 h-4" />
            Book and pay {priceLabel}
          </>
        )}
      </button>
    </div>
  );
}
