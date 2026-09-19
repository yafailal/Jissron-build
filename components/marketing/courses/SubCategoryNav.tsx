"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

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

  const allPill = { id: "__all__", name: "All Courses", slug: "", courseCount: categories.reduce((s, c) => s + c.courseCount, 0) };
  const pills = [allPill, ...categories];

  return (
    <div
      className="bg-white border-b border-[#d9dcd6] sticky top-0 z-30"
      style={{ boxShadow: "0 1px 0 0 #d9dcd6" }}
    >
      <div className="max-w-[1200px] mx-auto px-6">
        <div
          className="flex items-center gap-1 overflow-x-auto"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {pills.map((cat) => {
            const isActive = cat.slug === activeSlug;
            return (
              <Link
                key={cat.id}
                href={buildHref(cat.slug)}
                className="shrink-0 flex items-center gap-1.5 px-4 py-[14px] text-[13px] font-600 whitespace-nowrap transition-all duration-150 border-b-2"
                style={{
                  color: isActive ? "#064e3b" : "#6b7b72",
                  borderBottomColor: isActive ? "#064e3b" : "transparent",
                }}
              >
                {cat.name}
                <span
                  className="text-[11px] font-700 px-[6px] py-[1px] rounded-full"
                  style={{
                    background: isActive ? "#064e3b" : "#f7f6ef",
                    color: isActive ? "#ffffff" : "#6b7b72",
                  }}
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
