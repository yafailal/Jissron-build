import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import {
  Users,
  Wallet,
  BookOpen,
  ClipboardCheck,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  TrendingUp,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { auth } from "@/lib/auth";
import { loadInstructorOverview } from "@/lib/data/instructor";

export const metadata = { title: "Instructor — JissrON" };

function fmtMad(cents: number) {
  return `${Math.round(cents / 100).toLocaleString("fr-MA")} MAD`;
}

const STATUS_TONE: Record<string, string> = {
  PUBLISHED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  DRAFT: "bg-amber-50 text-amber-700 border-amber-200",
  ARCHIVED: "bg-slate-50 text-slate-600 border-slate-200",
};

export default async function InstructorOverviewPage() {
  const session = await auth();
  if (!session) redirect("/signin?callbackUrl=/instructor");

  // Admins can manage anything via /admin/*. Pure instructors get a read-only
  // overview — the management links below are role-gated to admins only since
  // /admin/* bounces non-admins.
  const isAdmin = session.user.role === "ADMIN";

  const data = await loadInstructorOverview(session.user.id);

  const totalGradingPending =
    data.pendingAssignmentSubmissions + data.pendingQuizAttempts;

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-800 text-ink leading-tight">
          Welcome back, {session.user.name?.split(" ")[0] ?? "instructor"}
        </h1>
        <p className="text-[13px] text-muted font-500 mt-0.5">
          Here&apos;s what&apos;s happening with your courses today.
        </p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          icon={Users}
          label="Students"
          value={data.totalStudents.toLocaleString()}
          hint={`across ${data.totalCoursesPublished + data.totalCoursesDraft} course${data.totalCoursesPublished + data.totalCoursesDraft !== 1 ? "s" : ""}`}
        />
        <KpiCard
          icon={Wallet}
          label="Your earnings"
          value={fmtMad(data.instructorMadCents)}
          hint={`${100 - data.platformCutPercent}% of ${fmtMad(data.grossMadCents)} gross`}
        />
        <KpiCard
          icon={Clock}
          label="Pending payout"
          value={fmtMad(data.pendingPayoutMadCents)}
          hint={`${data.pendingPayoutCount} order${data.pendingPayoutCount !== 1 ? "s" : ""}`}
          tone={data.pendingPayoutCount > 0 ? "primary" : "neutral"}
        />
        <KpiCard
          icon={ClipboardCheck}
          label="Awaiting grading"
          value={String(totalGradingPending)}
          hint={`${data.pendingAssignmentSubmissions} assignment${data.pendingAssignmentSubmissions !== 1 ? "s" : ""}, ${data.pendingQuizAttempts} quiz${data.pendingQuizAttempts !== 1 ? "zes" : ""}`}
          tone={totalGradingPending > 0 ? "warn" : "neutral"}
        />
      </div>

      {/* Two-column body */}
      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-4">
        {/* LEFT: courses */}
        <section className="bg-white border border-line rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[14px] font-700 text-ink flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-primary" />
              Your courses
              <span className="text-muted font-500">({data.courses.length})</span>
            </h2>
            {isAdmin && (
              <Link
                href="/admin/courses"
                className="text-[12px] font-600 text-primary hover:underline inline-flex items-center gap-0.5"
              >
                Manage <ArrowUpRight className="w-3 h-3" />
              </Link>
            )}
          </div>

          {data.courses.length === 0 ? (
            <p className="text-[12.5px] text-muted py-6 text-center">
              You don&apos;t have any courses yet.
            </p>
          ) : (
            <div className="space-y-1">
              {data.courses.map((c) => (
                <Link
                  key={c.id}
                  href={isAdmin ? `/admin/courses/${c.id}` : `/courses/${c.slug}`}
                  className="flex items-center gap-3 px-2 py-2.5 rounded-md hover:bg-bg-soft transition-colors group"
                >
                  {c.thumbnailUrl ? (
                    <Image
                      src={c.thumbnailUrl}
                      alt={c.title}
                      width={56}
                      height={32}
                      className="w-14 h-8 rounded-md object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-8 rounded-md bg-gradient-to-br from-primary to-primary-bright shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-700 text-ink truncate group-hover:text-primary transition-colors">
                      {c.title}
                    </p>
                    <p className="text-[11px] text-muted font-500 mt-0.5">
                      {c.enrollmentCount} student{c.enrollmentCount !== 1 ? "s" : ""}
                      {c.completedCount > 0 && (
                        <span className="text-emerald-600"> · {c.completedCount} completed</span>
                      )}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[13px] font-700 text-ink">
                      {fmtMad(c.instructorMadCents)}
                    </p>
                    <span
                      className={`inline-block text-[9.5px] font-700 uppercase tracking-wide px-1.5 py-0.5 rounded border mt-0.5 ${STATUS_TONE[c.status]}`}
                    >
                      {c.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* RIGHT: recent enrollments */}
        <section className="bg-white border border-line rounded-xl p-4">
          <h2 className="text-[14px] font-700 text-ink flex items-center gap-1.5 mb-3">
            <TrendingUp className="w-4 h-4 text-primary" />
            Recent enrollments
          </h2>

          {data.recentEnrollments.length === 0 ? (
            <p className="text-[12.5px] text-muted py-6 text-center">
              No enrollments yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {data.recentEnrollments.map((e) => (
                <li key={e.id} className="flex items-center gap-2.5">
                  {e.student.image ? (
                    <Image
                      src={e.student.image}
                      alt={e.student.name ?? e.student.email}
                      width={28}
                      height={28}
                      className="w-7 h-7 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-primary text-white grid place-items-center text-[10px] font-700 shrink-0">
                      {(e.student.name ?? e.student.email)[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] font-700 text-ink truncate">
                      {e.student.name ?? e.student.email}
                    </p>
                    <p className="text-[11px] text-muted font-500 truncate">
                      enrolled in{" "}
                      <Link
                        href={`/admin/courses?search=${e.course.slug}`}
                        className="text-primary hover:underline"
                      >
                        {e.course.title}
                      </Link>
                    </p>
                  </div>
                  <span className="text-[10.5px] text-muted shrink-0">
                    {formatDistanceToNow(e.enrolledAt, { addSuffix: true })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Quick actions — admin-only links into the management area */}
      {isAdmin && (
        <section className="bg-white border border-line rounded-xl p-4">
          <h2 className="text-[14px] font-700 text-ink mb-3">Quick links</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
            <QuickLink
              href="/admin/grading"
              icon={ClipboardCheck}
              label="Grading queue"
              badge={totalGradingPending > 0 ? totalGradingPending : null}
            />
            <QuickLink
              href="/admin/payouts"
              icon={Wallet}
              label="Payouts ledger"
            />
            <QuickLink
              href="/admin/courses/new"
              icon={BookOpen}
              label="Create a new course"
            />
            <QuickLink
              href="/admin/users"
              icon={Users}
              label="Students directory"
            />
          </div>
        </section>
      )}

      {/* Non-admin instructors: just an explainer */}
      {!isAdmin && (
        <section className="bg-primary-soft border border-primary/20 rounded-xl p-4 text-[12.5px] text-ink/80">
          <p className="font-700 text-ink mb-1">Read-only view</p>
          <p>
            Course editing, grading, and payouts are managed by your platform admin.
            Reach out to them if you need to update content, grade work, or check your payout status.
          </p>
        </section>
      )}
    </div>
  );
}

// ─── Subcomponents ───────────────────────────────────────────────────────────

function KpiCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "neutral",
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  hint: string;
  tone?: "neutral" | "primary" | "warn";
}) {
  const toneCls =
    tone === "primary"
      ? "bg-primary-soft border-primary/20 text-primary"
      : tone === "warn"
      ? "bg-amber-50 border-amber-200 text-amber-700"
      : "bg-bg-soft border-line text-muted";
  return (
    <div className="bg-white border border-line rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <span className={`inline-flex w-7 h-7 rounded-md border items-center justify-center ${toneCls}`}>
          <Icon size={13} />
        </span>
        <span className="text-[10px] tracking-[0.18em] font-700 text-muted uppercase">
          {label}
        </span>
      </div>
      <p className="text-[20px] font-800 text-ink leading-none">{value}</p>
      <p className="text-[11px] text-muted font-500 mt-1.5 leading-snug">{hint}</p>
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  label,
  badge,
}: {
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  badge?: number | null;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 p-3 rounded-md border border-line hover:border-primary/30 hover:bg-bg-soft transition-colors group"
    >
      <span className="w-8 h-8 rounded-md bg-primary-soft text-primary grid place-items-center group-hover:bg-primary group-hover:text-white transition-colors">
        <Icon size={14} />
      </span>
      <span className="text-[12.5px] font-700 text-ink flex-1">{label}</span>
      {badge ? (
        <span className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full bg-amber-100 text-amber-700 text-[10.5px] font-700">
          {badge}
        </span>
      ) : (
        <ArrowUpRight className="w-3.5 h-3.5 text-muted/40 group-hover:text-primary transition-colors" />
      )}
    </Link>
  );
}
