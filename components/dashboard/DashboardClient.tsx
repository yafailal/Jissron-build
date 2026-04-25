"use client";

import { useState, useMemo } from "react";
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
    "h-9 px-3 text-[13px] font-500 text-ink rounded-lg border border-line bg-white hover:border-primary/40 transition-colors outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer";

  return (
    <section>
      {/* Section heading */}
      <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
        <h2
          className="text-xl font-700 text-ink"
          style={{ fontFamily: "var(--font-crimson), Georgia, serif" }}
        >
          Your courses
        </h2>
        <span className="text-[12px] text-muted font-500">
          {courses.length} course{courses.length !== 1 ? "s" : ""} in your library
        </span>
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <select
          value={progressFilter}
          onChange={(e) => setProgressFilter(e.target.value as ProgressFilter)}
          className={selectClass}
          aria-label="Filter by progress"
        >
          <option value="all">All progress</option>
          <option value="not_started">Not started</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
        </select>

        {categories.length > 1 && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={selectClass}
            aria-label="Filter by category"
          >
            <option value="all">All categories</option>
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
            aria-label="Filter by instructor"
          >
            <option value="all">All instructors</option>
            {instructors.map((inst) => (
              <option key={inst} value={inst}>
                {inst}
              </option>
            ))}
          </select>
        )}

        {/* Search — pushed right */}
        <div className="relative sm:ml-auto">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses…"
            aria-label="Search courses"
            className="h-9 pl-8 pr-3 text-[13px] font-500 text-ink rounded-lg border border-line bg-white hover:border-primary/40 transition-colors outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 w-44 sm:w-52"
          />
        </div>
      </div>

      {/* Grid or empty-filtered state */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-line rounded-2xl p-10 flex flex-col items-center text-center">
          <p className="text-[15px] font-700 text-ink mb-1.5">No courses match your filters</p>
          <p className="text-sm text-muted font-500 mb-5">
            Try adjusting your filters or search term.
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="h-9 px-5 rounded-lg border border-line text-sm font-600 text-ink hover:border-primary/40 transition-colors"
            >
              Clear filters
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
