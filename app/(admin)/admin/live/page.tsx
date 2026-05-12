import { db } from "@/lib/db";
import { AdminListPage } from "@/components/admin/AdminListPage";
import { LiveSessionsTable } from "./LiveSessionsTable";

export const metadata = { title: "Live Sessions — JissrON Admin" };

export default async function AdminLivePage() {
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
      title="Live Sessions"
      description="Schedule and manage live sessions."
      newHref="/admin/live/new"
      newLabel="New session"
    >
      <LiveSessionsTable sessions={sessions} hosts={hosts} />
    </AdminListPage>
  );
}
