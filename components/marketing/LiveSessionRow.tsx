import Link from "next/link";
import type { LiveSession } from "@/lib/data/homepage";

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
}

export function LiveSessionRow({ session }: LiveSessionRowProps) {
  const date = new Date(session.startsAt);
  const day = date.getUTCDate();
  const month = MONTH_SHORT[date.getUTCMonth()];
  const weekday = DAY_SHORT[date.getUTCDay()];
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const mins = String(date.getUTCMinutes()).padStart(2, "0");
  const isLive = session.status === "LIVE";
  const kindLabel = KIND_LABEL[session.kind] ?? session.kind;

  return (
    <div className="grid grid-cols-[100px_160px_1fr_160px_140px] gap-7 px-7 py-6 border-t border-line items-center first:border-t-0 hover:bg-bg-soft transition-colors duration-150">
      {/* Date */}
      <div className="leading-none">
        <span className="block text-[36px] font-extrabold text-primary tracking-[-0.02em]">{day}</span>
        <span className="block text-[11.5px] font-bold text-muted uppercase tracking-[0.08em] mt-1.5">
          {month} · {weekday}
        </span>
      </div>

      {/* Time & kind badge */}
      <div>
        {isLive ? (
          <span className="inline-flex items-center gap-1.5 bg-red-500 text-white text-[10.5px] font-extrabold uppercase tracking-[0.05em] px-2.5 py-1 rounded-[4px] mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse-dot" />
            Live
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 bg-primary-bright text-primary text-[10.5px] font-extrabold uppercase tracking-[0.05em] px-2.5 py-1 rounded-[4px] mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse-dot" />
            {kindLabel}
          </span>
        )}
        <div className="text-[13.5px] font-medium text-body-text">
          {hours}:{mins} UTC
          <span className="block text-[12px] text-muted mt-0.5">{session.durationMins} minutes</span>
        </div>
      </div>

      {/* Title + host */}
      <div>
        <h4 className="text-[17px] font-bold text-primary leading-snug tracking-[-0.005em] mb-1.5">
          {session.title}
        </h4>
        <div className="flex items-center gap-2 text-[12.5px] text-muted font-medium">
          <div
            className="w-[22px] h-[22px] rounded-full shrink-0"
            style={{ background: "linear-gradient(135deg, #003d80, #0071e3)" }}
          />
          with {session.host.name}
        </div>
      </div>

      {/* Seats */}
      <div className="text-[12px] text-body-text font-medium">
        {session.isFree ? (
          <>
            <span className="font-extrabold text-primary">Free</span> · open registration
          </>
        ) : (
          <>
            <span className="font-extrabold text-primary">{session.seatsTotal} seats</span>
            <div className="mt-2 h-1 bg-line rounded-full overflow-hidden">
              <div className="h-full bg-primary-bright rounded-full" style={{ width: "50%" }} />
            </div>
          </>
        )}
      </div>

      {/* CTA */}
      <div className="justify-self-end">
        <Link
          href={`/live/${session.slug}`}
          className="px-5 py-2.5 text-[13px] font-bold text-white bg-primary rounded-lg hover:bg-primary-hover transition-colors whitespace-nowrap"
        >
          Reserve seat
        </Link>
      </div>
    </div>
  );
}
