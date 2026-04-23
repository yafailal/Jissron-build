"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import type { SearchIndexItem } from "@/lib/data/courses";
import type { Currency } from "@/lib/currency";
import { formatPrice } from "@/lib/currency";

// ─── Highlight matching text ──────────────────────────────────────────────────

function Highlighted({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-[rgba(0,113,227,0.15)] text-primary-bright rounded-[3px] px-[2px] font-700 not-italic">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

// ─── Search result types ──────────────────────────────────────────────────────

interface SearchResults {
  courses: SearchIndexItem[];
  instructors: { name: string; courseCount: number }[];
  topics: { name: string; slug: string; courseCount: number }[];
}

const THUMB_GRADIENTS = [
  "linear-gradient(135deg,#f3e7d3 0%,#b4754a 100%)",
  "linear-gradient(135deg,#d6e9ff 0%,#003d80 100%)",
  "linear-gradient(135deg,#f9eede 0%,#d4a574 100%)",
  "linear-gradient(135deg,#cce4ff 0%,#0071e3 100%)",
];

const POPULAR_TAGS = ["Python", "AI", "Marketing", "ChatGPT", "Design"];

interface CoursesSearchProps {
  searchIndex: SearchIndexItem[];
  currency: Currency;
}

export function CoursesSearch({ searchIndex, currency }: CoursesSearchProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<SearchResults>({ courses: [], instructors: [], topics: [] });
  const [activeIdx, setActiveIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Run client-side search over the index
  const runSearch = useCallback(
    (q: string) => {
      const trimmed = q.trim().toLowerCase();
      if (!trimmed) {
        setResults({ courses: [], instructors: [], topics: [] });
        return;
      }

      const matchedCourses = searchIndex
        .filter(
          (c) =>
            c.title.toLowerCase().includes(trimmed) ||
            c.instructorName.toLowerCase().includes(trimmed) ||
            c.categoryName.toLowerCase().includes(trimmed)
        )
        .slice(0, 5);

      // Aggregate unique instructors from matched courses
      const instructorMap = new Map<string, number>();
      searchIndex
        .filter((c) => c.instructorName.toLowerCase().includes(trimmed))
        .forEach((c) => {
          instructorMap.set(c.instructorName, (instructorMap.get(c.instructorName) ?? 0) + 1);
        });
      const matchedInstructors = Array.from(instructorMap.entries())
        .map(([name, courseCount]) => ({ name, courseCount }))
        .slice(0, 3);

      // Aggregate unique topics/categories
      const topicMap = new Map<string, { slug: string; count: number }>();
      searchIndex
        .filter((c) => c.categoryName.toLowerCase().includes(trimmed))
        .forEach((c) => {
          const existing = topicMap.get(c.categoryName);
          topicMap.set(c.categoryName, {
            slug: c.categorySlug,
            count: (existing?.count ?? 0) + 1,
          });
        });
      const matchedTopics = Array.from(topicMap.entries())
        .map(([name, { slug, count }]) => ({ name, slug, courseCount: count }))
        .slice(0, 3);

      setResults({ courses: matchedCourses, instructors: matchedInstructors, topics: matchedTopics });
      setActiveIdx(-1);
    },
    [searchIndex]
  );

  useEffect(() => {
    runSearch(query);
    setOpen(query.trim().length > 0);
  }, [query, runSearch]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      setOpen(false);
      router.push(`/courses?search=${encodeURIComponent(q)}`);
    }
  }

  function handleTagClick(tag: string) {
    setQuery(tag);
    inputRef.current?.focus();
  }

  const hasResults =
    results.courses.length || results.instructors.length || results.topics.length;

  return (
    <div className="w-full">
      {/* Search bar */}
      <div className="relative">
        <form onSubmit={handleSubmit}>
          <div
            className="flex items-center bg-white rounded-2xl transition-all duration-200"
            style={{
              padding: "8px 8px 8px 24px",
              boxShadow: "0 16px 48px rgba(0,20,60,0.28), 0 2px 8px rgba(0,0,0,0.08)",
            }}
          >
            <Search size={22} className="text-muted shrink-0" strokeWidth={2} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => query.trim() && setOpen(true)}
              placeholder="Search courses, instructors, or topics…"
              className="flex-1 border-none outline-none bg-transparent text-ink font-500 placeholder:text-[#95a3b8] placeholder:font-400"
              style={{ padding: "18px 20px", fontSize: "17px" }}
              aria-label="Search courses"
              aria-expanded={open}
              aria-autocomplete="list"
              autoComplete="off"
            />
            <button
              type="submit"
              className="shrink-0 bg-primary text-white font-700 rounded-xl transition-colors hover:bg-primary-hover"
              style={{ padding: "14px 36px", fontSize: "15px" }}
            >
              Search
            </button>
          </div>
        </form>

        {/* Autocomplete dropdown */}
        {open && hasResults && (
          <div
            ref={dropdownRef}
            className="absolute top-[calc(100%+10px)] left-0 right-0 bg-white rounded-2xl overflow-hidden z-50"
            style={{
              boxShadow: "0 24px 64px rgba(0,20,60,0.2), 0 4px 16px rgba(0,0,0,0.06)",
              maxHeight: "560px",
              overflowY: "auto",
            }}
            role="listbox"
          >
            {/* Courses section */}
            {results.courses.length > 0 && (
              <div className="py-3.5 border-b border-[#f1f5f9]">
                <div className="flex items-center justify-between px-[22px] pb-3 pt-2">
                  <span className="text-[11px] font-700 uppercase tracking-[0.1em] text-muted">
                    Courses
                  </span>
                  <span className="bg-[#fafbfd] text-muted text-[10px] font-700 px-2 py-[2px] rounded-full">
                    {results.courses.length}
                  </span>
                </div>
                {results.courses.map((course, i) => (
                  <button
                    key={course.id}
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      router.push(`/courses/${course.slug}`);
                    }}
                    className="flex items-center gap-3 w-full px-[22px] py-2.5 hover:bg-[#fafbfd] transition-colors text-left"
                    role="option"
                  >
                    <div
                      className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center text-white/40 text-[20px] italic overflow-hidden"
                      style={{
                        background: THUMB_GRADIENTS[i % THUMB_GRADIENTS.length],
                        fontFamily: "var(--font-crimson), serif",
                      }}
                      aria-hidden="true"
                    >
                      {course.title[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-600 text-ink truncate">
                        <Highlighted text={course.title} query={query} />
                      </div>
                      <div className="text-[11px] text-muted truncate">
                        {course.instructorName} ·{" "}
                        {course.durationMinutes > 0
                          ? `${Math.round(course.durationMinutes / 60)}h`
                          : "Self-paced"}{" "}
                        · {formatPrice(course.priceMadCents, course.priceUsdCents, currency)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Instructors section */}
            {results.instructors.length > 0 && (
              <div className="py-3.5 border-b border-[#f1f5f9]">
                <div className="flex items-center justify-between px-[22px] pb-3 pt-2">
                  <span className="text-[11px] font-700 uppercase tracking-[0.1em] text-muted">
                    Instructors
                  </span>
                  <span className="bg-[#fafbfd] text-muted text-[10px] font-700 px-2 py-[2px] rounded-full">
                    {results.instructors.length}
                  </span>
                </div>
                {results.instructors.map((inst) => (
                  <button
                    key={inst.name}
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      router.push(`/courses?instructor=${encodeURIComponent(inst.name)}`);
                    }}
                    className="flex items-center gap-3 w-full px-[22px] py-2.5 hover:bg-[#fafbfd] transition-colors text-left"
                    role="option"
                  >
                    <div
                      className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center text-white text-base font-700"
                      style={{ background: "linear-gradient(135deg,#1f3454 0%,#002a5a 100%)" }}
                      aria-hidden="true"
                    >
                      {inst.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-600 text-ink">
                        <Highlighted text={inst.name} query={query} />
                      </div>
                      <div className="text-[11px] text-muted">
                        {inst.courseCount} course{inst.courseCount !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Topics section */}
            {results.topics.length > 0 && (
              <div className="py-3.5">
                <div className="flex items-center justify-between px-[22px] pb-3 pt-2">
                  <span className="text-[11px] font-700 uppercase tracking-[0.1em] text-muted">
                    Topics
                  </span>
                  <span className="bg-[#fafbfd] text-muted text-[10px] font-700 px-2 py-[2px] rounded-full">
                    {results.topics.length}
                  </span>
                </div>
                {results.topics.map((topic) => (
                  <button
                    key={topic.slug}
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      router.push(`/courses?category=${topic.slug}`);
                    }}
                    className="flex items-center gap-3 w-full px-[22px] py-2.5 hover:bg-[#fafbfd] transition-colors text-left"
                    role="option"
                  >
                    <div
                      className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center bg-[#fafbfd]"
                      aria-hidden="true"
                    >
                      <Search size={18} className="text-primary" strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-600 text-ink">
                        <Highlighted text={topic.name} query={query} />
                      </div>
                      <div className="text-[11px] text-muted">
                        {topic.courseCount} course{topic.courseCount !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Footer hint */}
            <div className="flex items-center justify-between px-[22px] py-3.5 bg-[#fafbfd] border-t border-[#f1f5f9]">
              <span className="text-[13px] text-muted">
                Press <kbd className="bg-white border border-[#e6ecf2] rounded px-[6px] py-[2px] font-mono text-[11px] text-[#1f3454]">Enter</kbd> to search all courses
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Popular search tags */}
      <div className="flex items-center flex-wrap gap-[10px] mt-[18px] text-[13px]">
        <span className="text-white/65 font-500 mr-1">Popular:</span>
        {POPULAR_TAGS.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => handleTagClick(tag)}
            className="inline-flex items-center gap-1.5 font-500 text-white transition-all duration-200 hover:-translate-y-px"
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.15)",
              padding: "6px 14px",
              borderRadius: "999px",
              backdropFilter: "blur(8px)",
            }}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}
