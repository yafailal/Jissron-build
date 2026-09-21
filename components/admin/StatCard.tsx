import type { LucideIcon } from "lucide-react";

export type StatTone = "blue" | "emerald" | "violet" | "orange" | "rose" | "teal" | "slate";

const TONE_STYLE: Record<StatTone, string> = {
  blue: "bg-primary-soft text-primary",
  emerald: "bg-primary-soft text-primary-bright",
  violet: "bg-primary-softer text-primary-mid",
  orange: "bg-amber-50 text-amber-600",
  rose: "bg-rose-50 text-rose-600",
  teal: "bg-primary-soft text-primary",
  slate: "bg-bg-soft text-muted",
};

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  sub?: string;
  tone?: StatTone;
}

export function StatCard({ label, value, icon: Icon, sub, tone = "blue" }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-line px-3 py-2.5 flex items-start gap-2.5">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${TONE_STYLE[tone]}`}>
        <Icon size={14} strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <p className="text-[10.5px] font-bold text-muted uppercase tracking-[0.05em] leading-tight">{label}</p>
        <p className="text-[18px] font-extrabold text-ink tracking-[-0.01em] leading-tight mt-0.5">{value}</p>
        {sub && <p className="text-[10.5px] text-muted mt-0.5 leading-snug truncate">{sub}</p>}
      </div>
    </div>
  );
}
