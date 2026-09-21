import { getTranslations } from "next-intl/server";
import type { DashboardStats } from "@/lib/data/dashboard";

type T = Awaited<ReturnType<typeof getTranslations>>;

function statusLine(stats: DashboardStats, t: T): string {
  const { totalCompleted, totalInProgress, totalNotStarted, totalEnrolled } = stats;
  if (totalCompleted === totalEnrolled) return t("allCompleted");
  if (totalNotStarted === totalEnrolled) return t("readyToStart");
  if (totalInProgress === totalEnrolled && totalCompleted === 0) return t("allInProgress");
  const parts: string[] = [];
  if (totalCompleted > 0) parts.push(t("completedCount", { count: totalCompleted }));
  if (totalInProgress > 0) parts.push(t("inProgressCount", { count: totalInProgress }));
  return parts.join(" · ");
}

interface StatsCardsProps {
  stats: DashboardStats;
}

export async function StatsCards({ stats }: StatsCardsProps) {
  const t = await getTranslations("Dashboard.stats");
  return (
    <div className="grid grid-cols-2 gap-4 mb-8">
      {/* Card 1: Courses enrolled */}
      <div className="bg-white border border-line rounded-2xl p-5 shadow-sm">
        <div
          className="text-5xl font-700 text-primary leading-none mb-1"
        >
          {stats.totalEnrolled}
        </div>
        <div className="text-[11px] font-700 text-muted uppercase tracking-[.07em] mb-3">
          {t("coursesEnrolled")}
        </div>
        <p className="text-[12px] text-muted font-500">{statusLine(stats, t)}</p>
      </div>

      {/* Card 2: Average progress */}
      <div className="bg-white border border-line rounded-2xl p-5 shadow-sm">
        <div
          className="text-5xl font-700 text-primary leading-none mb-1"
        >
          {stats.averageProgressPct}%
        </div>
        <div className="text-[11px] font-700 text-muted uppercase tracking-[.07em] mb-3">
          {t("averageProgress")}
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
