"use client";

import Link from "next/link";
import { useState } from "react";
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

function fmtDuration(secs: number) {
  if (secs <= 0) return null;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const rm = m % 60;
    return `${h}h${rm > 0 ? ` ${rm}m` : ""}`;
  }
  return s > 0 ? `${m}:${String(s).padStart(2, "0")}` : `${m}m`;
}

function LessonStatusIcon({ progress, isActive }: { progress?: LessonProgress; isActive: boolean }) {
  if (progress?.completed) {
    return <CheckCircle2 size={14} className="text-green-500 shrink-0" />;
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
    <aside className="flex flex-col h-full overflow-y-auto bg-white border-l border-line">
      {/* Progress summary */}
      <div className="px-4 py-4 border-b border-line shrink-0">
        <div className="flex items-center justify-between mb-2 text-[12px]">
          <span className="font-600 text-ink">Course progress</span>
          <span className="text-muted font-500">{completedCount}/{totalLessons}</span>
        </div>
        <div className="h-1.5 bg-bg-soft rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-[11px] text-muted mt-1.5">{progressPct}% complete</p>
      </div>

      {/* Module list */}
      <nav className="flex-1 py-2 overflow-y-auto" aria-label="Course curriculum">
        {modules.map((mod) => {
          const isOpen = !collapsed.has(mod.id);
          const modCompleted = mod.lessons.filter((l) => progressMap[l.id]?.completed).length;

          return (
            <div key={mod.id} className="border-b border-line/50 last:border-0">
              <button
                onClick={() => toggleModule(mod.id)}
                className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-bg-soft transition-colors"
                aria-expanded={isOpen}
              >
                <ChevronRight
                  size={13}
                  className={`shrink-0 text-muted transition-transform ${isOpen ? "rotate-90" : ""}`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-700 text-ink truncate">{mod.title}</p>
                  <p className="text-[10px] text-muted font-500 mt-0.5">
                    {modCompleted}/{mod.lessons.length} lessons
                  </p>
                </div>
              </button>

              {isOpen && (
                <ul className="pb-1">
                  {mod.lessons.map((lesson) => {
                    const progress = progressMap[lesson.id];
                    const isActive = lesson.id === activeLessonId;
                    const duration = fmtDuration(lesson.durationSeconds);

                    return (
                      <li key={lesson.id}>
                        <Link
                          href={`/courses/${courseSlug}/learn?lessonId=${lesson.id}`}
                          className={`flex items-start gap-2.5 px-4 py-2.5 text-[12px] transition-colors ${
                            isActive
                              ? "bg-primary/8 border-l-2 border-primary"
                              : "hover:bg-bg-soft border-l-2 border-transparent"
                          }`}
                          aria-current={isActive ? "page" : undefined}
                        >
                          <LessonStatusIcon progress={progress} isActive={isActive} />
                          <div className="flex-1 min-w-0">
                            <p
                              className={`leading-snug ${
                                isActive ? "font-700 text-primary" : "font-500 text-ink"
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
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 h-[75vh] rounded-t-2xl overflow-hidden shadow-xl transition-transform duration-300 ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Course curriculum"
      >
        <div className="h-full flex flex-col bg-white">
          <div className="flex items-center justify-between px-5 py-4 border-b border-line shrink-0">
            <span className="text-[14px] font-700 text-ink">Curriculum</span>
            <button
              onClick={onClose}
              className="text-muted hover:text-ink text-[22px] leading-none transition-colors"
              aria-label="Close curriculum"
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
