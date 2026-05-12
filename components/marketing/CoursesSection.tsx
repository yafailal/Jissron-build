"use client";

import { useState } from "react";
import Link from "next/link";
import { CourseCarousel } from "./CourseCarousel";
import type { Course } from "@/lib/data/homepage";
import type { Currency } from "@/lib/currency";

const TABS = [
  { label: "Most popular", filter: (c: Course) => c.isBestseller || c.isFeatured },
  { label: "New this week", filter: (c: Course) => c.badge === "NEW" || c.badge === "HOT" },
  { label: "AI & Machine Learning", filter: (c: Course) => c.category.slug === "ai-ml" || c.category.slug === "ai-tools" },
  { label: "Design", filter: (c: Course) => c.category.slug === "design" },
  { label: "Business", filter: (c: Course) => c.category.slug === "business" || c.category.slug === "product-strategy" },
  { label: "Programming", filter: (c: Course) => c.category.slug === "programming" },
];

interface CoursesSectionProps {
  courses: Course[];
  currency: Currency;
}

export function CoursesSection({ courses, currency }: CoursesSectionProps) {
  const [activeTab, setActiveTab] = useState(0);

  const filtered = (() => {
    const result = courses.filter(TABS[activeTab].filter);
    return result.length ? result : courses;
  })();

  return (
    <section className="section bg-white" id="courses">
      <div className="wrap">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-7">
          <div>
            <div className="section-eyebrow">On-demand courses</div>
            <h2 className="section-title mt-1 max-w-[560px]">
              Expand your career with expert-led programs
            </h2>
            <p className="text-[15px] text-body-text mt-3 max-w-[560px] leading-relaxed font-medium">
              Learn from industry practitioners with 1,200+ courses. Get lifetime access, verified certificates, and real-world projects.
            </p>
          </div>
          <Link
            href="/courses"
            className="shrink-0 inline-flex items-center px-5 py-2.5 text-[13.5px] font-semibold text-primary border-[1.5px] border-primary rounded-lg hover:bg-primary hover:text-white transition-all duration-200"
          >
            Browse all courses →
          </Link>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {TABS.map((tab, i) => (
            <button
              key={tab.label}
              onClick={() => setActiveTab(i)}
              className={`shrink-0 px-4 py-2 text-[13px] font-semibold rounded-md whitespace-nowrap transition-colors duration-150 ${
                activeTab === i
                  ? "bg-primary text-white"
                  : "text-body-text hover:bg-bg-hover"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <CourseCarousel courses={filtered} currency={currency} />

        <div className="mt-8 text-center">
          <Link
            href="/courses"
            className="inline-flex items-center px-8 py-4 text-[15px] font-bold text-white bg-primary rounded-lg hover:bg-primary-hover hover:-translate-y-px hover:shadow-btn transition-all duration-200"
          >
            Browse all 1,200+ courses →
          </Link>
        </div>
      </div>
    </section>
  );
}
