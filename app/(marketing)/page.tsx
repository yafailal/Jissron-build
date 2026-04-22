import {
  getSiteSettings,
  getFeaturedCourses,
  getUpcomingLiveSessions,
  getFeaturedConsultants,
} from "@/lib/data/homepage";

import { UrgencyBanner } from "@/components/marketing/UrgencyBanner";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { Hero } from "@/components/marketing/Hero";
import { TrustStrip } from "@/components/marketing/TrustStrip";
import { CoursesSection } from "@/components/marketing/CoursesSection";
import { MidCtaBanner } from "@/components/marketing/MidCtaBanner";
import { LiveSessionsSection } from "@/components/marketing/LiveSessionsSection";
import { ConsultantsSection } from "@/components/marketing/ConsultantsSection";
import { FinalCta } from "@/components/marketing/FinalCta";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export default async function HomePage() {
  const [settings, courses, sessions, consultants] = await Promise.all([
    getSiteSettings(),
    getFeaturedCourses(),
    getUpcomingLiveSessions(),
    getFeaturedConsultants(),
  ]);

  if (!settings) return null;

  return (
    <>
      <UrgencyBanner settings={settings} />
      <MarketingNav searchPlaceholder={settings.heroSearchPlaceholder} />
      <main id="main-content">
        <Hero settings={settings} />
        <TrustStrip settings={settings} />
        <CoursesSection courses={courses} />
        <MidCtaBanner settings={settings} />
        <LiveSessionsSection sessions={sessions} />
        <ConsultantsSection consultants={consultants} />
        <FinalCta settings={settings} />
      </main>
      <MarketingFooter settings={settings} />
    </>
  );
}
