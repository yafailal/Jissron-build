// Phase 6.3 stub — will be replaced/expanded in Phase 6.7
import Link from "next/link";
import Image from "next/image";
import { BookOpen } from "lucide-react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserEnrollments } from "@/lib/data/enrollments";

export const metadata = { title: "My Dashboard" };

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/signin");

  const firstName = session.user.name?.split(" ")[0] ?? null;
  const enrollments = await getUserEnrollments(session.user.id);
  const hasEnrollments = enrollments.length > 0;

  return (
    <main id="main-content" className="min-h-screen bg-bg-soft">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-800 text-ink mb-1">
            {firstName ? `Welcome back, ${firstName}!` : "Welcome back!"}
          </h1>
          <p className="text-muted font-500">
            {hasEnrollments ? "Pick up where you left off." : "Start your learning journey."}
          </p>
        </div>

        {/* Your courses */}
        <section>
          <h2 className="text-[13px] font-700 uppercase tracking-[0.08em] text-muted mb-4">
            Your courses
          </h2>

          {!hasEnrollments ? (
            <div className="bg-white rounded-2xl border border-line p-10 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 grid place-items-center mb-4">
                <BookOpen className="text-primary" size={24} strokeWidth={1.75} />
              </div>
              <p className="text-[15px] font-700 text-ink mb-1">No courses yet</p>
              <p className="text-sm text-muted font-500 mb-6 max-w-xs">
                Browse our catalogue and enroll in your first course — many are completely free.
              </p>
              <Link
                href="/courses"
                className="inline-flex items-center justify-center h-10 px-6 rounded-lg bg-primary text-white text-sm font-700 hover:bg-primary-hover transition-colors"
              >
                Browse courses
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {enrollments.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="bg-white rounded-2xl border border-line overflow-hidden flex items-center gap-5 p-4 hover:border-primary/30 hover:shadow-sm transition-all"
                >
                  {/* Thumbnail */}
                  {enrollment.course.thumbnailUrl ? (
                    <div className="relative w-24 h-16 rounded-xl overflow-hidden shrink-0 bg-bg-soft">
                      <Image
                        src={enrollment.course.thumbnailUrl}
                        alt={enrollment.course.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-16 rounded-xl shrink-0 bg-gradient-to-br from-primary to-primary-bright" />
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-700 text-ink truncate leading-snug mb-0.5">
                      {enrollment.course.title}
                    </p>
                    <p className="text-[12px] text-muted font-500 mb-1">
                      {enrollment.course.instructor.name}
                    </p>
                    <p className="text-[11px] text-muted/70">
                      Enrolled{" "}
                      {enrollment.enrolledAt.toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  {/* CTA */}
                  {/* Phase 6.6 will build the lesson viewer at /courses/[slug]/learn */}
                  <Link
                    href={`/courses/${enrollment.course.slug}/learn`}
                    className="shrink-0 inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-primary text-white text-[13px] font-700 hover:bg-primary-hover transition-colors"
                  >
                    Continue learning →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
