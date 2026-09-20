import type { Metadata } from "next";
import {
  getSiteSettings,
  getFeaturedCourses,
  getUpcomingLiveSessions,
  getFeaturedConsultants,
} from "@/lib/data/homepage";
import { getAllCategoriesWithCounts, getEditorsPicks, getShopCourses } from "@/lib/data/courses";
import { getDashboardData } from "@/lib/data/dashboard";
import { getCurrentCurrency } from "@/lib/currency-server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

import { Hero } from "@/components/marketing/Hero";
import { TopCarousel } from "@/components/marketing/TopCarousel";
import { HomeShop } from "@/components/marketing/HomeShop";
import { ContinueLearningRow } from "@/components/marketing/ContinueLearningRow";
import { CourseRow } from "@/components/marketing/CourseRow";
import { MidCtaBanner } from "@/components/marketing/MidCtaBanner";
import { LiveSessionsSection } from "@/components/marketing/LiveSessionsSection";
import { ConsultantsSection } from "@/components/marketing/ConsultantsSection";
import { FinalCta } from "@/components/marketing/FinalCta";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: settings?.seoTitle ?? "AILearn — Learning Management System",
    description: settings?.seoDescription ?? undefined,
    openGraph: settings?.seoOgImageUrl
      ? { images: [settings.seoOgImageUrl] }
      : undefined,
  };
}

export default async function HomePage() {
  const session = await auth();
  const userId = session?.user?.id;

  const [settings, courses, sessions, consultants, currency, categories, shopCourses, featured, fresh, free, dashboard] =
    await Promise.all([
      getSiteSettings(),
      getFeaturedCourses(),
      getUpcomingLiveSessions(),
      getFeaturedConsultants(),
      getCurrentCurrency(),
      getAllCategoriesWithCounts(),
      getShopCourses(48),
      getEditorsPicks("featured", 10),
      getEditorsPicks("new", 10),
      getEditorsPicks("free", 10),
      userId ? getDashboardData(userId) : Promise.resolve(null),
    ]);

  if (!settings) return null;

  // Mid-CTA course picks: prefer admin-chosen IDs, fall back to top featured.
  const chosenIds = ((settings.midCtaCourseIds as string[] | undefined) ?? []).filter(Boolean);
  let midCtaCourses: typeof courses = [];
  if (chosenIds.length > 0) {
    // Fetch chosen courses by ID — they might not be in `courses` (which is just top 12 featured).
    const picked = await db.course.findMany({
      where: { id: { in: chosenIds }, status: "PUBLISHED" },
      include: { instructor: true, category: true, modules: true, reviews: true },
    });
    // Preserve the admin-picked order.
    midCtaCourses = chosenIds
      .map((id) => picked.find((c) => c.id === id))
      .filter((c): c is typeof courses[number] => !!c);
  }
  // Fill any empty slots with top featured courses
  if (midCtaCourses.length < 2) {
    const used = new Set(midCtaCourses.map((c) => c.id));
    for (const c of courses) {
      if (midCtaCourses.length >= 2) break;
      if (!used.has(c.id)) midCtaCourses.push(c);
    }
  }
  midCtaCourses = midCtaCourses.slice(0, 2);

  const inProgress = (dashboard?.enrolledCourses ?? []).filter((c) => c.status !== "completed");
  const hasCourses = featured.length + fresh.length + free.length > 0;

  return (
    <main id="main-content">
      <Hero
        settings={settings}
        currency={currency}
        categories={categories.map((c) => ({ name: c.name, slug: c.slug }))}
        course={courses[0] ?? null}
      />
      <TopCarousel />
      <HomeShop courses={shopCourses} currency={currency} />
      <ConsultantsSection consultants={consultants} currency={currency} />
      <LiveSessionsSection sessions={sessions} currency={currency} />
      <ContinueLearningRow courses={inProgress} />
      <CourseRow title="Featured courses" seeAllHref="/courses" courses={featured} currency={currency} />
      <CourseRow title="New releases" seeAllHref="/courses?sort=newest" courses={fresh} currency={currency} />
      <CourseRow title="Start learning for free" seeAllHref="/courses?price=free" courses={free} currency={currency} />
      {!hasCourses && (
        <p className="wrap py-16 text-center text-muted">No courses published yet — check back soon.</p>
      )}
      <MidCtaBanner settings={settings} featuredCourses={midCtaCourses} currency={currency} />
      {!userId && <FinalCta settings={settings} />}
    </main>
  );
}
