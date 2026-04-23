"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";

interface Category {
  slug: string;
  name: string;
}

interface CourseFiltersProps {
  categories: Category[];
}

export function CourseFilters({ categories }: CourseFiltersProps) {
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
        className="h-9 px-3 rounded-lg border border-line text-sm text-ink bg-white font-500 focus:outline-none focus:ring-2 focus:ring-primary-bright cursor-pointer"
        aria-label="Filter by category"
      >
        <option value="">All categories</option>
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
        className="h-9 px-3 rounded-lg border border-line text-sm text-ink bg-white font-500 focus:outline-none focus:ring-2 focus:ring-primary-bright cursor-pointer"
        aria-label="Filter by level"
      >
        <option value="">All levels</option>
        <option value="BEGINNER">Beginner</option>
        <option value="INTERMEDIATE">Intermediate</option>
        <option value="ADVANCED">Advanced</option>
      </select>

      {/* Price */}
      <select
        value={current("price")}
        onChange={(e) => update("price", e.target.value)}
        className="h-9 px-3 rounded-lg border border-line text-sm text-ink bg-white font-500 focus:outline-none focus:ring-2 focus:ring-primary-bright cursor-pointer"
        aria-label="Filter by price"
      >
        <option value="">Any price</option>
        <option value="free">Free</option>
        <option value="paid">Paid</option>
      </select>

      {/* Sort */}
      <select
        value={current("sort")}
        onChange={(e) => update("sort", e.target.value)}
        className="h-9 px-3 rounded-lg border border-line text-sm text-ink bg-white font-500 focus:outline-none focus:ring-2 focus:ring-primary-bright cursor-pointer"
        aria-label="Sort courses"
      >
        <option value="newest">Newest</option>
        <option value="popular">Most popular</option>
      </select>

      {/* Clear */}
      {["category", "level", "price", "sort"].some((k) => params.has(k)) && (
        <button
          type="button"
          onClick={() => router.push(pathname)}
          className="h-9 px-3 text-sm text-muted hover:text-primary transition-colors font-500"
        >
          Clear filters
        </button>
      )}
    </form>
  );
}
