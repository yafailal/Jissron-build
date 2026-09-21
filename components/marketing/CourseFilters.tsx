"use client";

import { useSearchParams } from "next/navigation";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useCallback } from "react";
import { useTranslations } from "next-intl";

interface Category {
  slug: string;
  name: string;
}

interface CourseFiltersProps {
  categories: Category[];
}

export function CourseFilters({ categories }: CourseFiltersProps) {
  const t = useTranslations("Courses");
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const update = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      next.delete("page"); // reset pagination on filter change
      router.push(`${pathname}?${next.toString()}`);
    },
    [router, pathname, params]
  );

  const current = (key: string) => params.get(key) ?? "";

  return (
    <form className="flex flex-wrap gap-3 items-center" onSubmit={(e) => e.preventDefault()}>
      {/* Category */}
      <select
        value={current("category")}
        onChange={(e) => update("category", e.target.value)}
        className="h-9 px-3.5 rounded-full border border-line text-[13px] text-ink bg-white font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-bright/35 cursor-pointer"
        aria-label={t("filterBar.byCategory")}
      >
        <option value="">{t("filterBar.allCategories")}</option>
        {categories.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.name}
          </option>
        ))}
      </select>

      {/* Level */}
      <select
        value={current("level")}
        onChange={(e) => update("level", e.target.value)}
        className="h-9 px-3.5 rounded-full border border-line text-[13px] text-ink bg-white font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-bright/35 cursor-pointer"
        aria-label={t("filterBar.byLevel")}
      >
        <option value="">{t("filterBar.allLevels")}</option>
        <option value="BEGINNER">{t("filters.levelOpts.BEGINNER")}</option>
        <option value="INTERMEDIATE">{t("filters.levelOpts.INTERMEDIATE")}</option>
        <option value="ADVANCED">{t("filters.levelOpts.ADVANCED")}</option>
      </select>

      {/* Price */}
      <select
        value={current("price")}
        onChange={(e) => update("price", e.target.value)}
        className="h-9 px-3.5 rounded-full border border-line text-[13px] text-ink bg-white font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-bright/35 cursor-pointer"
        aria-label={t("filterBar.byPrice")}
      >
        <option value="">{t("filterBar.anyPrice")}</option>
        <option value="free">{t("filters.priceOpts.free")}</option>
        <option value="paid">{t("filters.priceOpts.paid")}</option>
      </select>

      {/* Sort */}
      <select
        value={current("sort")}
        onChange={(e) => update("sort", e.target.value)}
        className="h-9 px-3.5 rounded-full border border-line text-[13px] text-ink bg-white font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-bright/35 cursor-pointer"
        aria-label={t("filterBar.sortCourses")}
      >
        <option value="newest">{t("filterBar.newest")}</option>
        <option value="popular">{t("filters.sortOpts.popular")}</option>
      </select>

      {/* Clear */}
      {["category", "level", "price", "sort"].some((k) => params.has(k)) && (
        <button
          type="button"
          onClick={() => router.push(pathname)}
          className="h-9 px-3 text-sm text-muted hover:text-primary transition-colors font-medium"
        >
          {t("filterBar.clear")}
        </button>
      )}
    </form>
  );
}
