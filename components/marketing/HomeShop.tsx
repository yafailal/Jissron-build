"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CourseCard } from "./CourseCard";
import type { Course } from "@/lib/data/homepage";
import type { Currency } from "@/lib/currency";

const LEVELS = [
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
  { value: "ALL_LEVELS", label: "All levels" },
];

const PRICES = [
  { value: "all", label: "All" },
  { value: "free", label: "Free" },
  { value: "paid", label: "Paid" },
] as const;
type PriceFilter = (typeof PRICES)[number]["value"];

const PAGE_SIZE = 8; // two rows of four

interface HomeShopProps {
  courses: Course[];
  currency: Currency;
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-5 border-b border-line last:border-b-0">
      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted mb-3">{label}</p>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

/** Small shop-style section: filters on the left, matching trainings (4 per row) on the right. */
export function HomeShop({ courses, currency }: HomeShopProps) {
  const [category, setCategory] = useState("");
  const [levels, setLevels] = useState<string[]>([]);
  const [price, setPrice] = useState<PriceFilter>("all");

  // Categories that actually have courses in this set, with counts.
  const categories = useMemo(() => {
    const map = new Map<string, { name: string; slug: string; count: number }>();
    for (const c of courses) {
      const e = map.get(c.category.slug);
      if (e) e.count++;
      else map.set(c.category.slug, { name: c.category.name, slug: c.category.slug, count: 1 });
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [courses]);

  const filtered = useMemo(
    () =>
      courses.filter((c) => {
        if (category && c.category.slug !== category) return false;
        if (levels.length && !levels.includes(c.level)) return false;
        const isFree = c.priceMadCents === 0 && c.priceUsdCents === 0;
        if (price === "free" && !isFree) return false;
        if (price === "paid" && isFree) return false;
        return true;
      }),
    [courses, category, levels, price]
  );

  const hasFilters = !!category || levels.length > 0 || price !== "all";
  const visible = filtered.slice(0, PAGE_SIZE);

  const seeAllParams = new URLSearchParams();
  if (category) seeAllParams.set("category", category);
  if (levels.length === 1) seeAllParams.set("level", levels[0]);
  if (price !== "all") seeAllParams.set("price", price);
  const seeAllHref = `/courses${seeAllParams.toString() ? `?${seeAllParams}` : ""}`;

  function toggleLevel(v: string) {
    setLevels((cur) => (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]));
  }

  const optionClass = "flex items-center gap-2.5 cursor-pointer text-[13.5px] font-medium text-ink";

  return (
    <section className="py-10 sm:py-14 bg-white">
      <div className="wrap">
        <div className="flex items-baseline justify-between gap-4 mb-6">
          <h2 className="text-[22px] sm:text-[28px] font-extrabold tracking-[-0.02em] text-ink">Browse trainings</h2>
          <Link href={seeAllHref} className="shrink-0 text-[13.5px] font-semibold text-primary-mid hover:underline underline-offset-2">
            See all →
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8 items-start">
          {/* Filters — left */}
          <aside className="bg-bg-soft border border-line rounded-2xl px-5 lg:sticky lg:top-24" aria-label="Filters">
            <FilterGroup label="Category">
              <label className={optionClass}>
                <input type="radio" name="shop-category" checked={category === ""} onChange={() => setCategory("")} className="accent-[#064e3b]" />
                All categories
              </label>
              {categories.map((c) => (
                <label key={c.slug} className={optionClass}>
                  <input type="radio" name="shop-category" checked={category === c.slug} onChange={() => setCategory(c.slug)} className="accent-[#064e3b]" />
                  <span className="flex-1">{c.name}</span>
                  <span className="text-[12px] text-muted font-semibold">{c.count}</span>
                </label>
              ))}
            </FilterGroup>

            <FilterGroup label="Level">
              {LEVELS.map((l) => (
                <label key={l.value} className={optionClass}>
                  <input type="checkbox" checked={levels.includes(l.value)} onChange={() => toggleLevel(l.value)} className="accent-[#064e3b] rounded" />
                  {l.label}
                </label>
              ))}
            </FilterGroup>

            <FilterGroup label="Price">
              {PRICES.map((p) => (
                <label key={p.value} className={optionClass}>
                  <input type="radio" name="shop-price" checked={price === p.value} onChange={() => setPrice(p.value)} className="accent-[#064e3b]" />
                  {p.label}
                </label>
              ))}
            </FilterGroup>

            {hasFilters && (
              <div className="py-4">
                <button
                  type="button"
                  onClick={() => {
                    setCategory("");
                    setLevels([]);
                    setPrice("all");
                  }}
                  className="text-[13px] font-semibold text-primary-mid hover:underline underline-offset-2"
                >
                  Clear filters
                </button>
              </div>
            )}
          </aside>

          {/* Trainings — right, 4 per row on wide screens */}
          <div>
            <p className="text-[13px] font-semibold text-muted mb-4">
              {filtered.length} training{filtered.length === 1 ? "" : "s"}
            </p>
            {visible.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {visible.map((course, i) => (
                  <CourseCard key={course.id} course={course} index={i} currency={currency} fluid />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-bg-soft border border-line rounded-2xl">
                <p className="text-[16px] font-bold text-ink">No trainings match these filters</p>
                <p className="text-[13.5px] text-muted mt-1">Try removing a filter.</p>
              </div>
            )}
            {filtered.length > PAGE_SIZE && (
              <div className="mt-8 text-center">
                <Link
                  href={seeAllHref}
                  className="inline-flex items-center px-7 py-3 text-[14px] font-bold text-primary border-[1.5px] border-primary rounded-full hover:bg-primary hover:text-white transition-colors"
                >
                  See all {filtered.length} trainings →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
