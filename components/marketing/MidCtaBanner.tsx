import Link from "next/link";
import type { SiteSettings } from "@/lib/data/homepage";

interface MidCtaBannerProps {
  settings: SiteSettings;
}

export function MidCtaBanner({ settings }: MidCtaBannerProps) {
  const stats = settings.midCtaStats as unknown as { number: string; label: string }[];

  return (
    <section
      className="py-[72px] relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #003d80 0%, #002a5a 100%)",
      }}
    >
      <div className="wrap relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-12 items-center">
          {/* Left */}
          <div>
            <h3
              className="font-extrabold text-white leading-[1.12] tracking-[-0.02em] mb-3.5"
              style={{ fontSize: "clamp(28px, 3.4vw, 40px)" }}
            >
              {settings.midCtaTitle.replace("JissrON Plus", "")}{" "}
              <em className="not-italic border-b-2 border-white/40 pb-1">
                JissrON Plus
              </em>
            </h3>
            <p className="text-[15.5px] text-white/85 font-medium leading-relaxed max-w-[480px] mb-7">
              {settings.midCtaDescription}
            </p>
            <div className="flex flex-wrap gap-3 items-center">
              <Link
                href={settings.midCtaPrimaryUrl}
                className="px-7 py-3.5 bg-white text-primary text-[14px] font-extrabold uppercase tracking-[0.04em] rounded-lg hover:bg-primary-soft hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-8px_rgba(0,0,0,0.3)] transition-all duration-200"
              >
                {settings.midCtaPrimaryLabel}
              </Link>
              <Link
                href={settings.midCtaSecondaryUrl}
                className="px-6 py-3 border-[1.5px] border-white/40 text-white text-[14px] font-semibold rounded-lg hover:border-white hover:bg-white/10 transition-all duration-200"
              >
                {settings.midCtaSecondaryLabel}
              </Link>
            </div>
          </div>

          {/* Right — stats grid */}
          {stats.length > 0 && (
            <div className="grid grid-cols-2 gap-4 md:justify-self-end">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white/[0.08] border border-white/15 rounded-xl px-6 py-5"
                >
                  <strong className="block text-[30px] font-extrabold text-white tracking-[-0.02em] leading-none mb-1.5">
                    {stat.number}
                  </strong>
                  <span className="text-[12.5px] text-white/85 font-medium">{stat.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
