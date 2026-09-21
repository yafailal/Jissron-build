"use client";

import { Link } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

interface Category {
  id: string;
  name: string;
  slug: string;
  courseCount: number;
}

interface SubCategoryNavProps {
  categories: Category[];
}

export function SubCategoryNav({ categories }: SubCategoryNavProps) {
  const t = useTranslations("Courses");
  const searchParams = useSearchParams();
  const activeSlug = searchParams.get("category") ?? "";

  function buildHref(slug: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (slug) {
      params.set("category", slug);
    } else {
      params.delete("category");
    }
    params.delete("page");
    return `/courses?${params.toString()}`;
  }

  const allPill = { id: "__all__", name: t("allCourses"), slug: "", courseCount: categories.reduce((s, c) => s + c.courseCount, 0) };
  const pills = [allPill, ...categories];

  return (
    <div className="sticky top-0 z-30 border-b border-line bg-white">
      <div className="wrap">
        <div
          className="flex items-center gap-2 overflow-x-auto py-3"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}
        >
          {pills.map((cat) => {
            const isActive = cat.slug === activeSlug;
            return (
              <Link
                key={cat.id}
                href={buildHref(cat.slug)}
                className={`inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-[13px] font-semibold transition-colors ${
                  isActive
                    ? "bg-primary text-white"
                    : "border border-primary-soft bg-primary-softer text-ink hover:border-primary-mid"
                }`}
              >
                {cat.name}
                <span
                  className={`rounded-full px-1.5 text-[11px] font-bold ${
                    isActive ? "bg-white/20 text-white" : "bg-white text-muted"
                  }`}
                >
                  {cat.courseCount}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
