import { getTranslations } from "next-intl/server";
import type { SearchIndexItem } from "@/lib/data/courses";
import type { Currency } from "@/lib/currency";
import { CoursesSearch } from "./CoursesSearch";
import { PageBand } from "@/components/marketing/PageBand";

function TrustIcon({ children }: { children: React.ReactNode }) {
  return <span className="text-primary-bright">{children}</span>;
}

const TRUST_ITEMS = [
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    key: "lifetime",
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
    key: "certificate",
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12" y2="18" />
      </svg>
    ),
    key: "devices",
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
    key: "payment",
  },
];

interface CoursesHeroProps {
  searchIndex: SearchIndexItem[];
  currency: Currency;
}

export async function CoursesHero({ searchIndex, currency }: CoursesHeroProps) {
  const t = await getTranslations("Courses");
  return (
    <PageBand
      eyebrow={t("hero.eyebrow")}
      title={
        <>
          {t("hero.title1")} {t("hero.title2")}
        </>
      }
      description={t("hero.body")}
    >
      <div className="max-w-[760px]">
        <CoursesSearch searchIndex={searchIndex} currency={currency} />
      </div>

      {/* Trust strip */}
      <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
        {TRUST_ITEMS.map((item) => (
          <div key={item.key} className="flex items-center gap-2">
            <TrustIcon>{item.icon}</TrustIcon>
            <span className="text-[13px] font-medium text-white/80">{t(`hero.trust.${item.key}`)}</span>
          </div>
        ))}
      </div>
    </PageBand>
  );
}
