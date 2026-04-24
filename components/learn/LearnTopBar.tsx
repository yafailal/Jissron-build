import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface LearnTopBarProps {
  courseSlug: string;
  courseTitle: string;
  progressPct: number;
}

export function LearnTopBar({ courseSlug, courseTitle, progressPct }: LearnTopBarProps) {
  return (
    <header className="sticky top-0 z-40 h-14 flex items-center border-b border-line bg-white px-4 sm:px-6 gap-4 shrink-0">
      {/* Logo */}
      <Link
        href="/dashboard"
        className="shrink-0 text-[16px] font-800 text-ink tracking-tight hover:text-primary transition-colors"
      >
        Jissron<span className="text-primary">ON</span>
      </Link>

      <span className="text-line hidden sm:block">|</span>

      {/* Course title + progress */}
      <p className="flex-1 min-w-0 text-[13px] font-600 text-ink truncate hidden sm:block">
        {courseTitle}
        <span className="text-muted font-500 ml-2">· {progressPct}% complete</span>
      </p>

      {/* Back link */}
      <Link
        href={`/courses/${courseSlug}`}
        className="shrink-0 inline-flex items-center gap-1 text-[13px] font-600 text-muted hover:text-ink transition-colors"
      >
        <ChevronLeft size={14} />
        Back to course
      </Link>
    </header>
  );
}
