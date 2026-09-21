import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ChevronLeft } from "lucide-react";

interface LearnTopBarProps {
  courseSlug: string;
  courseTitle: string;
  progressPct: number;
  lessonTitle?: string;
  lessonTypeLabel?: string;
  lessonDuration?: string | null;
  lessonCompleted?: boolean;
}

export async function LearnTopBar({ courseSlug, courseTitle, progressPct, lessonTitle, lessonTypeLabel, lessonDuration, lessonCompleted }: LearnTopBarProps) {
  const t = await getTranslations("Learn");
  return (
    <header className="sticky top-0 z-40 h-14 flex items-center border-b border-line bg-white px-4 sm:px-6 gap-3 shrink-0">
      {/* Logo */}
      <Link href="/dashboard" className="shrink-0" aria-label={t("topBar.dashboard")}>
        <Image src="/logo.png" alt="AILearn" width={120} height={34} className="h-6 w-auto" />
      </Link>

      <span className="text-line hidden sm:block">|</span>

      {/* Course title + lesson title + meta + progress */}
      <div className="flex-1 min-w-0 text-[13px] hidden sm:flex items-center gap-2 truncate">
        <span className="font-600 text-ink truncate">{courseTitle}</span>
        {lessonTitle && (
          <>
            <span className="text-muted shrink-0">›</span>
            <span className="font-700 text-ink truncate">{lessonTitle}</span>
          </>
        )}
        {lessonTypeLabel && (
          <span className="shrink-0 inline-flex px-1.5 py-0.5 rounded text-[10px] font-700 uppercase tracking-wide bg-primary/10 text-primary">
            {lessonTypeLabel}
          </span>
        )}
        {lessonDuration && (
          <span className="text-muted font-500 shrink-0 text-[12px]">· {lessonDuration}</span>
        )}
        {lessonCompleted && (
          <span className="shrink-0 inline-flex px-1.5 py-0.5 rounded text-[10px] font-700 bg-green-50 text-green-700">
            {t("topBar.done")}
          </span>
        )}
        <span className="text-muted font-500 shrink-0 text-[12px] ml-auto">{t("topBar.percentComplete", { pct: progressPct })}</span>
      </div>

      {/* Back link */}
      <Link
        href={`/courses/${courseSlug}`}
        className="shrink-0 inline-flex items-center gap-1 text-[13px] font-600 text-muted hover:text-ink transition-colors"
      >
        <ChevronLeft size={14} />
        {t("topBar.back")}
      </Link>
    </header>
  );
}
