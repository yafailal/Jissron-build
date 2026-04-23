"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import Link from "next/link";
import type { SiteSettings } from "@/lib/data/homepage";

function HeroSearch({ placeholder }: { placeholder: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
      }}
      className="flex items-center h-[56px] bg-white border-2 border-line-strong rounded-full pl-5 pr-1.5 gap-3 mt-6 transition-all duration-200 focus-within:border-primary-bright focus-within:ring-[3px] focus-within:ring-[rgba(0,88,184,0.18)] max-w-[540px]"
    >
      <Search size={22} className="text-muted shrink-0" />
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-[15px] font-normal text-ink outline-none placeholder:text-muted"
      />
      <button
        type="submit"
        className="h-[44px] px-6 bg-primary text-white text-sm font-bold rounded-full hover:bg-primary-hover transition-colors duration-200 shrink-0"
      >
        Search
      </button>
    </form>
  );
}

interface HeroProps {
  settings: SiteSettings;
}

export function Hero({ settings }: HeroProps) {
  const popularTerms = settings.heroPopularTerms as unknown as string[];
  const trustBullets = ((settings as { heroTrustBullets?: unknown }).heroTrustBullets as string[]) ?? [];

  return (
    <section className="relative overflow-hidden" style={{ background: "linear-gradient(180deg, #f3f7fc 0%, #dae4f0 100%)" }}>
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-[20%] -right-[10%] w-[600px] h-[600px] rounded-full" style={{ background: "radial-gradient(circle, rgba(0,113,227,0.07), transparent 60%)" }} />
      <div className="pointer-events-none absolute -bottom-[30%] -left-[10%] w-[500px] h-[500px] rounded-full" style={{ background: "radial-gradient(circle, rgba(0,113,227,0.06), transparent 60%)" }} />

      <div className="wrap py-[72px] pb-[88px] relative">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-[60px] items-center">
          {/* Left column */}
          <div>
            {/* Kicker */}
            <div className="inline-flex items-center gap-2 text-[13px] font-semibold text-primary bg-white border border-line rounded-full px-4 py-2 mb-5 shadow-sm animate-rise" style={{ animationDelay: "0.05s" }}>
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse-dot" />
              {settings.heroKicker}
            </div>

            {/* H1 */}
            <h1 className="font-extrabold text-ink leading-[1.08] tracking-[-0.02em] animate-rise" style={{ fontSize: "clamp(42px, 5.2vw, 64px)", animationDelay: "0.15s" }}>
              {settings.heroTitleLine1}
              <br />
              <span className="text-primary-bright">{settings.heroTitleLine2}</span>
              <br />
              {settings.heroTitleLine3}
            </h1>

            {/* Subtitle */}
            <p className="mt-5 text-[16.5px] text-body-text font-medium leading-relaxed max-w-[500px] animate-rise" style={{ animationDelay: "0.25s" }}>
              {settings.heroSubtitle}
            </p>

            {/* Search */}
            <div className="animate-rise" style={{ animationDelay: "0.35s" }}>
              <HeroSearch placeholder={settings.heroSearchPlaceholder} />
            </div>

            {/* Popular terms */}
            <div className="flex flex-wrap items-center gap-2 mt-3.5 text-[13px] text-muted font-medium animate-rise" style={{ animationDelay: "0.45s" }}>
              <span>Popular:</span>
              {popularTerms.map((term) => (
                <Link
                  key={term}
                  href={`/search?q=${encodeURIComponent(term)}`}
                  className="text-primary hover:underline underline-offset-2"
                >
                  {term}
                </Link>
              ))}
            </div>

            {/* Trust bullets */}
            <div className="flex flex-wrap gap-5 mt-6 animate-rise" style={{ animationDelay: "0.55s" }}>
              {trustBullets.map((item) => (
                <div key={item} className="flex items-center gap-2 text-[13px] font-medium text-body-text">
                  <span className="w-5 h-5 rounded-full bg-primary grid place-items-center shrink-0">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><path d="M20 6 9 17l-5-5" /></svg>
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Right column — hero card */}
          <div className="relative hidden lg:block animate-rise" style={{ animationDelay: "0.3s" }}>
            <div className="relative bg-white rounded-2xl border border-line shadow-card-hover overflow-hidden max-w-[340px] mx-auto">
              {/* Thumbnail gradient */}
              <div className="relative h-[200px]" style={{ background: "linear-gradient(135deg, #003d80 0%, #0071e3 100%)" }}>
                <span className="absolute top-3 left-3 bg-white text-primary text-[10px] font-extrabold tracking-[0.04em] uppercase px-2 py-1 rounded-[3px]">
                  BESTSELLER
                </span>
                <div className="absolute inset-0 grid place-items-center">
                  <div className="w-14 h-14 rounded-full bg-white/20 grid place-items-center backdrop-blur-sm">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="text-[10.5px] font-bold text-primary-bright uppercase tracking-[0.1em] mb-1">Product · New Edition</div>
                <h4 className="text-[15px] font-bold text-ink leading-snug mb-1">Digital Transformation | Introduction to AI</h4>
                <div className="text-[12px] text-muted mb-2">Maya Okonkwo · Senior PM at Stripe</div>
                <div className="flex items-center gap-1.5 text-[12px] mb-2">
                  <span className="font-bold text-ink">4.9</span>
                  <span className="text-star tracking-[0.5px]">★★★★★</span>
                  <span className="text-muted">(5,412)</span>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[18px] font-extrabold text-primary">$9.99</span>
                  <span className="text-[13px] text-muted line-through font-medium">$89.99</span>
                  <span className="text-[11px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">-89%</span>
                </div>
                <Link
                  href="/courses"
                  className="block w-full text-center py-2.5 bg-primary text-white text-[11px] font-extrabold tracking-[0.08em] uppercase rounded-lg hover:bg-primary-hover transition-colors"
                >
                  Continue Learning
                </Link>
              </div>
            </div>

            {/* Float stat — top left */}
            <div className="absolute -left-8 top-6 bg-white rounded-xl border border-line shadow-card px-4 py-3 flex items-center gap-3 hidden xl:flex">
              <div className="flex -space-x-2">
                {["MO", "PR", "DV"].map((i) => (
                  <div key={i} className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-primary-bright border-2 border-white grid place-items-center text-white text-[9px] font-bold">{i}</div>
                ))}
              </div>
              <div className="leading-tight">
                <div className="text-[13px] font-bold text-ink">2.4M learners</div>
                <div className="text-[11px] text-muted">across 140+ countries</div>
              </div>
            </div>

            {/* Float stat — bottom right */}
            <div className="absolute -right-6 bottom-6 bg-white rounded-xl border border-line shadow-card px-4 py-3 flex items-center gap-3 hidden xl:flex">
              <div className="w-9 h-9 rounded-full bg-primary-soft grid place-items-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#003d80" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6 9 17l-5-5" /></svg>
              </div>
              <div className="leading-tight">
                <div className="text-[13px] font-bold text-ink">Verified quality</div>
                <div className="text-[11px] text-muted">4.9 avg rating</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
