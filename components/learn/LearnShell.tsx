"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";
import { LearnSidebar, MobileLearnSidebar } from "./LearnSidebar";
import { SuggestedCoursesPanel } from "./SuggestedCoursesPanel";

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

interface SuggestedCourse {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  thumbnailUrl: string | null;
  priceMadCents: number;
  oldPriceMadCents: number | null;
  isBestseller: boolean;
  isFeatured: boolean;
  badge: string | null;
  instructor: { name: string | null };
  category: { name: string; slug: string };
}

interface LearnShellProps {
  courseSlug: string;
  modules: Module[];
  progressMap: Record<string, LessonProgressEntry | undefined>;
  activeLessonId: string;
  completedCount: number;
  totalLessons: number;
  children: React.ReactNode;
  suggestedSameCategory?: SuggestedCourse[];
  suggestedCrossCategory?: SuggestedCourse[];
}

export function LearnShell({
  courseSlug,
  modules,
  progressMap,
  activeLessonId,
  completedCount,
  totalLessons,
  children,
  suggestedSameCategory = [],
  suggestedCrossCategory = [],
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
      {/* ── Desktop: 3-column on xl+, 2-column on lg, single on smaller ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: curriculum sidebar */}
        <div className="hidden lg:block w-72 xl:w-80 shrink-0 overflow-y-auto border-r border-line">
          <LearnSidebar {...sidebarProps} />
        </div>

        {/* Middle: main lesson content — flush at the top so the media player
            meets the divider with zero gap. Horizontal padding kept for readable
            text content; players bleed out via negative margins. */}
        <main id="main-content" className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 pt-0 pb-6">
            {children}
          </div>
        </main>

        {/* Right: suggested courses panel (xl+ only — needs the breathing room) */}
        {(suggestedSameCategory.length > 0 || suggestedCrossCategory.length > 0) && (
          <div className="hidden xl:block w-72 shrink-0 overflow-y-auto border-l border-line">
            <SuggestedCoursesPanel
              sameCategory={suggestedSameCategory}
              crossCategory={suggestedCrossCategory}
            />
          </div>
        )}
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
