import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/admin/PageHeader";
import { ConsultantForm } from "../ConsultantForm";
import { getAvailableUsers } from "../actions";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "AdminConsultants" });
  return { title: t("metaNew") };
}

export default async function NewConsultantPage() {
  const t = await getTranslations("AdminConsultants");
  const availableUsers = await getAvailableUsers();

  return (
    <div>
      <PageHeader title={t("newConsultant")} backHref="/admin/consultants" />
      <ConsultantForm availableUsers={availableUsers} />
    </div>
  );
}
