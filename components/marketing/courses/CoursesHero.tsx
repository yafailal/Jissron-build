import type { SearchIndexItem } from "@/lib/data/courses";
import type { Currency } from "@/lib/currency";
import { CoursesSearch } from "./CoursesSearch";

function TrustIcon({ children }: { children: React.ReactNode }) {
  return <span className="text-[#7eb6ff]">{children}</span>;
}

const TRUST_ITEMS = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    label: "Lifetime access",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
    label: "Certificate of completion",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12" y2="18" />
      </svg>
    ),
    label: "Mobile + desktop",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
    label: "Bank · Card",
  },
];

interface CoursesHeroProps {
  searchIndex: SearchIndexItem[];
  currency: Currency;
}

export function CoursesHero({ searchIndex, currency }: CoursesHeroProps) {
  return (
    <section
      className="pt-6 pb-14 lg:pt-8 lg:pb-[88px]"
      style={{ background: "linear-gradient(135deg, #002a5a 0%, #003d80 50%, #0071e3 100%)" }}
    >
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid gap-8 lg:gap-12 items-start grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
          {/* ── Left: Editorial ── */}
          <div className="order-2 lg:order-1">
            <p
              className="text-[13px] font-700 uppercase tracking-[0.15em] mb-5"
              style={{ color: "#7eb6ff" }}
            >
              JissrON Learning Platform
            </p>

            <h1
              className="font-400 leading-[1.1] mb-6"
              style={{
                fontFamily: "var(--font-crimson), Georgia, serif",
                fontSize: "clamp(38px, 4.5vw, 52px)",
                color: "#ffffff",
              }}
            >
              Master in-demand skills,{" "}
              <em
                style={{ color: "#cce4ff", fontStyle: "italic" }}
              >
                taught by Moroccan experts.
              </em>
            </h1>

            <p
              className="hidden lg:block font-400 leading-relaxed mb-10 max-w-[480px]"
              style={{ fontSize: "17px", color: "rgba(255,255,255,0.85)" }}
            >
              From data science to digital marketing, our courses are built for
              professionals across Morocco and beyond. Learn at your pace, earn
              certificates, pay your way.
            </p>

            {/* Trust strip */}
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              {TRUST_ITEMS.map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <TrustIcon>{item.icon}</TrustIcon>
                  <span
                    className="text-[13px] font-500"
                    style={{ color: "rgba(255,255,255,0.75)" }}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: Search ── */}
          <div className="order-1 lg:order-2 pt-2">
            <CoursesSearch searchIndex={searchIndex} currency={currency} />
          </div>
        </div>
      </div>
    </section>
  );
}
