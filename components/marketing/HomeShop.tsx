"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";
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

const optionClass = "flex items-center gap-2.5 cursor-pointer rounded-lg px-2 py-1.5 text-[13px] font-medium text-ink hover:bg-primary-softer";

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
  title,
  label,
  active,
  children,
  width = "w-56",
}: {
  title: string;
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
    <div ref={ref} className="relative flex items-center gap-2">
      <span className="text-[12px] font-bold uppercase tracking-[0.06em] text-muted">{title}</span>
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
          className={`absolute left-0 top-full z-30 mt-2 max-w-[calc(100vw-2rem)] ${width} rounded-2xl border border-line bg-white p-3 shadow-card`}
        >
          {children}
        </div>
      )}
    </div>
  );
}

interface Opt {
  value: string;
  label: string;
  count?: number;
}

/** Search box + option list (radio or checkbox). Filters as you type; state resets when the dropdown closes. */
function OptionList({
  name,
  options,
  selected,
  onChange,
  multi = false,
  placeholder,
}: {
  name: string;
  options: Opt[];
  selected: string[];
  onChange: (next: string[]) => void;
  multi?: boolean;
  placeholder: string;
}) {
  const [q, setQ] = useState("");
  const shown = options.filter((o) => o.label.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div>
      <div className="relative mb-2">
        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
        <input
          type="search"
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="h-9 w-full rounded-full border border-line bg-white pl-8 pr-3 text-[13px] text-ink outline-none placeholder:text-muted focus:border-primary-bright focus:ring-2 focus:ring-primary-bright/25"
        />
      </div>
      <div className="max-h-60 overflow-y-auto">
        {shown.map((o) => {
          const checked = selected.includes(o.value);
          return (
            <label key={o.value} className={optionClass}>
              <input
                type={multi ? "checkbox" : "radio"}
                name={name}
                checked={checked}
                onChange={() => onChange(multi ? (checked ? selected.filter((x) => x !== o.value) : [...selected, o.value]) : [o.value])}
                className="accent-[#064e3b]"
              />
              <span className="flex-1 truncate">{o.label}</span>
              {o.count !== undefined && <span className="text-[12px] text-primary-mid font-semibold">{o.count}</span>}
            </label>
          );
        })}
        {shown.length === 0 && <p className="px-2 py-3 text-[13px] text-muted">No match</p>}
      </div>
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

        {/* Filters — centred dropdown bar, each with its own live search */}
        <div className="mb-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-3" aria-label="Filters" role="group">
          <Dropdown title="Category" label={categoryName ?? "All"} active={!!category} width="w-64">
            <OptionList
              name="shop-category"
              placeholder="Search categories"
              options={[{ value: "", label: "All categories" }, ...categories.map((c) => ({ value: c.slug, label: c.name, count: c.count }))]}
              selected={[category]}
              onChange={([v]) => setCategory(v)}
            />
          </Dropdown>

          <Dropdown title="Language" label={language ? languageName(language) : "All"} active={!!language}>
            <OptionList
              name="shop-language"
              placeholder="Search languages"
              options={[{ value: "", label: "All languages" }, ...languages.map((l) => ({ value: l.code, label: l.name, count: l.count }))]}
              selected={[language]}
              onChange={([v]) => setLanguage(v)}
            />
          </Dropdown>

          <Dropdown title="Teacher" label={teacherName ?? "All"} active={!!teacher} width="w-64">
            <OptionList
              name="shop-teacher"
              placeholder="Search teachers"
              options={[{ value: "", label: "All teachers" }, ...teachers.map((t) => ({ value: t.id, label: t.name, count: t.count }))]}
              selected={[teacher]}
              onChange={([v]) => setTeacher(v)}
            />
          </Dropdown>

          <Dropdown title="Level" label={levels.length ? `${levels.length} selected` : "All"} active={levels.length > 0}>
            <OptionList name="shop-level" placeholder="Search levels" multi options={LEVELS} selected={levels} onChange={setLevels} />
          </Dropdown>

          <Dropdown title="Rating" label={minRating ? `${minRating}+ ★` : "Any"} active={minRating > 0}>
            <OptionList
              name="shop-rating"
              placeholder="Search ratings"
              options={RATINGS.map((r) => ({ value: String(r.value), label: r.label }))}
              selected={[String(minRating)]}
              onChange={([v]) => setMinRating(Number(v))}
            />
          </Dropdown>

          <Dropdown title="Duration" label={duration === "any" ? "Any" : DURATIONS.find((d) => d.value === duration)!.label} active={duration !== "any"}>
            <OptionList
              name="shop-duration"
              placeholder="Search durations"
              options={DURATIONS.map((d) => ({ value: d.value, label: d.label }))}
              selected={[duration]}
              onChange={([v]) => setDuration(v as DurationFilter)}
            />
          </Dropdown>

          <Dropdown
            title="Price"
            label={capActive ? `Up to ${shownMax} ${currencyLabel}` : price === "all" ? "All" : price === "free" ? "Free" : "Paid"}
            active={price !== "all" || capActive}
            width="w-64"
          >
            <OptionList
              name="shop-price"
              placeholder="Search prices"
              options={PRICES.map((p) => ({ value: p.value, label: p.label }))}
              selected={[price]}
              onChange={([v]) => setPrice(v as PriceFilter)}
            />
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
        </div>
        <p className="mb-4 text-center text-[13px] font-semibold text-muted">
          {filtered.length} training{filtered.length === 1 ? "" : "s"}
        </p>

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
