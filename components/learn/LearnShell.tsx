"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";
import { LearnSidebar, MobileLearnSidebar } from "./LearnSidebar";

interface LessonProgressEntry {
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

interface LearnShellProps {
  courseSlug: string;
  modules: Module[];
  progressMap: Record<string, LessonProgressEntry | undefined>;
  activeLessonId: string;
  completedCount: number;
  totalLessons: number;
  children: React.ReactNode;
}

export function LearnShell({
  courseSlug,
  modules,
  progressMap,
  activeLessonId,
  completedCount,
  totalLessons,
  children,
}: LearnShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarProps = {
    courseSlug,
    modules,
    progressMap,
    activeLessonId,
    completedCount,
    totalLessons,
  };

  return (
    <>
      {/* ── Desktop: two-column grid ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main content */}
        <main id="main-content" className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8">
            {children}
          </div>
        </main>

        {/* Desktop sidebar */}
        <div className="hidden lg:block w-72 xl:w-80 shrink-0 overflow-y-auto border-l border-line">
          <LearnSidebar {...sidebarProps} />
        </div>
      </div>

      {/* ── Mobile: sticky curriculum button ── */}
      <div className="lg:hidden fixed bottom-4 right-4 z-30">
        <button
          onClick={() => setMobileOpen(true)}
          className="inline-flex items-center gap-2 h-11 px-4 rounded-full bg-primary text-white text-[13px] font-700 shadow-lg hover:bg-primary-hover transition-colors"
          aria-label="Open curriculum"
        >
          <BookOpen size={16} />
          Curriculum
        </button>
      </div>

      {/* Mobile bottom sheet */}
      <MobileLearnSidebar
        {...sidebarProps}
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
    </>
  );
}
