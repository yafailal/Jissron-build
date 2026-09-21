"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ConsultantCard } from "./ConsultantCard";
import type { Consultant } from "@/lib/data/homepage";
import type { Currency } from "@/lib/currency";

const TABS = [
  { key: "topRated", filter: (_: Consultant) => true },
  { key: "availableToday", filter: (c: Consultant) => c.acceptsNew },
  { key: "product", filter: (c: Consultant) => c.skills.some((s) => s.toLowerCase().includes("product") || s.toLowerCase().includes("roadmap")) },
  { key: "engineering", filter: (c: Consultant) => c.skills.some((s) => ["mlops", "engineering", "llm"].includes(s.toLowerCase())) },
  { key: "design", filter: (c: Consultant) => c.skills.some((s) => s.toLowerCase().includes("design") || s.toLowerCase().includes("figma") || s.toLowerCase().includes("portfolio")) },
];

interface ConsultantsSectionProps {
  consultants: Consultant[];
  currency: Currency;
}

export function ConsultantsSection({ consultants, currency }: ConsultantsSectionProps) {
  const t = useTranslations("Consultants.section");
  const [activeTab, setActiveTab] = useState(0);

  const filtered = (() => {
    const result = consultants.filter(TABS[activeTab].filter);
    return result.length ? result : consultants;
  })();

  return (
    <section className="section bg-white pt-0 pb-6 sm:pb-8" id="consults">
      {/* Header — full-width green band */}
      <div style={{ background: "linear-gradient(135deg, #064e3b 0%, #033a2c 100%)" }}>
        <div className="wrap flex flex-col sm:flex-row sm:items-end justify-between gap-4 py-5 sm:py-6">
          <div>
            <div className="section-eyebrow !text-primary-bright">{t("eyebrow")}</div>
            <h2 className="section-title mt-1 !text-white">{t("title")}</h2>
            <p className="text-[15px] text-white/85 mt-1.5 max-w-[540px] leading-relaxed font-medium">
              {t("description")}
            </p>
          </div>
          <Link
            href="/consultants"
            className="shrink-0 inline-flex items-center px-5 py-2.5 text-[13.5px] font-semibold text-white border-[1.5px] border-white/70 rounded-full hover:bg-white hover:text-primary transition-all duration-200"
          >
            {t("browse")}
          </Link>
        </div>
      </div>

      <div className="wrap pt-7">
        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1 mb-7" style={{ scrollbarWidth: "none" }}>
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

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((consultant) => (
            <ConsultantCard key={consultant.id} consultant={consultant} currency={currency} />
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/consultants"
            className="inline-flex items-center px-8 py-4 text-[15px] font-bold text-white bg-primary rounded-full hover:bg-primary-hover hover:-translate-y-px hover:shadow-btn transition-all duration-200"
          >
            {t("browse")}
          </Link>
        </div>
      </div>
    </section>
  );
}
