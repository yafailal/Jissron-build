"use client";

import { useState } from "react";
import Link from "next/link";
import { LiveSessionRow } from "./LiveSessionRow";
import type { LiveSession } from "@/lib/data/homepage";
import type { Currency } from "@/lib/currency";

const TABS = [
  { label: "This week", filter: (_: LiveSession) => true },
  { label: "Free AMAs", filter: (s: LiveSession) => s.isFree },
  { label: "Workshops", filter: (s: LiveSession) => s.kind === "WORKSHOP" },
  { label: "Seminars", filter: (s: LiveSession) => s.kind === "SEMINAR" },
  { label: "Cohorts", filter: (s: LiveSession) => s.kind === "COHORT" },
];

interface LiveSessionsSectionProps {
  sessions: LiveSession[];
  currency: Currency;
}

export function LiveSessionsSection({ sessions, currency }: LiveSessionsSectionProps) {
  const [activeTab, setActiveTab] = useState(0);

  const filtered = (() => {
    const result = sessions.filter(TABS[activeTab].filter);
    return result.length ? result : sessions;
  })();

  return (
    <section className="section bg-bg-soft" id="live">
      <div className="wrap">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-7">
          <div>
            <div className="section-eyebrow">Live sessions</div>
            <h2 className="section-title mt-1">Join live sessions this week</h2>
            <p className="text-[15px] text-body-text mt-3 max-w-[540px] leading-relaxed font-medium">
              Real-time workshops, AMAs, and office hours with industry experts. Ask questions, meet peers, and accelerate your learning.
            </p>
          </div>
          <Link
            href="/live"
            className="shrink-0 inline-flex items-center px-5 py-2.5 text-[13.5px] font-semibold text-primary border-[1.5px] border-primary rounded-lg hover:bg-primary hover:text-white transition-all duration-200"
          >
            View full calendar →
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1 mb-5" style={{ scrollbarWidth: "none" }}>
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

        {/* Session list */}
        <div className="bg-white border border-line rounded-2xl overflow-hidden lg:overflow-x-auto">
          <div className="flex flex-col gap-5 lg:block lg:min-w-[800px]">
            {filtered.map((session) => (
              <LiveSessionRow key={session.id} session={session} currency={currency} />
            ))}
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/live"
            className="inline-flex items-center px-8 py-4 text-[15px] font-bold text-white bg-primary rounded-lg hover:bg-primary-hover hover:-translate-y-px hover:shadow-btn transition-all duration-200"
          >
            See all 40+ weekly live sessions →
          </Link>
        </div>
      </div>
    </section>
  );
}
