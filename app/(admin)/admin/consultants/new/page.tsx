import { PageHeader } from "@/components/admin/PageHeader";
import { ConsultantForm } from "../ConsultantForm";
import { getAvailableUsers } from "../actions";

export const metadata = { title: "New Consultant — JissrON Admin" };

export default async function NewConsultantPage() {
  const availableUsers = await getAvailableUsers();

  return (
    <div>
      <PageHeader title="New consultant" backHref="/admin/consultants" />
      <ConsultantForm availableUsers={availableUsers} />
    </div>
  );
}
