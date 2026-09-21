import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/admin/PageHeader";
import type { Prisma } from "@prisma/client";
import { UsersFilters } from "./UsersFilters";
import { UsersTable } from "./UsersTable";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "AdminUsers" });
  return { title: t("metaList") };
}

const ALLOWED_ROLES = ["STUDENT", "INSTRUCTOR", "ADMIN"] as const;
const ALLOWED_STATUSES = ["ACTIVE", "SUSPENDED"] as const;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const t = await getTranslations("AdminUsers");
  const session = await auth();
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
        title={t("title")}
        description={t("summary", {
          total: counts.total,
          admins: counts.ADMIN ?? 0,
          instructors: counts.INSTRUCTOR ?? 0,
          students: counts.STUDENT ?? 0,
          suspended: counts.suspended > 0 ? t("summarySuspended", { count: counts.suspended }) : "",
        })}
      />

      <UsersFilters categories={categories} />

      <UsersTable users={users} currentUserId={session?.user.id ?? ""} />
    </div>
  );
}
