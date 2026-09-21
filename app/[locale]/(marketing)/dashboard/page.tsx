import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { autoExpireOrders } from "@/lib/actions/orders";
import { getDashboardData } from "@/lib/data/dashboard";
import { getMyUpcomingBookings } from "@/lib/data/my-bookings";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { PendingOrdersBanner } from "@/components/dashboard/PendingOrdersBanner";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { ContinueLearningCard } from "@/components/dashboard/ContinueLearningCard";
import { DashboardClient, type EnrolledCourseForClient } from "@/components/dashboard/DashboardClient";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { UpcomingLiveSessions } from "@/components/dashboard/UpcomingLiveSessions";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Dashboard" });
  return { title: t("metaTitle") };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/signin?callbackUrl=/dashboard");

  // Silently expire orders that have timed out
  await autoExpireOrders();

  const firstName = session.user.name?.split(" ")[0] ?? null;
  const [data, upcomingBookings] = await Promise.all([
    getDashboardData(session.user.id),
    getMyUpcomingBookings(session.user.id),
  ]);

  // Serialize Date objects for the client boundary
  const coursesForClient: EnrolledCourseForClient[] = data.enrolledCourses.map((c) => ({
    ...c,
    lastAccessedAt: c.lastAccessedAt?.toISOString() ?? null,
    enrolledAt: c.enrolledAt.toISOString(),
  }));

  const hasEnrollments = data.enrolledCourses.length > 0;

  return (
    <div className="min-h-screen bg-bg-soft">
    <DashboardHeader firstName={firstName} lastActive={data.lastActive} />
    <div className="wrap py-8 sm:py-10">
      <PendingOrdersBanner orders={data.pendingOrders} />
      <UpcomingLiveSessions bookings={upcomingBookings} />

      {hasEnrollments ? (
        <>
          {data.stats && <StatsCards stats={data.stats} />}
          {data.continueLearning && (
            <ContinueLearningCard data={data.continueLearning} />
          )}
          <DashboardClient courses={coursesForClient} />
        </>
      ) : (
        <DashboardEmptyState featuredCourses={data.featuredCourses} />
      )}
    </div>
    </div>
  );
}
