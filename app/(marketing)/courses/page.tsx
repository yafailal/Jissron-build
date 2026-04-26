import { Suspense } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  getPublishedCourses,
  getCoursesSearchIndex,
  getAllCategoriesWithCounts,
  getEditorsPicks,
  type DurationRange,
  type PaymentMethodFilter,
} from "@/lib/data/courses";
import { getCurrentCurrency } from "@/lib/currency-server";
import { CoursesHero } from "@/components/marketing/courses/CoursesHero";
import { SubCategoryNav } from "@/components/marketing/courses/SubCategoryNav";
import { EditorsPicks } from "@/components/marketing/courses/EditorsPicks";
import { CourseFiltersSidebar } from "@/components/marketing/courses/CourseFiltersSidebar";
import { CourseListRow } from "@/components/marketing/courses/CourseListRow";
import { SuggestCourseCTA } from "@/components/marketing/courses/SuggestCourseCTA";
import { MobileFiltersDrawer } from "@/components/marketing/courses/MobileFiltersDrawer";

export const metadata = {
  title: "Courses — JissrON",
  description:
    "Master in-demand skills with expert-led courses from JissrON. Learn at your own pace, earn certificates, pay in MAD or USD.",
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function getStr(v: string | string[] | undefined): string {
  return Array.isArray(v) ? v[0] : v ?? "";
}

function getArr(v: string | string[] | undefined): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

export default async function CoursesPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const categorySlug = getStr(params.category);
  const level = getStr(params.level);
  const price = getStr(params.price) as "free" | "paid" | "";
  const sort = (getStr(params.sort) || "newest") as "newest" | "popular";
  const page = Math.max(1, Number(getStr(params.page) || 1));
  const durationRanges = getArr(params.duration) as DurationRange[];
  const paymentMethods = getArr(params.payment) as PaymentMethodFilter[];
  const minRating = Number(getStr(params.rating)) || 0;
  const search = getStr(params.search);

  const hasFilters = !!(categorySlug || level || price || search || durationRanges.length || paymentMethods.length || minRating);

  const [{ courses, total, pageCount }, categories, searchIndex, currency] = await Promise.all([
    getPublishedCourses({
      categorySlug: categorySlug || undefined,
      level: level || undefined,
      price: (price as "free" | "paid") || undefined,
      sort,
      page,
      durationRanges,
      paymentMethods,
      minRating,
    }),
    getAllCategoriesWithCounts(),
    getCoursesSearchIndex(),
    getCurrentCurrency(),
  ]);

  // Editor's picks — only fetched when no active filters
  const picks = hasFilters
    ? null
    : await Promise.all([
        getEditorsPicks("featured", 4),
        getEditorsPicks("new", 4),
        getEditorsPicks("free", 4),
      ]);

  // Normalise categories for SubCategoryNav
  const navCategories = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    courseCount: c._count.courses,
  }));

  function buildPageUrl(p: number) {
    const next = new URLSearchParams();
    if (categorySlug) next.set("category", categorySlug);
    if (level) next.set("level", level);
    if (price) next.set("price", price);
    if (sort !== "newest") next.set("sort", sort);
    if (search) next.set("search", search);
    durationRanges.forEach((d) => next.append("duration", d));
    paymentMethods.forEach((m) => next.append("payment", m));
    if (minRating) next.set("rating", String(minRating));
    next.set("page", String(p));
    return `/courses?${next.toString()}`;
  }

  return (
    <main id="main-content" className="min-h-screen bg-[#f8fafc]">
      {/* Hero with search */}
      <CoursesHero searchIndex={searchIndex} currency={currency} />

      {/* Sub-category navigation */}
      <Suspense>
        <SubCategoryNav categories={navCategories} />
      </Suspense>

      {/* Editor's picks — hidden when filters are active */}
      {picks && (
        <EditorsPicks
          featured={picks[0]}
          newReleases={picks[1]}
          free={picks[2]}
          currency={currency}
        />
      )}

      {/* Divider before list */}
      {picks && (
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="border-t border-[#e6ecf2]" />
        </div>
      )}

      {/* Main content: sidebar + list */}
      <div className="max-w-[1200px] mx-auto px-6 py-10">
        {/* Result count + active search indicator */}
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div>
            {search && (
              <p className="text-[13px] text-[#6a7890] mb-1">
                Results for{" "}
                <span className="font-700 text-[#081a36]">&ldquo;{search}&rdquo;</span>
              </p>
            )}
            <p className="text-[15px] font-700 text-[#081a36]">
              {total > 0
                ? `${total} course${total === 1 ? "" : "s"}`
                : "No courses match your filters"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Mobile filters trigger — hidden on desktop */}
            <MobileFiltersDrawer />
            {hasFilters && (
              <Link
                href="/courses"
                className="text-[13px] font-600 text-[#0071e3] hover:text-[#003d80] transition-colors"
              >
                Clear all filters ×
              </Link>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Sidebar — desktop only */}
          <div className="hidden md:block">
            <Suspense>
              <CourseFiltersSidebar />
            </Suspense>
          </div>

          {/* Course list */}
          <div className="flex-1 min-w-0">
            {courses.length > 0 ? (
              <>
                <div className="flex flex-col gap-4">
                  {courses.map((course, i) => (
                    <CourseListRow
                      key={course.id}
                      course={course}
                      index={i}
                      currency={currency}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {pageCount > 1 && (
                  <nav
                    aria-label="Pagination"
                    className="flex items-center justify-center gap-3 mt-10"
                  >
                    {page > 1 && (
                      <Link
                        href={buildPageUrl(page - 1)}
                        className="flex items-center gap-1 h-9 px-4 rounded-lg border border-[#e6ecf2] text-[13px] font-600 text-[#081a36] hover:border-[#003d80] hover:text-[#003d80] transition-colors bg-white"
                      >
                        <ChevronLeft size={14} />
                        Previous
                      </Link>
                    )}
                    <span className="text-[13px] text-[#6a7890] font-500 px-2">
                      Page {page} of {pageCount}
                    </span>
                    {page < pageCount && (
                      <Link
                        href={buildPageUrl(page + 1)}
                        className="flex items-center gap-1 h-9 px-4 rounded-lg border border-[#e6ecf2] text-[13px] font-600 text-[#081a36] hover:border-[#003d80] hover:text-[#003d80] transition-colors bg-white"
                      >
                        Next
                        <ChevronRight size={14} />
                      </Link>
                    )}
                  </nav>
                )}
              </>
            ) : (
              <div className="text-center py-20 bg-white rounded-2xl border border-[#e6ecf2]">
                <p className="text-[18px] font-800 text-[#081a36] mb-2">No courses found</p>
                <p className="text-[14px] text-[#6a7890] mb-6">
                  Try adjusting your filters or browse all categories.
                </p>
                <Link
                  href="/courses"
                  className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-[#003d80] text-white text-[13px] font-700 hover:bg-[#0058b8] transition-colors"
                >
                  Clear all filters
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Suggest CTA */}
        <SuggestCourseCTA />
      </div>
    </main>
  );
}
