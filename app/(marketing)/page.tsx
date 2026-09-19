import type { Metadata } from "next";
import {
  getSiteSettings,
  getUpcomingLiveSessions,
  getFeaturedConsultants,
  getOfferingCounts,
} from "@/lib/data/homepage";
import { getCategoryRows, getEditorsPicks } from "@/lib/data/courses";
import { getDashboardData } from "@/lib/data/dashboard";
import { getCurrentCurrency } from "@/lib/currency-server";
import { auth } from "@/lib/auth";

import { OfferingCards } from "@/components/marketing/OfferingCards";
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

  const [settings, sessions, consultants, currency, counts, featured, fresh, free, categoryRows, dashboard] =
    await Promise.all([
      getSiteSettings(),
      getUpcomingLiveSessions(),
      getFeaturedConsultants(),
      getCurrentCurrency(),
      getOfferingCounts(),
      getEditorsPicks("featured", 10),
      getEditorsPicks("new", 10),
      getEditorsPicks("free", 10),
      getCategoryRows(6, 10),
      userId ? getDashboardData(userId) : Promise.resolve(null),
    ]);

  if (!settings) return null;

  const inProgress = (dashboard?.enrolledCourses ?? []).filter((c) => c.status !== "completed");
  const hasCourses = featured.length + fresh.length + free.length + categoryRows.length > 0;

  return (
    <main id="main-content">
      <OfferingCards counts={counts} />
      <ContinueLearningRow courses={inProgress} />
      <CourseRow title="Featured courses" seeAllHref="/courses" courses={featured} currency={currency} />
      <CourseRow title="New releases" seeAllHref="/courses?sort=newest" courses={fresh} currency={currency} />
      <CourseRow title="Start learning for free" seeAllHref="/courses?price=free" courses={free} currency={currency} />
      {categoryRows.map((cat) => (
        <CourseRow
          key={cat.slug}
          title={cat.name}
          seeAllHref={`/courses?category=${cat.slug}`}
          courses={cat.courses}
          currency={currency}
        />
      ))}
      {!hasCourses && (
        <p className="wrap py-16 text-center text-muted">No courses published yet — check back soon.</p>
      )}
      <MidCtaBanner settings={settings} />
      <LiveSessionsSection sessions={sessions} currency={currency} />
      <ConsultantsSection consultants={consultants} currency={currency} />
      {!userId && <FinalCta settings={settings} />}
    </main>
  );
}
