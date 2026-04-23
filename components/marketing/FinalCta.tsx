"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SiteSettings } from "@/lib/data/homepage";

interface FinalCtaProps {
  settings: SiteSettings;
}

export function FinalCta({ settings }: FinalCtaProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");

  const ctaUrl = (settings as { finalCtaCtaUrl?: string }).finalCtaCtaUrl ?? "/auth/signin";
  const ctaLabel = (settings as { finalCtaCtaLabel?: string }).finalCtaCtaLabel ?? "Get started";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) router.push(`${ctaUrl}?email=${encodeURIComponent(email.trim())}`);
    else router.push(ctaUrl);
  };

  return (
    <section className="py-20 bg-bg-soft border-t border-line text-center">
      <div className="wrap">
        <div className="max-w-[700px] mx-auto">
          <h2
            className="font-extrabold text-primary tracking-[-0.02em] leading-[1.1] mb-4"
            style={{ fontSize: "clamp(30px, 3.8vw, 46px)" }}
          >
            {settings.finalCtaTitle}
          </h2>
          <p className="text-[16px] text-body-text font-medium leading-relaxed mb-8">
            {settings.finalCtaDescription} Free forever plan. No credit card.
          </p>

          <form
            onSubmit={handleSubmit}
            className="flex gap-2 max-w-[480px] mx-auto mb-4"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="flex-1 h-[52px] px-5 border-2 border-line-strong rounded-full text-[14.5px] font-medium text-ink outline-none bg-white placeholder:text-muted transition-all duration-200 focus:border-primary-bright focus:ring-[3px] focus:ring-[rgba(0,88,184,0.18)]"
            />
            <button
              type="submit"
              className="h-[52px] px-7 bg-primary-bright text-primary font-extrabold text-[13.5px] uppercase tracking-[0.06em] rounded-full hover:bg-primary-hover hover:text-white hover:-translate-y-px transition-all duration-200 shrink-0"
            >
              {ctaLabel}
            </button>
          </form>

          <div className="flex justify-center flex-wrap gap-5 text-[12.5px] text-muted font-medium">
            {[
              "Free forever",
              "No credit card",
              "30-day guarantee on all courses",
            ].map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0058b8" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
