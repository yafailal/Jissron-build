import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  getPublishedCourses,
  getCoursesSearchIndex,
  getAllCategoriesWithCounts,
  getEditorsPicks,
  type DurationRange,
} from "@/lib/data/courses";
import { getCurrentCurrency } from "@/lib/currency-server";
import { CoursesHero } from "@/components/marketing/courses/CoursesHero";
import { SubCategoryNav } from "@/components/marketing/courses/SubCategoryNav";
import { EditorsPicks } from "@/components/marketing/courses/EditorsPicks";
import { CourseFiltersSidebar } from "@/components/marketing/courses/CourseFiltersSidebar";
import { CourseListRow } from "@/components/marketing/courses/CourseListRow";
import { SuggestCourseCTA } from "@/components/marketing/courses/SuggestCourseCTA";
import { MobileFiltersDrawer } from "@/components/marketing/courses/MobileFiltersDrawer";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Courses" });
  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

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
  const t = await getTranslations("Courses");

  const categorySlug = getStr(params.category);
  const level = getStr(params.level);
  const price = getStr(params.price) as "free" | "paid" | "";
  const sort = (getStr(params.sort) || "newest") as "newest" | "popular";
  const page = Math.max(1, Number(getStr(params.page) || 1));
  const durationRanges = getArr(params.duration) as DurationRange[];
  const minRating = Number(getStr(params.rating)) || 0;
  const search = getStr(params.search);

  const hasFilters = !!(categorySlug || level || price || search || durationRanges.length || minRating);

  const [{ courses, total, pageCount }, categories, searchIndex, currency] = await Promise.all([
    getPublishedCourses({
      categorySlug: categorySlug || undefined,
      level: level || undefined,
      price: (price as "free" | "paid") || undefined,
      sort,
      page,
      durationRanges,
      minRating,
      search: search || undefined,
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
    if (minRating) next.set("rating", String(minRating));
    next.set("page", String(p));
    return `/courses?${next.toString()}`;
  }

  return (
    <main id="main-content" className="min-h-screen bg-white">
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
        <div className="wrap">
          <div className="border-t border-line" />
        </div>
      )}

      {/* Main content: sidebar + list */}
      <div className="wrap py-8">
        {/* Result count + active search indicator */}
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div>
            {search && (
              <p className="text-[13px] text-muted mb-1">
                {t("resultsFor")}{" "}
                <span className="font-bold text-ink">&ldquo;{search}&rdquo;</span>
              </p>
            )}
            <p className="text-[15px] font-bold text-ink">
              {total > 0
                ? t("search.courseCount", { count: total })
                : t("noMatch")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Mobile filters trigger — hidden on desktop */}
            <MobileFiltersDrawer />
            {hasFilters && (
              <Link
                href="/courses"
                className="text-[13px] font-semibold text-primary-mid hover:text-primary transition-colors"
              >
                {t("clearAllFiltersX")}
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
                    aria-label={t("pagination.label")}
                    className="flex items-center justify-center gap-3 mt-10"
                  >
                    {page > 1 && (
                      <Link
                        href={buildPageUrl(page - 1)}
                        className="flex items-center gap-1 h-9 px-4 rounded-full border-[1.5px] border-primary text-[13px] font-bold text-primary bg-transparent hover:bg-primary hover:text-white transition-colors"
                      >
                        <ChevronLeft size={14} className="rtl:rotate-180" />
                        {t("pagination.previous")}
                      </Link>
                    )}
                    <span className="text-[13px] text-muted font-medium px-2">
                      {t("pagination.pageOf", { page, pageCount })}
                    </span>
                    {page < pageCount && (
                      <Link
                        href={buildPageUrl(page + 1)}
                        className="flex items-center gap-1 h-9 px-4 rounded-full border-[1.5px] border-primary text-[13px] font-bold text-primary bg-transparent hover:bg-primary hover:text-white transition-colors"
                      >
                        {t("pagination.next")}
                        <ChevronRight size={14} className="rtl:rotate-180" />
                      </Link>
                    )}
                  </nav>
                )}
              </>
            ) : (
              <div className="text-center py-12 bg-white rounded-2xl border border-line">
                <p className="text-[22px] font-extrabold tracking-[-0.02em] text-ink mb-2">{t("empty.title")}</p>
                <p className="text-[14px] text-muted mb-6">
                  {t("empty.body")}
                </p>
                <Link
                  href="/courses"
                  className="inline-flex h-11 items-center justify-center px-6 rounded-full bg-primary text-white font-bold hover:bg-primary-hover transition-colors"
                >
                  {t("empty.clear")}
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
