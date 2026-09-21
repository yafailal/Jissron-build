import { getTranslations } from "next-intl/server";

type T = Awaited<ReturnType<typeof getTranslations>>;

function formatLastActive(date: Date, t: T): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return t("today");
  if (diffDays === 1) return t("yesterday");
  return t("daysAgo", { days: diffDays });
}

interface DashboardHeaderProps {
  firstName: string | null;
  lastActive: Date | null;
}

export async function DashboardHeader({ firstName, lastActive }: DashboardHeaderProps) {
  const t = await getTranslations("Dashboard.header");
  return (
    <div className="mb-8">
      <h1
        className="text-3xl sm:text-4xl font-700 text-ink leading-tight mb-1.5"
      >
        <em>{firstName ? t("welcomeBackName", { name: firstName }) : t("welcomeBack")}</em>
      </h1>
      {lastActive && (
        <p className="text-sm text-muted font-500">
          {t("lastActive", { when: formatLastActive(lastActive, t) })}
        </p>
      )}
    </div>
  );
}
