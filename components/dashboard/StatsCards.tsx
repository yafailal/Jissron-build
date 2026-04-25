import type { DashboardStats } from "@/lib/data/dashboard";

function statusLine(stats: DashboardStats): string {
  const { totalCompleted, totalInProgress, totalNotStarted, totalEnrolled } = stats;
  if (totalCompleted === totalEnrolled) return "all completed";
  if (totalNotStarted === totalEnrolled) return "ready to start";
  if (totalInProgress === totalEnrolled && totalCompleted === 0) return "all in progress";
  const parts: string[] = [];
  if (totalCompleted > 0) parts.push(`${totalCompleted} completed`);
  if (totalInProgress > 0) parts.push(`${totalInProgress} in progress`);
  return parts.join(" · ");
}

interface StatsCardsProps {
  stats: DashboardStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 mb-8">
      {/* Card 1: Courses enrolled */}
      <div className="bg-white border border-line rounded-2xl p-5 shadow-sm">
        <div
          className="text-5xl font-700 text-primary leading-none mb-1"
          style={{ fontFamily: "var(--font-crimson), Georgia, serif" }}
        >
          {stats.totalEnrolled}
        </div>
        <div className="text-[11px] font-700 text-muted uppercase tracking-[.07em] mb-3">
          courses enrolled
        </div>
        <p className="text-[12px] text-muted font-500">{statusLine(stats)}</p>
      </div>

      {/* Card 2: Average progress */}
      <div className="bg-white border border-line rounded-2xl p-5 shadow-sm">
        <div
          className="text-5xl font-700 text-primary leading-none mb-1"
          style={{ fontFamily: "var(--font-crimson), Georgia, serif" }}
        >
          {stats.averageProgressPct}%
        </div>
        <div className="text-[11px] font-700 text-muted uppercase tracking-[.07em] mb-3">
          average progress
        </div>
        <div className="h-1.5 rounded-full bg-line overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${stats.averageProgressPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
