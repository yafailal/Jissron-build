"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { LiveSessionRow } from "./LiveSessionRow";
import type { LiveSession } from "@/lib/data/homepage";
import type { Currency } from "@/lib/currency";

const TABS = [
  { key: "thisWeek", filter: (_: LiveSession) => true },
  { key: "freeAmas", filter: (s: LiveSession) => s.isFree },
  { key: "workshops", filter: (s: LiveSession) => s.kind === "WORKSHOP" },
  { key: "seminars", filter: (s: LiveSession) => s.kind === "SEMINAR" },
  { key: "cohorts", filter: (s: LiveSession) => s.kind === "COHORT" },
];

interface LiveSessionsSectionProps {
  sessions: LiveSession[];
  currency: Currency;
}

export function LiveSessionsSection({ sessions, currency }: LiveSessionsSectionProps) {
  const t = useTranslations("Live.section");
  const [activeTab, setActiveTab] = useState(0);

  const filtered = (() => {
    const result = sessions.filter(TABS[activeTab].filter);
    return result.length ? result : sessions;
  })();

  return (
    <section className="section bg-bg-soft !py-0 !pt-5 !pb-5" id="live">
      <div className="wrap">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-3">
          <div>
            <div className="section-eyebrow">{t("eyebrow")}</div>
            <h2 className="section-title mt-1">{t("title")}</h2>
            <p className="text-[15px] text-body-text mt-1.5 max-w-[540px] leading-relaxed font-medium">
              {t("description")}
            </p>
          </div>
          <Link
            href="/live"
            className="shrink-0 inline-flex items-center px-5 py-2.5 text-[13.5px] font-semibold text-primary border-[1.5px] border-primary rounded-full hover:bg-primary hover:text-white transition-all duration-200"
          >
            {t("viewCalendar")}
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1 mb-3" style={{ scrollbarWidth: "none" }}>
          {TABS.map((tab, i) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(i)}
              className={`shrink-0 px-4 py-2 text-[13px] font-semibold rounded-full whitespace-nowrap transition-colors duration-150 ${
                activeTab === i
                  ? "bg-primary text-white"
                  : "text-body-text hover:bg-bg-hover"
              }`}
            >
              {t(`tabs.${tab.key}`)}
            </button>
          ))}
        </div>

        {/* Session list + image */}
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-5 items-stretch">
          <div className="bg-white border border-line rounded-2xl overflow-hidden lg:overflow-x-auto">
            <div className="flex flex-col gap-5 lg:block lg:min-w-[800px]">
              {filtered.map((session) => (
                <LiveSessionRow key={session.id} session={session} currency={currency} />
              ))}
            </div>
          </div>

          {/* Placeholder artwork until a real image is supplied */}
          <div
            className="relative hidden xl:block overflow-hidden rounded-2xl"
            style={{ background: "linear-gradient(135deg, #064e3b 0%, #10b981 100%)" }}
            aria-hidden="true"
          >
            <span className="pointer-events-none absolute -right-12 -top-14 h-52 w-52 rounded-full bg-primary-bright/25" />
            <span className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-white/10" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-card">
                <Image src="/logo-icon.png" alt="" width={48} height={48} className="h-12 w-12 object-contain" />
              </span>
              <span className="rounded-full bg-white/15 px-4 py-1.5 text-[12px] font-bold uppercase tracking-[0.1em] text-white">
                {t("artwork")}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center">
          <Link
            href="/live"
            className="inline-flex items-center px-8 py-4 text-[15px] font-bold text-white bg-primary rounded-full hover:bg-primary-hover hover:-translate-y-px hover:shadow-btn transition-all duration-200"
          >
            {t("seeAll")}
          </Link>
        </div>
      </div>
    </section>
  );
}
