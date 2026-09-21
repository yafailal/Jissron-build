"use client";

import { Link } from "@/i18n/navigation";
import { useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, CheckCheck, RotateCcw } from "lucide-react";
import { markLessonComplete, markLessonIncomplete } from "@/lib/actions/progress";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface LessonNavBarProps {
  courseSlug: string;
  prevLessonId: string | null;
  nextLessonId: string | null;
  lessonId: string;
  isCompleted: boolean;
  hideManualComplete?: boolean;
}

export function LessonNavBar({
  courseSlug,
  prevLessonId,
  nextLessonId,
  lessonId,
  isCompleted,
  hideManualComplete = false,
}: LessonNavBarProps) {
  const t = useTranslations("Learn");
  const router = useRouter();
  const [completed, setCompleted] = useState(isCompleted);
  const [pending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      if (completed) {
        const res = await markLessonIncomplete(lessonId);
        if (res.ok) {
          setCompleted(false);
          router.refresh();
        } else {
          toast.error(res.error);
        }
      } else {
        const res = await markLessonComplete(lessonId);
        if (res.ok) {
          setCompleted(true);
          toast.success(t("nav.markedComplete"));
          router.refresh();
          if (nextLessonId) {
            router.push(`/courses/${courseSlug}/learn?lessonId=${nextLessonId}`);
          }
        } else {
          toast.error(res.error);
        }
      }
    });
  }

  return (
    <div className="flex items-center justify-between gap-4 pt-6 mt-6 border-t border-line flex-wrap">
      {/* Prev */}
      <div className="w-32">
        {prevLessonId && (
          <Link
            href={`/courses/${courseSlug}/learn?lessonId=${prevLessonId}`}
            className="inline-flex items-center gap-1.5 h-11 px-6 rounded-full border-[1.5px] border-primary text-[13px] font-bold text-primary hover:bg-primary hover:text-white transition-colors"
          >
            <ChevronLeft size={15} className="rtl:rotate-180" /> {t("nav.previous")}
          </Link>
        )}
      </div>

      {/* Mark complete toggle */}
      {hideManualComplete ? (
        completed ? (
          <span className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-primary-soft text-primary border border-primary-soft text-[13px] font-bold">
            <CheckCheck size={14} /> {t("nav.completed")}
          </span>
        ) : (
          <span className="text-[12px] text-muted">
            {t("nav.gated")}
          </span>
        )
      ) : (
        <button
          onClick={handleToggle}
          disabled={pending}
          className={`inline-flex items-center gap-2 h-11 px-6 rounded-full text-[13px] font-bold transition-colors disabled:opacity-60 ${
            completed
              ? "bg-primary-soft text-primary border border-primary-soft hover:border-primary-mid"
              : "bg-primary text-white hover:bg-primary-hover"
          }`}
        >
          {completed ? (
            <><RotateCcw size={14} /> {t("nav.markIncomplete")}</>
          ) : (
            <><CheckCheck size={14} /> {t("nav.markComplete")}</>
          )}
        </button>
      )}

      {/* Next */}
      <div className="w-32 flex justify-end">
        {nextLessonId ? (
          <Link
            href={`/courses/${courseSlug}/learn?lessonId=${nextLessonId}`}
            className="inline-flex items-center gap-1.5 h-11 px-6 rounded-full bg-primary text-white text-[13px] font-bold hover:bg-primary-hover transition-colors"
          >
            {t("nav.next")} <ChevronRight size={15} className="rtl:rotate-180" />
          </Link>
        ) : (
          <Link
            href={`/courses/${courseSlug}`}
            className="inline-flex items-center gap-1.5 h-11 px-6 rounded-full border-[1.5px] border-primary text-[13px] font-bold text-primary hover:bg-primary hover:text-white transition-colors"
          >
            {t("nav.finish")} <ChevronRight size={15} className="rtl:rotate-180" />
          </Link>
        )}
      </div>
    </div>
  );
}
