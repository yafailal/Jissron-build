import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/admin/PageHeader";
import { UserEditForm } from "./UserEditForm";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "AdminUsers" });
  return { title: t("metaEdit") };
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("AdminUsers");

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
        description={t("editDescription", { email: user.email })}
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
          canHostLive: user.canHostLive,
          platformCutPercent: user.platformCutPercent,
          hasConsultant: !!user.consultant,
          createdAt: user.createdAt,
          emailVerified: user.emailVerified,
          _count: user._count,
        }}
      />
    </div>
  );
}
