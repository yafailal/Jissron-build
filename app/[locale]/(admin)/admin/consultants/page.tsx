import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { AdminListPage } from "@/components/admin/AdminListPage";
import { ConsultantsTable } from "./ConsultantsTable";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "AdminConsultants" });
  return { title: t("metaList") };
}

export default async function AdminConsultantsPage() {
  const t = await getTranslations("AdminConsultants");
  const consultants = await db.consultant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true, image: true } },
      _count: { select: { bookings: true } },
    },
  });

  return (
    <AdminListPage
      title={t("title")}
      description={t("listDescription")}
      newHref="/admin/consultants/new"
      newLabel={t("newConsultant")}
    >
      <ConsultantsTable consultants={consultants} />
    </AdminListPage>
  );
}
