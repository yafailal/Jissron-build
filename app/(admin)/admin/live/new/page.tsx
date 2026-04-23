import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/PageHeader";
import { LiveSessionForm } from "../LiveSessionForm";

export const metadata = { title: "New Session — JissrON Admin" };

export default async function NewLiveSessionPage() {
  const hosts = await db.user.findMany({
    where: { role: { in: ["INSTRUCTOR", "ADMIN"] } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true },
  });

  return (
    <div>
      <PageHeader title="New live session" backHref="/admin/live" />
      <LiveSessionForm hosts={hosts} />
    </div>
  );
}
