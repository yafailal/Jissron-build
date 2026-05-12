import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/admin/PageHeader";
import { UserEditForm } from "./UserEditForm";

export const metadata = { title: "Edit user — JissrON Admin" };

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [user, session] = await Promise.all([
    db.user.findUnique({
      where: { id },
      include: {
        consultant: { select: { id: true } },
        _count: {
          select: {
            enrollments: true,
            orders: true,
            coursesTeaching: true,
            liveSessions: true,
          },
        },
      },
    }),
    auth(),
  ]);

  if (!user) notFound();

  return (
    <div>
      <PageHeader
        title={user.name ?? user.email}
        description={`Manage profile, role, status, and permissions for ${user.email}.`}
        backHref="/admin/users"
      />
      <UserEditForm
        currentAdminId={session?.user.id ?? ""}
        user={{
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          bio: user.bio,
          role: user.role,
          status: user.status,
          isFeatured: user.isFeatured,
          featuredTagline: user.featuredTagline,
          badges: user.badges,
          hasConsultant: !!user.consultant,
          createdAt: user.createdAt,
          emailVerified: user.emailVerified,
          _count: user._count,
        }}
      />
    </div>
  );
}
