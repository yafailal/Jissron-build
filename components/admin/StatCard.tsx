import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  sub?: string;
}

export function StatCard({ label, value, icon: Icon, sub }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg border border-line px-3 py-2.5 flex items-start gap-2.5">
      <div className="w-7 h-7 rounded-md bg-primary-soft flex items-center justify-center shrink-0">
        <Icon size={14} className="text-primary" strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <p className="text-[10.5px] font-bold text-muted uppercase tracking-[0.05em] leading-tight">{label}</p>
        <p className="text-[18px] font-extrabold text-ink tracking-[-0.01em] leading-tight mt-0.5">{value}</p>
        {sub && <p className="text-[10.5px] text-muted mt-0.5 leading-snug truncate">{sub}</p>}
      </div>
    </div>
  );
}
