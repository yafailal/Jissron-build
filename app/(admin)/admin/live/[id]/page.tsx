import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/PageHeader";
import { LiveSessionForm } from "../LiveSessionForm";

export const metadata = { title: "Edit Session — JissrON Admin" };

export default async function EditLiveSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [session, hosts] = await Promise.all([
    db.liveSession.findUnique({ where: { id } }),
    db.user.findMany({
      where: { role: { in: ["INSTRUCTOR", "ADMIN"] } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
  ]);

  if (!session) notFound();

  return (
    <div>
      <PageHeader title={session.title} description="Edit live session" backHref="/admin/live" />
      <LiveSessionForm session={session} hosts={hosts} />
    </div>
  );
}
