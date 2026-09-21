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
          className="shrink-0 text-[15px] font-extrabold text-ink tracking-tight hover:text-primary transition-colors"
        >
          AILearn<span className="text-primary">ON</span>
        </Link>
        <span className="text-line">|</span>
        <p className="text-[13px] font-bold text-ink">Instructor area</p>

        <Link
          href="/dashboard"
          className="ms-auto inline-flex items-center h-9 px-4 rounded-full border-[1.5px] border-primary text-[13px] font-bold text-primary hover:bg-primary hover:text-white transition-colors"
        >
          Student view
        </Link>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">{children}</main>
    </div>
  );
}
