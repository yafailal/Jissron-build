import Link from "next/link";
import type { SiteSettings } from "@/lib/data/homepage";

export interface StripCategory {
  name: string;
  slug: string;
}

interface TrustStripProps {
  settings: SiteSettings;
  categories: StripCategory[];
}

export function TrustStrip({ settings, categories }: TrustStripProps) {
  if (categories.length === 0) return null;

  return (
    <section className="border-b border-line py-5">
      <div className="wrap">
        <p className="text-[11px] font-semibold text-muted text-center uppercase tracking-[0.08em] mb-4">
          {settings.trustStripLabel}
        </p>
      </div>
      <div
        className="group overflow-hidden"
        style={{
          maskImage: "linear-gradient(to right, transparent, #000 10%, #000 90%, transparent)",
          WebkitMaskImage: "linear-gradient(to right, transparent, #000 10%, #000 90%, transparent)",
        }}
      >
        <div className="flex w-max items-center animate-marquee group-hover:[animation-play-state:paused] motion-reduce:animate-none">
          {[...categories, ...categories].map((c, i) => (
            <Link
              key={`${c.slug}-${i}`}
              href={`/courses?category=${c.slug}`}
              tabIndex={i >= categories.length ? -1 : undefined}
              aria-hidden={i >= categories.length ? true : undefined}
              className="mr-12 shrink-0 text-[13px] font-bold text-muted/60 tracking-tight whitespace-nowrap hover:text-primary transition-colors"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
