import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/PageHeader";
import { formatDistanceToNow } from "date-fns";

export const metadata = { title: "Users — JissrON Admin" };

const ROLE_STYLE: Record<string, string> = {
  ADMIN: "bg-primary text-white",
  INSTRUCTOR: "bg-primary-soft text-primary",
  STUDENT: "bg-bg-soft text-muted border border-line",
};

export default async function AdminUsersPage() {
  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      role: true,
      emailVerified: true,
      createdAt: true,
      _count: { select: { enrollments: true } },
    },
  });

  const counts = users.reduce(
    (acc, u) => {
      acc.total += 1;
      acc[u.role] = (acc[u.role] ?? 0) + 1;
      return acc;
    },
    { total: 0 } as Record<string, number>
  );

  return (
    <div>
      <PageHeader
        title="Users"
        description={`${counts.total} total — ${counts.ADMIN ?? 0} admins, ${counts.INSTRUCTOR ?? 0} instructors, ${counts.STUDENT ?? 0} students.`}
      />

      <div className="bg-white rounded-lg border border-line overflow-hidden">
        <table className="w-full text-[13px]">
          <thead className="bg-bg-soft border-b border-line">
            <tr className="text-left">
              <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-muted">User</th>
              <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-muted">Email</th>
              <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-muted">Role</th>
              <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-muted">Verified</th>
              <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-muted">Enrollments</th>
              <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-muted">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-line last:border-0 hover:bg-bg-soft/40 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    {u.image ? (
                      <Image
                        src={u.image}
                        alt={u.name ?? u.email}
                        width={28}
                        height={28}
                        className="rounded-full object-cover w-7 h-7"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-primary text-white grid place-items-center text-[11px] font-bold">
                        {(u.name ?? u.email)[0]?.toUpperCase()}
                      </div>
                    )}
                    <span className="font-semibold text-ink">{u.name ?? "—"}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted">{u.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-bold uppercase tracking-wide ${ROLE_STYLE[u.role]}`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-[12px]">
                  {u.emailVerified ? (
                    <span className="text-green-600 font-semibold">✓ Verified</span>
                  ) : (
                    <span className="text-muted">Pending</span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted">{u._count.enrollments}</td>
                <td className="px-4 py-3 text-muted text-[12px]">
                  {formatDistanceToNow(u.createdAt, { addSuffix: true })}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted">
                  No users yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-[12px] text-muted mt-3">
        Role changes and user suspension actions are coming. For now use{" "}
        <Link href="/admin" className="text-primary hover:underline">
          Prisma Studio
        </Link>{" "}
        or the database for direct edits.
      </p>
    </div>
  );
}
