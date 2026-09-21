import { getTranslations } from "next-intl/server";
import { PageBand } from "@/components/marketing/PageBand";

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
    <PageBand
      title={firstName ? t("welcomeBackName", { name: firstName }) : t("welcomeBack")}
      description={lastActive ? t("lastActive", { when: formatLastActive(lastActive, t) }) : undefined}
    />
  );
}
