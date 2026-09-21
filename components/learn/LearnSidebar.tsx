"use client";

import { Link } from "@/i18n/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronRight, CheckCircle2, Circle, PlayCircle, Clock } from "lucide-react";

interface LessonProgress {
  watchedSecs: number;
  completed: boolean;
}

interface Lesson {
  id: string;
  title: string;
  type: string;
  durationSeconds: number;
  order: number;
}

interface Module {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

interface LearnSidebarProps {
  courseSlug: string;
  modules: Module[];
  progressMap: Record<string, LessonProgress | undefined>;
  activeLessonId: string;
  completedCount: number;
  totalLessons: number;
}

type Translator = ReturnType<typeof useTranslations>;

function fmtDuration(secs: number, t: Translator) {
  if (secs <= 0) return null;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const rm = m % 60;
    return rm > 0 ? t("duration.hm", { h, m: rm }) : t("duration.h", { h });
  }
  return s > 0 ? `${m}:${String(s).padStart(2, "0")}` : t("duration.mShort", { m });
}

function LessonStatusIcon({ progress, isActive }: { progress?: LessonProgress; isActive: boolean }) {
  if (progress?.completed) {
    return <CheckCircle2 size={14} className="text-primary-bright shrink-0" />;
  }
  if (isActive || (progress && progress.watchedSecs > 0)) {
    return <PlayCircle size={14} className="text-primary shrink-0" />;
  }
  return <Circle size={14} className="text-muted/40 shrink-0" />;
}

export function LearnSidebar({
  courseSlug,
  modules,
  progressMap,
  activeLessonId,
  completedCount,
  totalLessons,
}: LearnSidebarProps) {
  const t = useTranslations("Learn");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  function toggleModule(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const progressPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  return (
    <aside className="flex flex-col h-full overflow-y-auto bg-bg-soft">
      {/* Progress summary */}
      <div className="px-4 py-4 border-b border-line shrink-0">
        <div className="flex items-center justify-between mb-2 text-[13px]">
          <span className="font-bold text-ink">{t("sidebar.progress")}</span>
          <span className="inline-flex items-center h-6 px-2.5 rounded-full bg-primary-soft text-primary text-[11px] font-bold">{completedCount}/{totalLessons}</span>
        </div>
        <div className="h-2 bg-primary-soft rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-bright rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-[12px] text-muted mt-2 font-medium">{t("topBar.percentComplete", { pct: progressPct })}</p>
      </div>

      {/* Module list */}
      <nav className="flex-1 py-2 overflow-y-auto" aria-label={t("sidebar.curriculumLabel")}>
        {modules.map((mod) => {
          const isOpen = !collapsed.has(mod.id);
          const modCompleted = mod.lessons.filter((l) => progressMap[l.id]?.completed).length;

          return (
            <div key={mod.id} className="border-b border-line/50 last:border-0">
              <button
                onClick={() => toggleModule(mod.id)}
                className="w-full flex items-center gap-2 px-4 py-3 text-start hover:bg-bg-hover transition-colors"
                aria-expanded={isOpen}
              >
                <ChevronRight
                  size={13}
                  className={`shrink-0 text-muted transition-transform ${isOpen ? "rotate-90" : ""}`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-extrabold text-ink truncate leading-tight">{mod.title}</p>
                  <p className="inline-flex mt-1 px-2 py-0.5 rounded-full bg-primary-softer border border-primary-soft text-[10px] text-primary-mid font-semibold">
                    {t("sidebar.lessonsProgress", { done: modCompleted, total: mod.lessons.length })}
                  </p>
                </div>
              </button>

              {isOpen && (
                <ul className="pb-1">
                  {mod.lessons.map((lesson) => {
                    const progress = progressMap[lesson.id];
                    const isActive = lesson.id === activeLessonId;
                    const duration = fmtDuration(lesson.durationSeconds, t);

                    return (
                      <li key={lesson.id}>
                        <Link
                          href={`/courses/${courseSlug}/learn?lessonId=${lesson.id}`}
                          className={`flex items-start gap-2.5 px-4 py-2.5 text-[12px] transition-colors ${
                            isActive
                              ? "bg-primary-soft border-s-[3px] border-primary"
                              : "hover:bg-bg-hover border-s-[3px] border-transparent"
                          }`}
                          aria-current={isActive ? "page" : undefined}
                        >
                          <LessonStatusIcon progress={progress} isActive={isActive} />
                          <div className="flex-1 min-w-0">
                            <p
                              className={`leading-snug ${
                                isActive ? "font-bold text-primary" : "font-bold text-ink"
                              } ${progress?.completed ? "text-muted" : ""}`}
                            >
                              {lesson.title}
                            </p>
                            {duration && (
                              <span className="text-[10px] text-muted flex items-center gap-0.5 mt-0.5">
                                <Clock size={9} />
                                {duration}
                              </span>
                            )}
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

// ── Mobile bottom-sheet wrapper ───────────────────────────────────────────────

interface MobileSidebarProps extends LearnSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileLearnSidebar({ isOpen, onClose, ...props }: MobileSidebarProps) {
  const t = useTranslations("Learn");
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-primary-dark/50"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sheet */}
      <div
        className={`fixed bottom-0 inset-x-0 z-50 h-[75vh] rounded-t-2xl overflow-hidden shadow-xl transition-transform duration-300 ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={t("sidebar.curriculumLabel")}
      >
        <div className="h-full flex flex-col bg-bg-soft">
          <div className="flex items-center justify-between px-5 py-4 border-b border-line shrink-0">
            <span className="text-[14px] font-extrabold text-ink">{t("shell.curriculum")}</span>
            <button
              onClick={onClose}
              className="text-muted hover:text-ink text-[22px] leading-none transition-colors"
              aria-label={t("sidebar.closeCurriculum")}
            >
              ×
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <LearnSidebar {...props} />
          </div>
        </div>
      </div>
    </>
  );
}
