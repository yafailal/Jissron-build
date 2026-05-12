import Link from "next/link";
import Image from "next/image";
import { Star, ChevronRight } from "lucide-react";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/PageHeader";
import { formatDistanceToNow } from "date-fns";
import type { Prisma } from "@prisma/client";
import { UsersFilters } from "./UsersFilters";

export const metadata = { title: "Users — JissrON Admin" };

const ALLOWED_ROLES = ["STUDENT", "INSTRUCTOR", "ADMIN"] as const;
const ALLOWED_STATUSES = ["ACTIVE", "SUSPENDED"] as const;

const ROLE_STYLE: Record<string, string> = {
  ADMIN: "bg-primary text-white",
  INSTRUCTOR: "bg-violet-50 text-violet-700 border border-violet-200",
  STUDENT: "bg-bg-soft text-muted border border-line",
};

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  SUSPENDED: "bg-rose-50 text-rose-700 border border-rose-200",
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const getOne = (k: string) => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };

  const where: Prisma.UserWhereInput = {};
  const q = getOne("q")?.trim();
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }
  const roleParam = getOne("role");
  if (roleParam && (ALLOWED_ROLES as readonly string[]).includes(roleParam)) {
    where.role = roleParam as (typeof ALLOWED_ROLES)[number];
  }
  const statusParam = getOne("status");
  if (statusParam && (ALLOWED_STATUSES as readonly string[]).includes(statusParam)) {
    where.status = statusParam as (typeof ALLOWED_STATUSES)[number];
  }
  if (getOne("featured") === "yes") where.isFeatured = true;
  const verifiedParam = getOne("verified");
  if (verifiedParam === "yes") where.emailVerified = { not: null };
  if (verifiedParam === "no") where.emailVerified = null;

  const categoryParam = getOne("categoryId");
  if (categoryParam) {
    // Match users who either teach a course in this category, are enrolled in
    // one, or are a consultant tagged with it.
    where.OR = [
      ...(where.OR ?? []),
      { coursesTeaching: { some: { categoryId: categoryParam } } },
      { enrollments: { some: { course: { categoryId: categoryParam } } } },
      { consultant: { categoryId: categoryParam } },
    ];
  }

  const [users, categories] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        status: true,
        isFeatured: true,
        badges: true,
        emailVerified: true,
        createdAt: true,
        _count: { select: { enrollments: true } },
      },
    }),
    db.category.findMany({
      orderBy: { order: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const counts = users.reduce(
    (acc, u) => {
      acc.total += 1;
      acc[u.role] = (acc[u.role] ?? 0) + 1;
      if (u.status === "SUSPENDED") acc.suspended += 1;
      return acc;
    },
    { total: 0, suspended: 0 } as Record<string, number>
  );

  return (
    <div>
      <PageHeader
        title="Users"
        description={`${counts.total} total — ${counts.ADMIN ?? 0} admins, ${counts.INSTRUCTOR ?? 0} instructors, ${counts.STUDENT ?? 0} students${counts.suspended > 0 ? `, ${counts.suspended} suspended` : ""}.`}
      />

      <UsersFilters categories={categories} />

      <div className="bg-white rounded-lg border border-line overflow-hidden">
        <table className="w-full text-[13px]">
          <thead className="bg-bg-soft border-b border-line">
            <tr className="text-left">
              <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-muted">User</th>
              <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-muted">Email</th>
              <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-muted">Role</th>
              <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-muted">Status</th>
              <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-muted">Badges</th>
              <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-muted">Joined</th>
              <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-muted text-right">Edit</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr
                key={u.id}
                className="border-b border-line last:border-0 hover:bg-bg-soft/40 transition-colors"
              >
                <td className="px-4 py-3">
                  <Link href={`/admin/users/${u.id}`} className="flex items-center gap-2.5 group">
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
                    <span className="font-semibold text-ink group-hover:text-primary transition-colors">
                      {u.name ?? "—"}
                    </span>
                    {u.isFeatured && (
                      <Star className="w-3 h-3 text-primary-bright fill-primary-bright shrink-0" />
                    )}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted">{u.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-bold uppercase tracking-wide ${ROLE_STYLE[u.role]}`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-bold uppercase tracking-wide ${STATUS_STYLE[u.status]}`}
                  >
                    {u.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                    {u.badges.slice(0, 2).map((b) => (
                      <span
                        key={b}
                        className="inline-flex items-center px-1.5 py-0.5 bg-primary-soft text-primary rounded text-[10px] font-semibold"
                      >
                        {b}
                      </span>
                    ))}
                    {u.badges.length > 2 && (
                      <span className="text-[10px] text-muted">+{u.badges.length - 2}</span>
                    )}
                    {u.badges.length === 0 && <span className="text-[10px] text-muted">—</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted text-[12px]">
                  {formatDistanceToNow(u.createdAt, { addSuffix: true })}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/users/${u.id}`}
                    className="inline-flex items-center gap-0.5 text-primary hover:underline text-[12px] font-semibold"
                  >
                    Edit
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted">
                  No users yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
