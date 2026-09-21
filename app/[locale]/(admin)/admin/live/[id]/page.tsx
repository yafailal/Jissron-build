import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/PageHeader";
import { LiveSessionForm } from "../LiveSessionForm";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "AdminLive" });
  return { title: t("metaEdit") };
}

export default async function EditLiveSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations("AdminLive");

  const [session, hosts] = await Promise.all([
    db.liveSession.findUnique({ where: { id } }),
    // Admins (implicit) + instructors granted live-hosting. Also include the
    // current session's host even if their grant was revoked, so the dropdown
    // still reflects saved state and isn't broken.
    db.user.findMany({
      where: {
        OR: [
          { role: "ADMIN" },
          { role: "INSTRUCTOR", canHostLive: true },
          { liveSessions: { some: { id } } },
        ],
      },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
  ]);

  if (!session) notFound();

  return (
    <div>
      <PageHeader title={session.title} description={t("editDescription")} backHref="/admin/live" />
      <LiveSessionForm session={session} hosts={hosts} />
    </div>
  );
}
