import type { Metadata } from "next";
import {
  getSiteSettings,
  getFeaturedCourses,
  getUpcomingLiveSessions,
  getFeaturedConsultants,
} from "@/lib/data/homepage";
import { getCurrentCurrency } from "@/lib/currency-server";
import { db } from "@/lib/db";

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
    title: settings?.seoTitle ?? "JissrON — Learning Management System",
    description: settings?.seoDescription ?? undefined,
    openGraph: settings?.seoOgImageUrl
      ? { images: [settings.seoOgImageUrl] }
      : undefined,
  };
}

export default async function HomePage() {
  const [settings, courses, sessions, consultants, currency] = await Promise.all([
    getSiteSettings(),
    getFeaturedCourses(),
    getUpcomingLiveSessions(),
    getFeaturedConsultants(),
    getCurrentCurrency(),
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

  return (
    <main id="main-content">
      <Hero settings={settings} currency={currency} />
      <TrustStrip settings={settings} />
      <CoursesSection courses={courses} currency={currency} />
      <MidCtaBanner settings={settings} featuredCourses={midCtaCourses} currency={currency} />
      <LiveSessionsSection sessions={sessions} currency={currency} />
      <ConsultantsSection consultants={consultants} currency={currency} />
      <FinalCta settings={settings} />
    </main>
  );
}
