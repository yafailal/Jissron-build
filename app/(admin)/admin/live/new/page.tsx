import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/PageHeader";
import { LiveSessionForm } from "../LiveSessionForm";

export const metadata = { title: "New Session — JissrON Admin" };

export default async function NewLiveSessionPage() {
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
      <PageHeader title="New live session" backHref="/admin/live" />
      <LiveSessionForm hosts={hosts} />
    </div>
  );
}
