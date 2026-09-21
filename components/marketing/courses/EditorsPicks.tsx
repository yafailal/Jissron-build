"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { CourseCard } from "@/lib/data/courses";
import type { Currency } from "@/lib/currency";
import { formatPrice } from "@/lib/currency";

const THUMB_GRADIENTS = [
  "linear-gradient(135deg,#064e3b 0%,#10b981 100%)",
  "linear-gradient(135deg,#0b6b53 0%,#0e7a5a 100%)",
  "linear-gradient(135deg,#033a2c 0%,#0b6b53 100%)",
  "linear-gradient(135deg,#064e3b 0%,#10b981 100%)",
];

interface PicksCardProps {
  course: CourseCard;
  index: number;
  currency: Currency;
}

function PicksCard({ course, index, currency }: PicksCardProps) {
  const t = useTranslations("Courses");
  const avgRating =
    course.reviews.length
      ? course.reviews.reduce((s, r) => s + r.rating, 0) / course.reviews.length
      : 0;

  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group bg-white rounded-2xl overflow-hidden border border-line flex flex-col transition-colors hover:border-primary hover:shadow-card"
    >
      {/* Thumbnail */}
      <div
        className="relative h-[140px] flex items-center justify-center"
        style={{ background: THUMB_GRADIENTS[index % THUMB_GRADIENTS.length] }}
      >
        <span
          className="text-[52px] text-white/20 select-none"
          aria-hidden="true"
        >
          {course.title[0]}
        </span>
        {course.isBestseller && (
          <span className="absolute top-2.5 start-2.5 bg-primary-bright text-white text-[10px] font-bold px-2 py-[3px] rounded-full">
            {t("bestseller")}
          </span>
        )}
        {course.isFeatured && !course.isBestseller && (
          <span className="absolute top-2.5 start-2.5 bg-primary text-white text-[10px] font-bold px-2 py-[3px] rounded-full">
            {t("featured")}
          </span>
        )}
        {course.priceMadCents === 0 && course.priceUsdCents === 0 && (
          <span className="absolute top-2.5 end-2.5 bg-primary-bright text-white text-[10px] font-bold px-2 py-[3px] rounded-full">
            {t("free")}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-primary-mid">
          {course.category.name}
        </p>
        <h3
          className="text-[14px] font-bold text-ink leading-[1.3] line-clamp-2 "
        >
          {course.title}
        </h3>
        <p className="text-[12px] text-muted">{course.instructor.name}</p>

        {avgRating > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-primary-mid text-[12px] tracking-[0.5px]">
              {"★".repeat(Math.round(avgRating))}
            </span>
            <span className="text-[11px] text-muted">
              ({course.reviews.length})
            </span>
          </div>
        )}

        <div className="mt-auto pt-2 flex items-center justify-between">
          <span className="text-[14px] font-bold text-ink">
            {formatPrice(course.priceMadCents, course.priceUsdCents, currency)}
          </span>
          {course.durationMinutes > 0 && (
            <span className="text-[11px] text-muted">
              {t("hoursShort", { count: Math.round(course.durationMinutes / 60) })}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

const TAB_IDS = ["featured", "new", "free"] as const;

interface EditorsPicksProps {
  featured: CourseCard[];
  newReleases: CourseCard[];
  free: CourseCard[];
  currency: Currency;
}

export function EditorsPicks({ featured, newReleases, free, currency }: EditorsPicksProps) {
  const t = useTranslations("Courses");
  const [activeTab, setActiveTab] = useState<"featured" | "new" | "free">("featured");

  const coursesByTab = { featured, new: newReleases, free };
  const courses = coursesByTab[activeTab];

  return (
    <section className="wrap py-8">
      {/* Header */}
      <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
        <div>
          <p className="mb-1.5 text-[12px] font-bold uppercase tracking-[0.1em] text-primary-mid">
            {t("picks.eyebrow")}
          </p>
          <h2 className="text-[22px] font-extrabold leading-tight tracking-[-0.02em] text-ink sm:text-[26px]">
            {t("picks.title")}
          </h2>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {TAB_IDS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`h-8 rounded-full px-3.5 text-[13px] font-semibold transition-colors ${
                activeTab === id
                  ? "bg-primary text-white"
                  : "border border-primary-soft bg-primary-softer text-ink hover:border-primary-mid"
              }`}
            >
              {t(`picks.tabs.${id}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {courses.length > 0 ? (
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
          {courses.map((course, i) => (
            <PicksCard key={course.id} course={course} index={i} currency={currency} />
          ))}
        </div>
      ) : (
        <p className="text-[14px] text-muted py-8 text-center">{t("picks.empty")}</p>
      )}
    </section>
  );
}
