import type { Metadata } from "next";
import {
  getSiteSettings,
  getFeaturedCourses,
  getUpcomingLiveSessions,
  getFeaturedConsultants,
} from "@/lib/data/homepage";
import { getCurrentCurrency } from "@/lib/currency-server";
import { getAllCategoriesWithCounts } from "@/lib/data/courses";

import { Hero } from "@/components/marketing/Hero";
import { TrustStrip } from "@/components/marketing/TrustStrip";
import { CoursesSection } from "@/components/marketing/CoursesSection";
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
  const [settings, courses, sessions, consultants, currency, categories] = await Promise.all([
    getSiteSettings(),
    getFeaturedCourses(),
    getUpcomingLiveSessions(),
    getFeaturedConsultants(),
    getCurrentCurrency(),
    getAllCategoriesWithCounts(),
  ]);

  if (!settings) return null;

  return (
    <main id="main-content">
      <Hero settings={settings} currency={currency} course={courses[0] ?? null} />
      <TrustStrip settings={settings} categories={categories.map((c) => ({ name: c.name, slug: c.slug }))} />
      <CoursesSection courses={courses} currency={currency} />
      <MidCtaBanner settings={settings} />
      <LiveSessionsSection sessions={sessions} currency={currency} />
      <ConsultantsSection consultants={consultants} currency={currency} />
      <FinalCta settings={settings} />
    </main>
  );
}
