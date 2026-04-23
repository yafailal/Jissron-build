import { auth } from "@/lib/auth";
import Link from "next/link";
import { BookOpen } from "lucide-react";

export const metadata = { title: "My Dashboard" };

export default async function DashboardPage() {
  const session = await auth();
  const firstName = session?.user?.name?.split(" ")[0] ?? null;

  return (
    <main
      id="main-content"
      className="min-h-screen bg-bg-soft flex items-center justify-center px-4"
    >
      <div className="text-center max-w-md">
        {/* Empty-state icon */}
        <div className="mx-auto mb-6 w-16 h-16 rounded-2xl bg-primary/10 grid place-items-center">
          <BookOpen className="text-primary" size={28} strokeWidth={1.75} />
        </div>

        <h1 className="text-3xl font-800 text-ink mb-2">
          {firstName ? `Welcome, ${firstName}!` : "Welcome!"}
        </h1>
        <p className="text-muted font-500 mb-8 leading-relaxed">
          You haven&apos;t enrolled in any courses yet.
          <br />
          Find something that sparks your interest.
        </p>

        <Link
          href="/"
          className="
            inline-flex items-center justify-center h-11 px-6 rounded-lg
            bg-primary text-white font-semibold text-sm
            transition-all duration-200
            hover:bg-primary-hover hover:-translate-y-px hover:shadow-btn
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-bright focus-visible:ring-offset-2
          "
        >
          Browse courses
        </Link>
      </div>
    </main>
  );
}
