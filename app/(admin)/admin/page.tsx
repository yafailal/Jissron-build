import { Users, BookOpen, DollarSign, Video } from "lucide-react";
import { db } from "@/lib/db";
import { StatCard } from "@/components/admin/StatCard";
import { ActivityFeed } from "@/components/admin/ActivityFeed";
import { PageHeader } from "@/components/admin/PageHeader";

async function getDashboardData() {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const [userCount, courseCount, sessionsThisWeek, recentActivity] = await Promise.all([
    db.user.count(),
    db.course.count({ where: { status: "PUBLISHED" } }),
    db.liveSession.count({ where: { startsAt: { gte: weekStart } } }),
    db.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return { userCount, courseCount, sessionsThisWeek, recentActivity };
}

export default async function AdminDashboardPage() {
  const { userCount, courseCount, sessionsThisWeek, recentActivity } = await getDashboardData();

  return (
    <div>
      <PageHeader title="Dashboard" description="Welcome back. Here's what's happening." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Users" value={userCount} icon={Users} />
        <StatCard label="Published Courses" value={courseCount} icon={BookOpen} />
        <StatCard label="Revenue this month" value="$0" icon={DollarSign} sub="Stripe not connected" />
        <StatCard label="Sessions this week" value={sessionsThisWeek} icon={Video} />
      </div>

      <div>
        <h2 className="text-[13px] font-bold text-ink uppercase tracking-[0.06em] mb-3">
          Recent Activity
        </h2>
        <ActivityFeed entries={recentActivity} />
      </div>
    </div>
  );
}
