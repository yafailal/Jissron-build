import Link from "next/link";
import { formatPrice, type Currency } from "@/lib/currency";
import type { Consultant } from "@/lib/data/homepage";

interface ConsultantCardProps {
  consultant: Consultant;
  currency: Currency;
}

export function ConsultantCard({ consultant, currency }: ConsultantCardProps) {
  // Availability JSON can be partially-shaped (legacy rows might miss `slots`),
  // so we coerce to an array and guard `slots.length` to avoid 500ing the homepage.
  const raw = consultant.availability as unknown;
  const availability: { day: string; slots: string[] }[] = Array.isArray(raw) ? raw : [];
  const totalSlots = availability.reduce(
    (sum, d) => sum + (Array.isArray(d?.slots) ? d.slots.length : 0),
    0
  );

  return (
    <div className="bg-white border border-line rounded-xl p-6 flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-bright hover:shadow-card">
      {/* Head */}
      <div className="flex gap-3.5 items-start mb-4 pb-4 border-b border-line">
        <div
          className="w-[60px] h-[60px] rounded-full shrink-0 relative"
          style={{ background: consultant.avatarGradient ?? "linear-gradient(135deg, #003d80, #0071e3)" }}
        >
          {/* Online indicator */}
          <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
        </div>
        <div className="pt-0.5 leading-tight">
          <div className="text-[17px] font-bold text-primary tracking-[-0.01em] mb-1">
            {consultant.user.name}
          </div>
          <div className="text-[12px] text-muted font-medium mb-1.5">
            {consultant.tagline}
          </div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-green-600">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Available this week
          </div>
        </div>
      </div>

      {/* Rating */}
      <div className="flex items-center gap-1.5 text-[12.5px] mb-2.5">
        <span className="font-bold text-primary">{consultant.avgRating.toFixed(1)}</span>
        <span className="text-primary-bright tracking-[0.5px]">{"★".repeat(Math.round(consultant.avgRating))}</span>
        <span className="text-muted text-[11.5px] font-medium">({consultant.totalSessions} sessions)</span>
      </div>

      {/* Bio */}
      <p className="text-[13.5px] text-body-text font-medium leading-relaxed mb-3.5 flex-1">
        {consultant.bio}
      </p>

      {/* Skill tags */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {consultant.skills.map((skill) => (
          <span
            key={skill}
            className="text-[11px] font-semibold text-primary bg-primary-soft px-2.5 py-1 rounded-[4px] leading-none"
          >
            {skill}
          </span>
        ))}
      </div>

      {/* Footer — rate + slots */}
      <div className="flex justify-between items-center py-3.5 border-t border-b border-line mb-3.5">
        <div className="text-[20px] font-extrabold text-primary tracking-[-0.01em]">
          {formatPrice(
            (consultant as Consultant & { ratePerSessionMadCents: number }).ratePerSessionMadCents ?? 0,
            (consultant as Consultant & { ratePerSessionUsdCents: number }).ratePerSessionUsdCents ?? 0,
            currency
          )}
          <span className="text-[12px] font-medium text-muted ml-1">/ {consultant.durationMins} min</span>
        </div>
        <div className="text-[11.5px] text-body-text font-medium">
          <strong className="text-primary font-bold">{totalSlots} slot{totalSlots !== 1 ? "s" : ""}</strong> this week
        </div>
      </div>

      {/* CTA */}
      <Link
        href={`/consults/${consultant.userId}`}
        className="block w-full text-center py-3 bg-primary text-white text-[12.5px] font-extrabold uppercase tracking-[0.06em] rounded-lg hover:bg-primary-hover transition-colors"
      >
        Book a call
      </Link>
    </div>
  );
}
