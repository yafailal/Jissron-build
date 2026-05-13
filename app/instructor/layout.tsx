import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";

// Gate: STUDENTS bounce to /dashboard. Admins + Instructors get in.
export default async function InstructorLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/signin?callbackUrl=/instructor");
  if (session.user.role === "STUDENT") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-bg-soft">
      {/* Top bar */}
      <header className="sticky top-0 z-30 h-14 bg-white border-b border-line flex items-center px-4 sm:px-6 gap-4">
        <Link
          href="/"
          className="shrink-0 text-[15px] font-800 text-ink tracking-tight hover:text-primary transition-colors"
        >
          Jissron<span className="text-primary">ON</span>
        </Link>
        <span className="text-line">|</span>
        <p className="text-[13px] font-700 text-ink">Instructor area</p>

        <Link
          href="/dashboard"
          className="ml-auto inline-flex items-center h-8 px-3 rounded-md border border-line text-[12px] font-600 text-muted hover:text-ink hover:bg-bg-soft transition-colors"
        >
          Student view
        </Link>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">{children}</main>
    </div>
  );
}
