import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { AdminListPage } from "@/components/admin/AdminListPage";
import { LiveSessionsTable } from "./LiveSessionsTable";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "AdminLive" });
  return { title: t("metaList") };
}

export default async function AdminLivePage() {
  const t = await getTranslations("AdminLive");
  const [sessions, hosts] = await Promise.all([
    db.liveSession.findMany({
      orderBy: { startsAt: "desc" },
      include: {
        host: { select: { id: true, name: true } },
        _count: { select: { bookings: true } },
      },
    }),
    db.user.findMany({
      where: { role: { in: ["INSTRUCTOR", "ADMIN"] } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
  ]);

  return (
    <AdminListPage
      title={t("title")}
      description={t("listDescription")}
      newHref="/admin/live/new"
      newLabel={t("newSession")}
    >
      <LiveSessionsTable sessions={sessions} hosts={hosts} />
    </AdminListPage>
  );
}
