"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { SiteSettings, Course } from "@/lib/data/homepage";
import { formatPrice, discountPct, type Currency } from "@/lib/currency";

function HeroSearch({ placeholder }: { placeholder: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (q.trim()) router.push(`/courses?search=${encodeURIComponent(q.trim())}`);
      }}
      className="w-full flex items-center h-[52px] sm:h-[56px] bg-white border-2 border-line-strong rounded-full pl-5 pr-1.5 gap-3 mt-6 transition-all duration-200 focus-within:border-primary-bright focus-within:ring-[3px] focus-within:ring-[rgba(164,230,53,0.35)] max-w-[540px]"
    >
      <Search size={18} className="text-muted shrink-0 sm:w-[22px] sm:h-[22px]" />
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        className="flex-1 min-w-0 bg-transparent text-[14px] sm:text-[15px] font-normal text-ink outline-none placeholder:text-muted"
      />
      <button
        type="submit"
        className="h-[40px] sm:h-[44px] px-4 sm:px-6 bg-primary text-white text-sm font-bold rounded-full hover:bg-primary-hover transition-colors duration-200 shrink-0"
      >
        Search
      </button>
    </form>
  );
}

interface HeroProps {
  settings: SiteSettings;
  currency: Currency;
  /** A real published course to showcase; the preview card is hidden when there is none. */
  course?: Course | null;
}

export function Hero({ settings, currency, course = null }: HeroProps) {
  const ratings = course?.reviews.map((r) => r.rating) ?? [];
  const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;
  const price = course ? (currency === "USD" ? course.priceUsdCents : course.priceMadCents) : 0;
  const oldPrice = course ? (currency === "USD" ? course.oldPriceUsdCents : course.oldPriceMadCents) ?? 0 : 0;
  const discount = discountPct(price, oldPrice);

  const popularTerms = settings.heroPopularTerms as unknown as string[];
  const trustBullets = ((settings as { heroTrustBullets?: unknown }).heroTrustBullets as string[]) ?? [];

  return (
    <section className="relative overflow-hidden" style={{ background: "linear-gradient(180deg, #fbfaf5 0%, #efeee4 100%)" }}>
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-[20%] -right-[10%] w-[600px] h-[600px] rounded-full" style={{ background: "radial-gradient(circle, rgba(164,230,53,0.10), transparent 60%)" }} />
      <div className="pointer-events-none absolute -bottom-[30%] -left-[10%] w-[500px] h-[500px] rounded-full" style={{ background: "radial-gradient(circle, rgba(164,230,53,0.08), transparent 60%)" }} />

      <div className="wrap py-10 pb-12 sm:py-[72px] sm:pb-[88px] relative">
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
              <span className="text-primary-mid">{settings.heroTitleLine2}</span>
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
                  href={`/courses?search=${encodeURIComponent(term)}`}
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

          {/* Right column — real featured course */}
          {course && (
            <div className="relative hidden lg:block animate-rise" style={{ animationDelay: "0.3s" }}>
              <Link
                href={`/courses/${course.slug}`}
                className="block relative bg-white rounded-2xl border border-line shadow-card-hover overflow-hidden max-w-[340px] mx-auto hover:-translate-y-1 transition-transform duration-200"
              >
                <div className="relative h-[200px]" style={{ background: "linear-gradient(135deg, #0e1f1a 0%, #0e7a5a 100%)" }}>
                  {course.thumbnailUrl && (
                    <Image src={course.thumbnailUrl} alt={course.title} fill className="object-cover" sizes="340px" />
                  )}
                  {course.isBestseller && (
                    <span className="absolute top-3 left-3 bg-white text-primary text-[10px] font-extrabold tracking-[0.04em] uppercase px-2 py-1 rounded-[3px]">
                      Bestseller
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <div className="text-[10.5px] font-bold text-primary-mid uppercase tracking-[0.1em] mb-1">{course.category.name}</div>
                  <h4 className="text-[15px] font-bold text-ink leading-snug mb-1">{course.title}</h4>
                  <div className="text-[12px] text-muted mb-2">{course.instructor.name}</div>
                  {avgRating !== null && (
                    <div className="flex items-center gap-1.5 text-[12px] mb-2">
                      <span className="font-bold text-ink">{avgRating.toFixed(1)}</span>
                      <span className="text-star tracking-[0.5px]">{"★".repeat(Math.round(avgRating))}</span>
                      <span className="text-muted">({ratings.length.toLocaleString()})</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[18px] font-extrabold text-primary">
                      {formatPrice(course.priceMadCents, course.priceUsdCents, currency)}
                    </span>
                    {oldPrice > price && (
                      <span className="text-[13px] text-muted line-through font-medium">
                        {formatPrice(course.oldPriceMadCents ?? 0, course.oldPriceUsdCents ?? 0, currency)}
                      </span>
                    )}
                    {discount > 0 && (
                      <span className="text-[11px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">-{discount}%</span>
                    )}
                  </div>
                  <span className="block w-full text-center py-2.5 bg-primary text-white text-[11px] font-extrabold tracking-[0.08em] uppercase rounded-full">
                    View course
                  </span>
                </div>
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
