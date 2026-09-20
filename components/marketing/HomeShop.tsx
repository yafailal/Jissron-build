"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import Link from "next/link";
import { CourseCardCompact } from "./CourseCardCompact";
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

const RATINGS = [
  { value: 0, label: "Any rating" },
  { value: 4.5, label: "4.5 & up" },
  { value: 4, label: "4.0 & up" },
  { value: 3, label: "3.0 & up" },
];

const DURATIONS = [
  { value: "any", label: "Any length" },
  { value: "short", label: "Under 1 hour" },
  { value: "medium", label: "1 – 3 hours" },
  { value: "long", label: "3 hours +" },
] as const;
type DurationFilter = (typeof DURATIONS)[number]["value"];

const LANGUAGE_NAMES: Record<string, string> = { en: "English", fr: "Français", ar: "العربية" };
const languageName = (code: string) => LANGUAGE_NAMES[code] ?? code.toUpperCase();

const PAGE_SIZE = 12; // three rows of four

interface HomeShopProps {
  courses: Course[];
  currency: Currency;
}

function Dropdown({
  label,
  active,
  children,
  width = "w-56",
}: {
  label: string;
  active: boolean;
  children: React.ReactNode;
  width?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-4 text-[13px] font-semibold transition-colors ${
          active
            ? "border-primary bg-primary text-white"
            : "border-primary-soft bg-primary-softer text-ink hover:border-primary-mid"
        }`}
      >
        {label}
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      {open && (
        <div
          className={`absolute left-0 top-full z-30 mt-2 ${width} rounded-2xl border border-line bg-white p-3 shadow-card`}
        >
          {children}
        </div>
      )}
    </div>
  );
}

/** Small shop-style section: filter dropdowns on top, matching trainings below. */
export function HomeShop({ courses, currency }: HomeShopProps) {
  const [category, setCategory] = useState("");
  const [levels, setLevels] = useState<string[]>([]);
  const [language, setLanguage] = useState("");
  const [teacher, setTeacher] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [duration, setDuration] = useState<DurationFilter>("any");
  const [price, setPrice] = useState<PriceFilter>("all");
  const [maxPrice, setMaxPrice] = useState<number | null>(null); // whole currency units; null = no cap

  const unitPrice = (c: Course) => (currency === "USD" ? c.priceUsdCents : c.priceMadCents) / 100;
  const sliderMax = useMemo(() => {
    const top = Math.max(0, ...courses.map(unitPrice));
    return Math.max(10, Math.ceil(top / 10) * 10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courses, currency]);
  const capActive = maxPrice !== null && maxPrice < sliderMax;

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

  const languages = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of courses) map.set(c.language, (map.get(c.language) ?? 0) + 1);
    return [...map.entries()].map(([code, count]) => ({ code, count, name: languageName(code) })).sort((a, b) => a.name.localeCompare(b.name));
  }, [courses]);

  const teachers = useMemo(() => {
    const map = new Map<string, { id: string; name: string; count: number }>();
    for (const c of courses) {
      const e = map.get(c.instructor.id);
      if (e) e.count++;
      else map.set(c.instructor.id, { id: c.instructor.id, name: c.instructor.name ?? "Instructor", count: 1 });
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [courses]);

  const avgOf = (c: Course) => (c.reviews.length ? c.reviews.reduce((sum, r) => sum + r.rating, 0) / c.reviews.length : null);

  const filtered = useMemo(
    () =>
      courses.filter((c) => {
        if (category && c.category.slug !== category) return false;
        if (levels.length && !levels.includes(c.level)) return false;
        if (language && c.language !== language) return false;
        if (teacher && c.instructor.id !== teacher) return false;
        if (minRating) {
          const avg = avgOf(c);
          if (avg === null || avg < minRating) return false;
        }
        if (duration === "short" && c.durationMinutes >= 60) return false;
        if (duration === "medium" && (c.durationMinutes < 60 || c.durationMinutes > 180)) return false;
        if (duration === "long" && c.durationMinutes <= 180) return false;
        const isFree = c.priceMadCents === 0 && c.priceUsdCents === 0;
        if (price === "free" && !isFree) return false;
        if (price === "paid" && isFree) return false;
        if (capActive && unitPrice(c) > (maxPrice as number)) return false;
        return true;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [courses, category, levels, language, teacher, minRating, duration, price, maxPrice, capActive, currency]
  );

  const hasFilters =
    !!category || levels.length > 0 || !!language || !!teacher || minRating > 0 || duration !== "any" || price !== "all" || capActive;
  const visible = filtered.slice(0, PAGE_SIZE);

  const seeAllParams = new URLSearchParams();
  if (category) seeAllParams.set("category", category);
  if (levels.length === 1) seeAllParams.set("level", levels[0]);
  if (price !== "all") seeAllParams.set("price", price);
  const seeAllHref = `/courses${seeAllParams.toString() ? `?${seeAllParams}` : ""}`;

  function toggleLevel(v: string) {
    setLevels((cur) => (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]));
  }
  function clearAll() {
    setCategory("");
    setLevels([]);
    setLanguage("");
    setTeacher("");
    setMinRating(0);
    setDuration("any");
    setPrice("all");
    setMaxPrice(null);
  }

  const optionClass = "flex items-center gap-2.5 cursor-pointer rounded-lg px-2 py-1.5 text-[13px] font-medium text-ink hover:bg-primary-softer";
  const teacherName = teachers.find((t) => t.id === teacher)?.name;
  const categoryName = categories.find((c) => c.slug === category)?.name;
  const currencyLabel = currency === "USD" ? "$" : "MAD";
  const shownMax = maxPrice ?? sliderMax;

  return (
    <section className="pt-3 sm:pt-4 pb-10 sm:pb-14 bg-white">
      <div className="wrap">
        <div className="flex items-baseline justify-between gap-4 mb-4">
          <h2 className="text-[16px] sm:text-[18px] font-extrabold tracking-[-0.02em] text-ink">Browse trainings</h2>
          <Link href={seeAllHref} className="shrink-0 text-[13.5px] font-semibold text-primary-mid hover:underline underline-offset-2">
            See all →
          </Link>
        </div>

        {/* Filters — dropdown bar on top */}
        <div className="mb-5 flex flex-wrap items-center gap-2.5" aria-label="Filters" role="group">
          <Dropdown label={categoryName ?? "Category"} active={!!category} width="w-64">
            <div className="max-h-72 overflow-y-auto">
              <label className={optionClass}>
                <input type="radio" name="shop-category" checked={category === ""} onChange={() => setCategory("")} className="accent-[#064e3b]" />
                All categories
              </label>
              {categories.map((c) => (
                <label key={c.slug} className={optionClass}>
                  <input type="radio" name="shop-category" checked={category === c.slug} onChange={() => setCategory(c.slug)} className="accent-[#064e3b]" />
                  <span className="flex-1">{c.name}</span>
                  <span className="text-[12px] text-primary-mid font-semibold">{c.count}</span>
                </label>
              ))}
            </div>
          </Dropdown>

          <Dropdown label={levels.length ? `Level · ${levels.length}` : "Level"} active={levels.length > 0}>
            {LEVELS.map((l) => (
              <label key={l.value} className={optionClass}>
                <input type="checkbox" checked={levels.includes(l.value)} onChange={() => toggleLevel(l.value)} className="accent-[#064e3b] rounded" />
                {l.label}
              </label>
            ))}
          </Dropdown>

          <Dropdown label={language ? languageName(language) : "Language"} active={!!language}>
            <label className={optionClass}>
              <input type="radio" name="shop-language" checked={language === ""} onChange={() => setLanguage("")} className="accent-[#064e3b]" />
              All languages
            </label>
            {languages.map((l) => (
              <label key={l.code} className={optionClass}>
                <input type="radio" name="shop-language" checked={language === l.code} onChange={() => setLanguage(l.code)} className="accent-[#064e3b]" />
                <span className="flex-1">{l.name}</span>
                <span className="text-[12px] text-primary-mid font-semibold">{l.count}</span>
              </label>
            ))}
          </Dropdown>

          <Dropdown label={teacherName ?? "Teacher"} active={!!teacher} width="w-64">
            <div className="max-h-72 overflow-y-auto">
              <label className={optionClass}>
                <input type="radio" name="shop-teacher" checked={teacher === ""} onChange={() => setTeacher("")} className="accent-[#064e3b]" />
                All teachers
              </label>
              {teachers.map((t) => (
                <label key={t.id} className={optionClass}>
                  <input type="radio" name="shop-teacher" checked={teacher === t.id} onChange={() => setTeacher(t.id)} className="accent-[#064e3b]" />
                  <span className="flex-1 truncate">{t.name}</span>
                  <span className="text-[12px] text-primary-mid font-semibold">{t.count}</span>
                </label>
              ))}
            </div>
          </Dropdown>

          <Dropdown label={minRating ? `${minRating}+ ★` : "Rating"} active={minRating > 0}>
            {RATINGS.map((r) => (
              <label key={r.value} className={optionClass}>
                <input type="radio" name="shop-rating" checked={minRating === r.value} onChange={() => setMinRating(r.value)} className="accent-[#064e3b]" />
                {r.label}
              </label>
            ))}
          </Dropdown>

          <Dropdown label={duration === "any" ? "Duration" : DURATIONS.find((d) => d.value === duration)!.label} active={duration !== "any"}>
            {DURATIONS.map((d) => (
              <label key={d.value} className={optionClass}>
                <input type="radio" name="shop-duration" checked={duration === d.value} onChange={() => setDuration(d.value)} className="accent-[#064e3b]" />
                {d.label}
              </label>
            ))}
          </Dropdown>

          <Dropdown label={capActive ? `Up to ${shownMax} ${currencyLabel}` : price === "all" ? "Price" : price === "free" ? "Free" : "Paid"} active={price !== "all" || capActive} width="w-64">
            {PRICES.map((p) => (
              <label key={p.value} className={optionClass}>
                <input type="radio" name="shop-price" checked={price === p.value} onChange={() => setPrice(p.value)} className="accent-[#064e3b]" />
                {p.label}
              </label>
            ))}
            <div className="mt-2 border-t border-line px-2 pt-3">
              <div className="mb-2 flex items-center justify-between text-[12px] font-semibold text-muted">
                <span>Max price</span>
                <span className="text-ink">
                  {shownMax} {currencyLabel}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={sliderMax}
                step={Math.max(1, sliderMax / 50)}
                value={shownMax}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                aria-label="Maximum price"
                className="w-full cursor-pointer accent-[#064e3b]"
              />
            </div>
          </Dropdown>

          {hasFilters && (
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex h-9 items-center gap-1 rounded-full px-3 text-[13px] font-semibold text-primary-mid hover:underline underline-offset-2"
            >
              <X size={14} aria-hidden="true" />
              Clear
            </button>
          )}

          <span className="ml-auto text-[13px] font-semibold text-muted">
            {filtered.length} training{filtered.length === 1 ? "" : "s"}
          </span>
        </div>

        {visible.length > 0 ? (
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((course, i) => (
              <CourseCardCompact key={course.id} course={course} index={i} currency={currency} />
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
    </section>
  );
}
