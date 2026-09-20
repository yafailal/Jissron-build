import Image from "next/image";
import Link from "next/link";
import { GraduationCap, MonitorPlay, BookOpen, MessageCircle } from "lucide-react";
import type { SiteSettings, Course } from "@/lib/data/homepage";
import { formatPrice, type Currency } from "@/lib/currency";

interface HeroProps {
  settings: SiteSettings;
  currency: Currency;
  categories: { name: string; slug: string }[];
  /** A real published course to showcase on the right; omitted when there is none. */
  course?: Course | null;
}

// Decorative pills: the original small tile (two 22×80 slanted pills per 120×120 cell) repeated
// across the hero, each cell floating on its own timing. Deterministic values (no Math.random)
// so server and client render identically.
const TILE = 120;
const TILE_COUNT = 17 * 8; // enough to cover a wide hero; extra cells are clipped
const TILES = Array.from({ length: TILE_COUNT }, (_, i) => ({
  dur: 5 + ((i * 37) % 50) / 10, // 5–10s
  delay: -(((i * 53) % 80) / 10), // negative: already mid-float on load, not in sync
}));

const FLOATERS = [
  { Icon: GraduationCap, pos: "top-2 right-[18%]" },
  { Icon: MonitorPlay, pos: "top-[38%] -left-3" },
  { Icon: BookOpen, pos: "top-[52%] -right-3" },
  { Icon: MessageCircle, pos: "bottom-8 left-[8%]" },
];

/** Full-width brand hero: badge, headline, two CTAs, a visual on the right, and a category strip. */
export function Hero({ settings, currency, categories, course = null }: HeroProps) {
  return (
    <section
      className="relative overflow-hidden text-white"
      style={{ backgroundImage: "linear-gradient(135deg, #064e3b 0%, #0b6b53 62%, #0e7a5a 100%)" }}
    >
      {/* Floating background pills — small, tiled, 40% opacity */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div
          className="grid"
          style={{ gridTemplateColumns: `repeat(auto-fill, ${TILE}px)`, gridAutoRows: `${TILE}px` }}
        >
          {TILES.map((t, i) => (
            <span
              key={i}
              className="relative block animate-float-sm motion-reduce:animate-none"
              style={{ width: TILE, height: TILE, animationDuration: `${t.dur}s`, animationDelay: `${t.delay}s` }}
            >
              <span
                className="absolute rounded-full bg-primary-bright opacity-40"
                style={{ left: 10, top: 20, width: 22, height: 80, transform: "rotate(28deg)" }}
              />
              <span
                className="absolute rounded-full bg-primary-bright opacity-40"
                style={{ left: 70, top: 0, width: 22, height: 80, transform: "rotate(28deg)" }}
              />
            </span>
          ))}
        </div>
      </div>

      <div className="wrap relative pt-12 pb-12 lg:pt-20 lg:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-12 items-center">
          {/* Left — copy (all text comes from Site Settings) */}
          <div>
            <span className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-4 py-2 text-[12px] font-bold uppercase tracking-[0.06em]">
              {settings.heroKicker}
            </span>

            <h1 className="mt-6 text-[38px] sm:text-[50px] lg:text-[62px] font-extrabold leading-[1.05] tracking-[-0.02em]">
              {settings.heroTitleLine1}
              <br />
              <span className="text-primary-bright">{settings.heroTitleLine2}</span>
              <br />
              {settings.heroTitleLine3}
            </h1>

            <p className="mt-6 max-w-[540px] text-[16px] sm:text-[17px] leading-relaxed text-white/85 font-medium">
              {settings.heroSubtitle}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/courses"
                className="inline-flex items-center justify-center h-12 px-7 rounded-full bg-white text-primary text-[15px] font-bold hover:bg-white/90 transition-colors"
              >
                Browse courses
              </Link>
              <Link
                href="/live"
                className="inline-flex items-center justify-center h-12 px-7 rounded-full border-2 border-white/70 text-white text-[15px] font-bold hover:bg-white hover:text-primary transition-colors"
              >
                Explore live sessions
              </Link>
            </div>
          </div>

          {/* Right — our own visual: brand mark panel, floating icons, a real course */}
          <div className="relative hidden lg:block h-[460px]" aria-hidden={!course}>
            <div className="absolute inset-y-4 inset-x-10 rounded-[2rem] bg-white/95 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.45)] grid place-items-center overflow-hidden">
              <Image src="/logo-icon.png" alt="" width={340} height={280} className="w-[62%] h-auto opacity-95" priority />
            </div>

            {FLOATERS.map(({ Icon, pos }, i) => (
              <span
                key={i}
                className={`absolute ${pos} w-16 h-16 rounded-full border border-white/30 bg-white/10 backdrop-blur-sm grid place-items-center text-white`}
              >
                <Icon size={26} strokeWidth={1.8} />
              </span>
            ))}

            {course && (
              <Link
                href={`/courses/${course.slug}`}
                className="absolute -bottom-2 right-0 w-[290px] rounded-2xl bg-white text-ink p-4 shadow-[0_24px_50px_-18px_rgba(0,0,0,0.5)] hover:-translate-y-1 transition-transform duration-200"
              >
                <div className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-primary-mid">
                  {course.category.name}
                </div>
                <div className="mt-1 text-[15px] font-bold leading-snug line-clamp-2">{course.title}</div>
                <div className="mt-1 text-[12px] text-muted">{course.instructor.name}</div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[17px] font-extrabold text-primary">
                    {formatPrice(course.priceMadCents, course.priceUsdCents, currency)}
                  </span>
                  <span className="text-[12px] font-bold text-primary-mid">View course →</span>
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Category strip — real categories, moving */}
      {categories.length > 0 && (
        <div className="relative border-t border-white/15 py-5">
          <div
            className="group overflow-hidden"
            style={{
              maskImage: "linear-gradient(to right, transparent, #000 8%, #000 92%, transparent)",
              WebkitMaskImage: "linear-gradient(to right, transparent, #000 8%, #000 92%, transparent)",
            }}
          >
            <div className="flex w-max items-center animate-marquee group-hover:[animation-play-state:paused] motion-reduce:animate-none">
              {[...categories, ...categories].map((c, i) => (
                <Link
                  key={`${c.slug}-${i}`}
                  href={`/courses?category=${c.slug}`}
                  tabIndex={i >= categories.length ? -1 : undefined}
                  aria-hidden={i >= categories.length ? true : undefined}
                  className="mr-14 shrink-0 text-[13px] font-bold uppercase tracking-[0.1em] text-white/60 hover:text-white whitespace-nowrap transition-colors"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
