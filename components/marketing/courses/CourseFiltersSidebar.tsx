"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { SlidersHorizontal } from "lucide-react";

const LEVELS = [
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
];

const PRICE_OPTS = [
  { value: "", label: "All prices" },
  { value: "free", label: "Free" },
  { value: "paid", label: "Paid" },
];

const SORT_OPTS = [
  { value: "newest", label: "Newest first" },
  { value: "popular", label: "Most popular" },
];

const DURATION_OPTS = [
  { value: "under_2h", label: "Under 2 hours" },
  { value: "2_6h", label: "2–6 hours" },
  { value: "6_17h", label: "6–17 hours" },
  { value: "over_17h", label: "17+ hours" },
];

const RATING_OPTS = [
  { value: "4.5", label: "4.5 & up" },
  { value: "4.0", label: "4.0 & up" },
  { value: "3.5", label: "3.5 & up" },
];

interface FilterGroupProps {
  label: string;
  children: React.ReactNode;
}

function FilterGroup({ label, children }: FilterGroupProps) {
  return (
    <div className="py-5 border-b border-[#f7f6ef] last:border-b-0">
      <p className="text-[11px] font-700 uppercase tracking-[0.1em] text-[#6b7b72] mb-3">
        {label}
      </p>
      {children}
    </div>
  );
}

export function CourseFiltersSidebar({ className }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const getParam = useCallback((key: string) => searchParams.get(key) ?? "", [searchParams]);
  const getMultiParam = useCallback(
    (key: string) => searchParams.getAll(key),
    [searchParams]
  );

  function pushParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  function toggleMultiParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    const existing = params.getAll(key);
    params.delete(key);
    if (existing.includes(value)) {
      existing.filter((v) => v !== value).forEach((v) => params.append(key, v));
    } else {
      [...existing, value].forEach((v) => params.append(key, v));
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  function clearAll() {
    router.push(pathname);
  }

  const hasFilters =
    !!searchParams.get("level") ||
    !!searchParams.get("price") ||
    !!searchParams.get("sort") ||
    searchParams.getAll("duration").length > 0 ||
    !!searchParams.get("rating");

  return (
    <aside className={className ?? "w-[280px] shrink-0"}>
      <div
        className="bg-white rounded-2xl border border-[#d9dcd6] overflow-hidden sticky top-[57px]"
        style={{ maxHeight: "calc(100vh - 80px)", overflowY: "auto" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#f7f6ef]">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={15} className="text-[#6b7b72]" strokeWidth={2} />
            <span className="text-[13px] font-700 text-[#0e1f1a]">Filters</span>
          </div>
          {hasFilters && (
            <button
              type="button"
              onClick={clearAll}
              className="text-[12px] font-600 text-[#a4e635] hover:text-[#0e1f1a] transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="px-5">
          {/* Sort */}
          <FilterGroup label="Sort by">
            <div className="flex flex-col gap-2">
              {SORT_OPTS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="sort"
                    value={opt.value}
                    checked={getParam("sort") === opt.value || (!getParam("sort") && opt.value === "newest")}
                    onChange={() => pushParam("sort", opt.value === "newest" ? "" : opt.value)}
                    className="accent-[#0e1f1a]"
                  />
                  <span className="text-[13px] text-[#0e1f1a]">{opt.label}</span>
                </label>
              ))}
            </div>
          </FilterGroup>

          {/* Price */}
          <FilterGroup label="Price">
            <div className="flex flex-col gap-2">
              {PRICE_OPTS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="price"
                    value={opt.value}
                    checked={getParam("price") === opt.value}
                    onChange={() => pushParam("price", opt.value)}
                    className="accent-[#0e1f1a]"
                  />
                  <span className="text-[13px] text-[#0e1f1a]">{opt.label}</span>
                </label>
              ))}
            </div>
          </FilterGroup>

          {/* Level */}
          <FilterGroup label="Level">
            <div className="flex flex-col gap-2">
              {LEVELS.map((opt) => {
                const checked = getParam("level") === opt.value;
                return (
                  <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => pushParam("level", checked ? "" : opt.value)}
                      className="accent-[#0e1f1a] rounded"
                    />
                    <span className="text-[13px] text-[#0e1f1a]">{opt.label}</span>
                  </label>
                );
              })}
            </div>
          </FilterGroup>

          {/* Duration */}
          <FilterGroup label="Duration">
            <div className="flex flex-col gap-2">
              {DURATION_OPTS.map((opt) => {
                const checked = getMultiParam("duration").includes(opt.value);
                return (
                  <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleMultiParam("duration", opt.value)}
                      className="accent-[#0e1f1a] rounded"
                    />
                    <span className="text-[13px] text-[#0e1f1a]">{opt.label}</span>
                  </label>
                );
              })}
            </div>
          </FilterGroup>

          {/* Rating */}
          <FilterGroup label="Rating">
            <div className="flex flex-col gap-2">
              {RATING_OPTS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="rating"
                    value={opt.value}
                    checked={getParam("rating") === opt.value}
                    onChange={() => pushParam("rating", opt.value)}
                    className="accent-[#0e1f1a]"
                  />
                  <span className="text-[13px] text-[#0e1f1a] flex items-center gap-1">
                    <span className="text-[#a4e635]">{"★".repeat(Math.floor(Number(opt.value)))}</span>
                    {opt.label}
                  </span>
                </label>
              ))}
              {getParam("rating") && (
                <button
                  type="button"
                  onClick={() => pushParam("rating", "")}
                  className="text-[12px] text-[#6b7b72] hover:text-[#a4e635] text-left transition-colors mt-1"
                >
                  Clear rating filter
                </button>
              )}
            </div>
          </FilterGroup>
        </div>
      </div>
    </aside>
  );
}
