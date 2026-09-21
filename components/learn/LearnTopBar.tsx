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
    <header className="sticky top-0 z-40 h-14 flex items-center border-b-2 border-primary bg-white px-4 sm:px-6 gap-3 shrink-0">
      {/* Logo */}
      <Link href="/dashboard" className="shrink-0" aria-label={t("topBar.dashboard")}>
        <Image src="/logo.png" alt="AILearn" width={120} height={34} className="h-6 w-auto" />
      </Link>

      <span className="text-line hidden sm:block">|</span>

      {/* Course title + lesson title + meta + progress */}
      <div className="flex-1 min-w-0 text-[13px] hidden sm:flex items-center gap-2 truncate">
        <span className="font-semibold text-ink truncate">{courseTitle}</span>
        {lessonTitle && (
          <>
            <span className="text-muted shrink-0">›</span>
            <span className="font-bold text-ink truncate">{lessonTitle}</span>
          </>
        )}
        {lessonTypeLabel && (
          <span className="shrink-0 inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-primary-soft text-primary border border-primary-soft">
            {lessonTypeLabel}
          </span>
        )}
        {lessonDuration && (
          <span className="text-muted font-medium shrink-0 text-[12px]">· {lessonDuration}</span>
        )}
        {lessonCompleted && (
          <span className="shrink-0 inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-primary-soft text-primary">
            {t("topBar.done")}
          </span>
        )}
        <span className="text-primary-mid font-semibold shrink-0 text-[12px] ms-auto">{t("topBar.percentComplete", { pct: progressPct })}</span>
      </div>

      {/* Back link */}
      <Link
        href={`/courses/${courseSlug}`}
        className="shrink-0 inline-flex items-center gap-1 h-9 px-4 rounded-full border-[1.5px] border-primary text-[13px] font-bold text-primary hover:bg-primary hover:text-white transition-colors"
      >
        <ChevronLeft size={14} className="rtl:rotate-180" />
        {t("topBar.back")}
      </Link>
    </header>
  );
}
