import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/PageHeader";
import { ConsultantForm } from "../ConsultantForm";
import { getAvailableUsers } from "../actions";

export const metadata = { title: "Edit Consultant — JissrON Admin" };

export default async function EditConsultantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [consultant, availableUsers] = await Promise.all([
    db.consultant.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, email: true, image: true } } },
    }),
    getAvailableUsers(),
  ]);

  if (!consultant) notFound();

  return (
    <div>
      <PageHeader
        title={consultant.user.name ?? consultant.user.email}
        description="Edit consultant profile"
        backHref="/admin/consultants"
      />
      <ConsultantForm consultant={consultant} availableUsers={availableUsers} />
    </div>
  );
}
