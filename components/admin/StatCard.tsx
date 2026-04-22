import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  sub?: string;
}

export function StatCard({ label, value, icon: Icon, sub }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-line p-5 flex items-start gap-4">
      <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center shrink-0">
        <Icon size={18} className="text-primary" strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <p className="text-[12px] font-semibold text-muted uppercase tracking-[0.06em] mb-1">{label}</p>
        <p className="text-[26px] font-extrabold text-ink tracking-[-0.02em] leading-none">{value}</p>
        {sub && <p className="text-[12px] text-muted mt-1">{sub}</p>}
      </div>
    </div>
  );
}
