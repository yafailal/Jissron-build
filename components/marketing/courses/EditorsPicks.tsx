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
      className="group bg-white rounded-xl overflow-hidden border border-[#d9dcd6] flex flex-col transition-all duration-200 hover:-translate-y-[3px] hover:shadow-[0_12px_32px_rgba(0,20,60,0.12)] hover:border-[#064e3b]"
    >
      {/* Thumbnail */}
      <div
        className="relative h-[140px] flex items-center justify-center"
        style={{ background: THUMB_GRADIENTS[index % THUMB_GRADIENTS.length] }}
      >
        <span
          className="text-[52px] text-white/20 italic select-none"
          aria-hidden="true"
        >
          {course.title[0]}
        </span>
        {course.isBestseller && (
          <span className="absolute top-2.5 left-2.5 bg-[#10b981] text-white text-[10px] font-700 px-2 py-[3px] rounded-full">
            {t("bestseller")}
          </span>
        )}
        {course.isFeatured && !course.isBestseller && (
          <span className="absolute top-2.5 left-2.5 bg-[#064e3b] text-white text-[10px] font-700 px-2 py-[3px] rounded-full">
            {t("featured")}
          </span>
        )}
        {course.priceMadCents === 0 && course.priceUsdCents === 0 && (
          <span className="absolute top-2.5 right-2.5 bg-[#16a34a] text-white text-[10px] font-700 px-2 py-[3px] rounded-full">
            {t("free")}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        <p className="text-[12px] font-600 uppercase tracking-[0.08em] text-[#10b981]">
          {course.category.name}
        </p>
        <h3
          className="text-[14px] font-700 text-[#064e3b] leading-[1.3] line-clamp-2 group-hover:text-[#064e3b] transition-colors"
        >
          {course.title}
        </h3>
        <p className="text-[12px] text-[#6b7b72]">{course.instructor.name}</p>

        {avgRating > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-[#10b981] text-[12px] tracking-[0.5px]">
              {"★".repeat(Math.round(avgRating))}
            </span>
            <span className="text-[11px] text-[#6b7b72]">
              ({course.reviews.length})
            </span>
          </div>
        )}

        <div className="mt-auto pt-2 flex items-center justify-between">
          <span className="text-[14px] font-700 text-[#064e3b]">
            {formatPrice(course.priceMadCents, course.priceUsdCents, currency)}
          </span>
          {course.durationMinutes > 0 && (
            <span className="text-[11px] text-[#6b7b72]">
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
    <section className="max-w-[1200px] mx-auto px-6 py-12">
      {/* Header */}
      <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
        <div>
          <p className="text-[11px] font-700 uppercase tracking-[0.12em] text-[#10b981] mb-1.5">
            {t("picks.eyebrow")}
          </p>
          <h2
            className="font-400 leading-tight"
            style={{
              fontSize: "clamp(24px, 2.5vw, 30px)",
              color: "#064e3b",
            }}
          >
            {t("picks.title")}
          </h2>
        </div>

        {/* Tabs */}
        <div
          className="flex items-center gap-1 p-1 rounded-xl"
          style={{ background: "#f7f6ef" }}
        >
          {TAB_IDS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className="px-4 py-2 text-[13px] font-600 rounded-lg transition-all duration-150"
              style={{
                background: activeTab === id ? "#ffffff" : "transparent",
                color: activeTab === id ? "#064e3b" : "#6b7b72",
                boxShadow: activeTab === id ? "0 1px 4px rgba(0,20,60,0.1)" : "none",
              }}
            >
              {t(`picks.tabs.${id}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {courses.length > 0 ? (
        <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
          {courses.map((course, i) => (
            <PicksCard key={course.id} course={course} index={i} currency={currency} />
          ))}
        </div>
      ) : (
        <p className="text-[14px] text-[#6b7b72] py-8 text-center">{t("picks.empty")}</p>
      )}
    </section>
  );
}
