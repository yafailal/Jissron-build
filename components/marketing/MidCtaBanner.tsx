import Link from "next/link";
import type { SiteSettings, Course } from "@/lib/data/homepage";
import type { Currency } from "@/lib/currency";

interface MidCtaBannerProps {
  settings: SiteSettings;
  featuredCourses?: Course[];
  currency?: Currency;
}

export function MidCtaBanner({ settings, featuredCourses = [], currency = "MAD" }: MidCtaBannerProps) {
  return (
    <section
      className="py-12 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #064e3b 0%, #033a2c 100%)",
      }}
    >
      <div className="wrap relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:grid-cols-[200px_minmax(0,1.5fr)_minmax(0,1fr)] gap-8 lg:gap-10 items-center">
          {/* Far left — teacher photo (placeholder until an image is supplied) */}
          <div className="hidden lg:block">
            <div
              className="relative h-[240px] w-[200px] overflow-hidden rounded-2xl border border-white/20 bg-white/10"
              role="img"
              aria-label="Teacher photo placeholder"
            >
              <svg viewBox="0 0 200 240" className="absolute inset-0 h-full w-full text-white/70" fill="currentColor" aria-hidden="true">
                <circle cx="100" cy="92" r="40" />
                <path d="M20 240c0-56 36-92 80-92s80 36 80 92z" />
              </svg>
              <span className="absolute inset-x-0 bottom-3 text-center text-[11px] font-bold uppercase tracking-[0.1em] text-white">
                Teacher photo
              </span>
            </div>
          </div>

          {/* Copy */}
          <div>
            <h3
              className="font-extrabold text-white leading-[1.12] tracking-[-0.02em] mb-3.5"
              style={{ fontSize: "clamp(28px, 3.4vw, 40px)" }}
            >
              {settings.midCtaTitle}
            </h3>
            <p className="text-[15.5px] text-white/85 font-medium leading-relaxed max-w-[480px] mb-7">
              {settings.midCtaDescription}
            </p>
            <div className="flex flex-wrap gap-3 items-center">
              <Link
                href={settings.midCtaPrimaryUrl}
                className="px-5 py-2.5 bg-white text-primary text-[12.5px] font-extrabold uppercase tracking-[0.04em] rounded-lg hover:bg-primary-soft hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-8px_rgba(0,0,0,0.3)] transition-all duration-200"
              >
                {settings.midCtaPrimaryLabel}
              </Link>
              {settings.midCtaSecondaryLabel?.trim() && (
              <Link
                href={settings.midCtaSecondaryUrl}
                className="px-6 py-3 border-[1.5px] border-white/40 text-white text-[14px] font-semibold rounded-lg hover:border-white hover:bg-white/10 transition-all duration-200"
              >
                {settings.midCtaSecondaryLabel}
              </Link>
              )}
            </div>
          </div>

          {/* Right — video placeholder (video to be uploaded later) */}
          <div className="w-full max-w-[520px] mx-auto md:mx-0 md:justify-self-end">
            <div
              className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/20 bg-black/25 shadow-card-hover"
              role="img"
              aria-label="Video placeholder"
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-primary shadow-card">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
                <span className="text-[12px] font-bold uppercase tracking-[0.1em] text-white/80">Video coming soon</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
