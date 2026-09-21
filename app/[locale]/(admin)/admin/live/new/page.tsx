import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/PageHeader";
import { LiveSessionForm } from "../LiveSessionForm";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "AdminLive" });
  return { title: t("metaNew") };
}

export default async function NewLiveSessionPage() {
  const t = await getTranslations("AdminLive");
  // Only admins (implicit) + instructors who've been granted live-hosting can be picked as hosts.
  const hosts = await db.user.findMany({
    where: {
      status: "ACTIVE",
      OR: [{ role: "ADMIN" }, { role: "INSTRUCTOR", canHostLive: true }],
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true },
  });

  return (
    <div>
      <PageHeader title={t("newLiveSession")} backHref="/admin/live" />
      <LiveSessionForm hosts={hosts} />
    </div>
  );
}
