import Link from "next/link";
import type { LiveSession } from "@/lib/data/homepage";
import { formatPrice, type Currency } from "@/lib/currency";

const KIND_LABEL: Record<string, string> = {
  AMA: "Free AMA",
  WORKSHOP: "Workshop",
  SEMINAR: "Seminar",
  COHORT: "Cohort",
};

const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAY_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

interface LiveSessionRowProps {
  session: LiveSession;
  currency: Currency;
}

export function LiveSessionRow({ session, currency }: LiveSessionRowProps) {
  const date = new Date(session.startsAt);
  const day = date.getUTCDate();
  const month = MONTH_SHORT[date.getUTCMonth()];
  const weekday = DAY_SHORT[date.getUTCDay()];
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const mins = String(date.getUTCMinutes()).padStart(2, "0");
  const isLive = session.status === "LIVE";
  const kindLabel = KIND_LABEL[session.kind] ?? session.kind;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-[72px_130px_1fr_130px_120px] gap-x-3 gap-y-2 lg:gap-5 px-3 lg:px-5 py-2.5 lg:py-3 bg-white lg:bg-transparent border border-line rounded-lg lg:rounded-none lg:border-0 lg:border-t items-start lg:items-center lg:first:border-t-0 hover:bg-bg-soft transition-colors duration-150">
      {/* Date */}
      <div className="leading-none">
        <span className="block text-[24px] font-extrabold text-primary tracking-[-0.02em]">{day}</span>
        <span className="block text-[10px] font-bold text-muted uppercase tracking-[0.06em] mt-1">
          {month} · {weekday}
        </span>
      </div>

      {/* Time & kind badge */}
      <div>
        {isLive ? (
          <span className="inline-flex items-center gap-1 bg-red-500 text-white text-[9.5px] font-extrabold uppercase tracking-[0.04em] px-1.5 py-0.5 rounded-[3px] mb-1">
            <span className="w-1 h-1 rounded-full bg-white animate-pulse-dot" />
            Live
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 bg-primary-bright text-primary text-[9.5px] font-extrabold uppercase tracking-[0.04em] px-1.5 py-0.5 rounded-[3px] mb-1">
            <span className="w-1 h-1 rounded-full bg-current animate-pulse-dot" />
            {kindLabel}
          </span>
        )}
        <div className="text-[12px] font-medium text-body-text leading-tight">
          {hours}:{mins} UTC
          <span className="block text-[10.5px] text-muted">{session.durationMins} min</span>
        </div>
      </div>

      {/* Title + host */}
      <div className="col-span-2 lg:col-span-1 min-w-0">
        <h4 className="text-[14px] font-bold text-primary leading-tight tracking-[-0.005em] mb-0.5 line-clamp-1">
          {session.title}
        </h4>
        <div className="flex items-center gap-1.5 text-[11.5px] text-muted font-medium">
          <div
            className="w-4 h-4 rounded-full shrink-0"
            style={{ background: "linear-gradient(135deg, #003d80, #0071e3)" }}
          />
          with {session.host.name}
        </div>
      </div>

      {/* Seats / Price */}
      <div className="col-span-2 lg:col-span-1 text-[11px] text-body-text font-medium leading-tight">
        {session.isFree ? (
          <>
            <span className="font-extrabold text-primary text-[13px]">Free</span>
            <span className="text-muted"> · open</span>
          </>
        ) : (
          <>
            <span className="font-extrabold text-primary text-[13px]">
              {formatPrice(
                (session as LiveSession & { priceMadCents: number }).priceMadCents ?? 0,
                (session as LiveSession & { priceUsdCents: number }).priceUsdCents ?? 0,
                currency
              )}
            </span>
            <div className="text-muted">{session.seatsTotal} seats</div>
          </>
        )}
      </div>

      {/* CTA */}
      <div className="col-span-2 lg:col-span-1 lg:justify-self-end">
        <Link
          href={`/live/${session.slug}`}
          className="block lg:inline text-center px-3 py-1.5 text-[12px] font-bold text-white bg-primary rounded-md hover:bg-primary-hover transition-colors whitespace-nowrap"
        >
          Reserve seat
        </Link>
      </div>
    </div>
  );
}
