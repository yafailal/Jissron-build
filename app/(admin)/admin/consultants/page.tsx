import { db } from "@/lib/db";
import { AdminListPage } from "@/components/admin/AdminListPage";
import { ConsultantsTable } from "./ConsultantsTable";

export const metadata = { title: "Consultants — JissrON Admin" };

export default async function AdminConsultantsPage() {
  const consultants = await db.consultant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true, image: true } },
      _count: { select: { bookings: true } },
    },
  });

  return (
    <AdminListPage
      title="Consultants"
      description="Manage 1-on-1 consultation experts."
      newHref="/admin/consultants/new"
      newLabel="New consultant"
    >
      <ConsultantsTable consultants={consultants} />
    </AdminListPage>
  );
}
