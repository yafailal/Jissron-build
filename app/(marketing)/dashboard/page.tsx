import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { autoExpireOrders } from "@/lib/actions/orders";
import { getDashboardData } from "@/lib/data/dashboard";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { PendingOrdersBanner } from "@/components/dashboard/PendingOrdersBanner";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { ContinueLearningCard } from "@/components/dashboard/ContinueLearningCard";
import { DashboardClient, type EnrolledCourseForClient } from "@/components/dashboard/DashboardClient";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";

export const metadata = { title: "My Dashboard" };

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/signin?callbackUrl=/dashboard");

  // Silently expire orders that have timed out
  await autoExpireOrders();

  const firstName = session.user.name?.split(" ")[0] ?? null;
  const data = await getDashboardData(session.user.id);

  // Serialize Date objects for the client boundary
  const coursesForClient: EnrolledCourseForClient[] = data.enrolledCourses.map((c) => ({
    ...c,
    lastAccessedAt: c.lastAccessedAt?.toISOString() ?? null,
    enrolledAt: c.enrolledAt.toISOString(),
  }));

  const hasEnrollments = data.enrolledCourses.length > 0;

  return (
    <div className="min-h-screen bg-bg-soft">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <PendingOrdersBanner orders={data.pendingOrders} />
      <DashboardHeader firstName={firstName} lastActive={data.lastActive} />

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
