"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { DashboardCourseCard, type CourseCardData } from "./DashboardCourseCard";

// Serialized for RSC → client boundary (Date → ISO string)
export interface EnrolledCourseForClient extends CourseCardData {
  category: string;
  lastAccessedAt: string | null;
  enrolledAt: string;
}

type ProgressFilter = "all" | "not_started" | "in_progress" | "completed";

interface DashboardClientProps {
  courses: EnrolledCourseForClient[];
}

export function DashboardClient({ courses }: DashboardClientProps) {
  const t = useTranslations("Dashboard.client");
  const [progressFilter, setProgressFilter] = useState<ProgressFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [instructorFilter, setInstructorFilter] = useState("all");
  const [search, setSearch] = useState("");

  const categories = useMemo(
    () => Array.from(new Set(courses.map((c) => c.category))).sort(),
    [courses]
  );
  const instructors = useMemo(
    () => Array.from(new Set(courses.map((c) => c.instructorName))).sort(),
    [courses]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return courses.filter((c) => {
      if (progressFilter !== "all" && c.status !== progressFilter) return false;
      if (categoryFilter !== "all" && c.category !== categoryFilter) return false;
      if (instructorFilter !== "all" && c.instructorName !== instructorFilter) return false;
      if (q && !c.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [courses, progressFilter, categoryFilter, instructorFilter, search]);

  const hasActiveFilters =
    progressFilter !== "all" ||
    categoryFilter !== "all" ||
    instructorFilter !== "all" ||
    search !== "";

  function clearFilters() {
    setProgressFilter("all");
    setCategoryFilter("all");
    setInstructorFilter("all");
    setSearch("");
  }

  const selectClass =
    "h-9 px-3 text-[13px] font-medium text-ink rounded-full border border-line bg-white hover:border-primary transition-colors outline-none focus:border-primary focus:ring-2 focus:ring-primary-bright/35 cursor-pointer";

  return (
    <section>
      {/* Section heading */}
      <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
        <h2
          className="text-[22px] font-extrabold tracking-[-0.02em] text-ink"
        >
          {t("yourCourses")}
        </h2>
        <span className="text-[12px] text-muted font-medium">
          {t("coursesInLibrary", { count: courses.length })}
        </span>
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <select
          value={progressFilter}
          onChange={(e) => setProgressFilter(e.target.value as ProgressFilter)}
          className={selectClass}
          aria-label={t("filterProgress")}
        >
          <option value="all">{t("allProgress")}</option>
          <option value="not_started">{t("notStarted")}</option>
          <option value="in_progress">{t("inProgress")}</option>
          <option value="completed">{t("completed")}</option>
        </select>

        {categories.length > 1 && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={selectClass}
            aria-label={t("filterCategory")}
          >
            <option value="all">{t("allCategories")}</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        )}

        {instructors.length > 1 && (
          <select
            value={instructorFilter}
            onChange={(e) => setInstructorFilter(e.target.value)}
            className={selectClass}
            aria-label={t("filterInstructor")}
          >
            <option value="all">{t("allInstructors")}</option>
            {instructors.map((inst) => (
              <option key={inst} value={inst}>
                {inst}
              </option>
            ))}
          </select>
        )}

        {/* Search — pushed right */}
        <div className="relative sm:ms-auto">
          <Search
            size={14}
            className="absolute start-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchAria")}
            className="h-9 ps-8 pe-3 text-[13px] font-medium text-ink rounded-full border border-line bg-white hover:border-primary transition-colors outline-none focus:border-primary focus:ring-2 focus:ring-primary-bright/35 w-44 sm:w-52"
          />
        </div>
      </div>

      {/* Grid or empty-filtered state */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-line rounded-2xl p-10 flex flex-col items-center text-center">
          <p className="text-[15px] font-bold text-ink mb-1.5">{t("noMatch")}</p>
          <p className="text-sm text-muted font-medium mb-5">
            {t("adjust")}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="h-9 px-4 rounded-full border-[1.5px] border-primary text-[13px] font-bold text-primary hover:bg-primary hover:text-white transition-colors"
            >
              {t("clearFilters")}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((course, i) => (
            <DashboardCourseCard key={course.id} course={course} index={i} />
          ))}
        </div>
      )}
    </section>
  );
}
