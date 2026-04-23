"use client";

import { useState } from "react";
import Link from "next/link";
import { ConsultantCard } from "./ConsultantCard";
import type { Consultant } from "@/lib/data/homepage";
import type { Currency } from "@/lib/currency";

const TABS = [
  { label: "Top rated", filter: (_: Consultant) => true },
  { label: "Available today", filter: (c: Consultant) => c.acceptsNew },
  { label: "Product", filter: (c: Consultant) => c.skills.some((s) => s.toLowerCase().includes("product") || s.toLowerCase().includes("roadmap")) },
  { label: "Engineering", filter: (c: Consultant) => c.skills.some((s) => ["mlops", "engineering", "llm"].includes(s.toLowerCase())) },
  { label: "Design", filter: (c: Consultant) => c.skills.some((s) => s.toLowerCase().includes("design") || s.toLowerCase().includes("figma") || s.toLowerCase().includes("portfolio")) },
];

interface ConsultantsSectionProps {
  consultants: Consultant[];
  currency: Currency;
}

export function ConsultantsSection({ consultants, currency }: ConsultantsSectionProps) {
  const [activeTab, setActiveTab] = useState(0);

  const filtered = (() => {
    const result = consultants.filter(TABS[activeTab].filter);
    return result.length ? result : consultants;
  })();

  return (
    <section className="section bg-white" id="consults">
      <div className="wrap">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-7">
          <div>
            <div className="section-eyebrow">1-on-1 consults</div>
            <h2 className="section-title mt-1">Book a 1-on-1 with a top expert</h2>
            <p className="text-[15px] text-body-text mt-3 max-w-[540px] leading-relaxed font-medium">
              Get direct feedback and personalized advice from practitioners at Google, Stripe, OpenAI, Figma, and more. Same-week availability.
            </p>
          </div>
          <Link
            href="/consults"
            className="shrink-0 inline-flex items-center px-5 py-2.5 text-[13.5px] font-semibold text-primary border-[1.5px] border-primary rounded-lg hover:bg-primary hover:text-white transition-all duration-200"
          >
            Browse 184 experts →
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1 mb-7" style={{ scrollbarWidth: "none" }}>
          {TABS.map((tab, i) => (
            <button
              key={tab.label}
              onClick={() => setActiveTab(i)}
              className={`shrink-0 px-4 py-2 text-[13px] font-semibold rounded-full whitespace-nowrap transition-colors duration-150 ${
                activeTab === i
                  ? "bg-primary text-white"
                  : "text-body-text hover:bg-bg-hover"
              }`}
            >
              {tab.label}
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
            href="/consults"
            className="inline-flex items-center px-8 py-4 text-[15px] font-bold text-white bg-primary rounded-lg hover:bg-primary-hover hover:-translate-y-px hover:shadow-btn transition-all duration-200"
          >
            Browse all 184 experts →
          </Link>
        </div>
      </div>
    </section>
  );
}
