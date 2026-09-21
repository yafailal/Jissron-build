"use client";

import { useSearchParams } from "next/navigation";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { SlidersHorizontal } from "lucide-react";

const LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];

const PRICE_OPTS = ["", "free", "paid"];

const SORT_OPTS = ["newest", "popular"];

const DURATION_OPTS = ["under_2h", "2_6h", "6_17h", "over_17h"];

const RATING_OPTS = ["4.5", "4.0", "3.5"];

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
  const t = useTranslations("Courses");
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
            <span className="text-[13px] font-700 text-[#064e3b]">{t("filters.title")}</span>
          </div>
          {hasFilters && (
            <button
              type="button"
              onClick={clearAll}
              className="text-[12px] font-600 text-[#10b981] hover:text-[#064e3b] transition-colors"
            >
              {t("filters.clearAll")}
            </button>
          )}
        </div>

        <div className="px-5">
          {/* Sort */}
          <FilterGroup label={t("filters.sortBy")}>
            <div className="flex flex-col gap-2">
              {SORT_OPTS.map((value) => (
                <label key={value} className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="sort"
                    value={value}
                    checked={getParam("sort") === value || (!getParam("sort") && value === "newest")}
                    onChange={() => pushParam("sort", value === "newest" ? "" : value)}
                    className="accent-[#064e3b]"
                  />
                  <span className="text-[13px] text-[#064e3b]">{t(`filters.sortOpts.${value}`)}</span>
                </label>
              ))}
            </div>
          </FilterGroup>

          {/* Price */}
          <FilterGroup label={t("filters.price")}>
            <div className="flex flex-col gap-2">
              {PRICE_OPTS.map((value) => (
                <label key={value} className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="price"
                    value={value}
                    checked={getParam("price") === value}
                    onChange={() => pushParam("price", value)}
                    className="accent-[#064e3b]"
                  />
                  <span className="text-[13px] text-[#064e3b]">{t(`filters.priceOpts.${value || "all"}`)}</span>
                </label>
              ))}
            </div>
          </FilterGroup>

          {/* Level */}
          <FilterGroup label={t("filters.level")}>
            <div className="flex flex-col gap-2">
              {LEVELS.map((value) => {
                const checked = getParam("level") === value;
                return (
                  <label key={value} className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => pushParam("level", checked ? "" : value)}
                      className="accent-[#064e3b] rounded"
                    />
                    <span className="text-[13px] text-[#064e3b]">{t(`filters.levelOpts.${value}`)}</span>
                  </label>
                );
              })}
            </div>
          </FilterGroup>

          {/* Duration */}
          <FilterGroup label={t("filters.duration")}>
            <div className="flex flex-col gap-2">
              {DURATION_OPTS.map((value) => {
                const checked = getMultiParam("duration").includes(value);
                return (
                  <label key={value} className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleMultiParam("duration", value)}
                      className="accent-[#064e3b] rounded"
                    />
                    <span className="text-[13px] text-[#064e3b]">{t(`filters.durationOpts.${value}`)}</span>
                  </label>
                );
              })}
            </div>
          </FilterGroup>

          {/* Rating */}
          <FilterGroup label={t("filters.rating")}>
            <div className="flex flex-col gap-2">
              {RATING_OPTS.map((value) => (
                <label key={value} className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="rating"
                    value={value}
                    checked={getParam("rating") === value}
                    onChange={() => pushParam("rating", value)}
                    className="accent-[#064e3b]"
                  />
                  <span className="text-[13px] text-[#064e3b] flex items-center gap-1">
                    <span className="text-[#10b981]">{"★".repeat(Math.floor(Number(value)))}</span>
                    {t(`filters.ratingOpts.${value.replace(".", "_")}`)}
                  </span>
                </label>
              ))}
              {getParam("rating") && (
                <button
                  type="button"
                  onClick={() => pushParam("rating", "")}
                  className="text-[12px] text-[#6b7b72] hover:text-[#10b981] text-left transition-colors mt-1"
                >
                  {t("filters.clearRating")}
                </button>
              )}
            </div>
          </FilterGroup>
        </div>
      </div>
    </aside>
  );
}
