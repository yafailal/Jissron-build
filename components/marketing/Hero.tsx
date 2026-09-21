import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { GraduationCap, MonitorPlay, BookOpen, MessageCircle } from "lucide-react";
import type { SiteSettings, Course } from "@/lib/data/homepage";
import { formatPrice, type Currency } from "@/lib/currency";
import { getTranslations } from "next-intl/server";

interface HeroProps {
  settings: SiteSettings;
  currency: Currency;
  categories: { name: string; slug: string }[];
  /** A real published course to showcase on the right; omitted when there is none. */
  course?: Course | null;
}

const FLOATERS = [
  { Icon: GraduationCap, pos: "top-2 right-[18%]" },
  { Icon: MonitorPlay, pos: "top-[38%] -left-3" },
  { Icon: BookOpen, pos: "top-[52%] -right-3" },
  { Icon: MessageCircle, pos: "bottom-8 left-[8%]" },
];

/** Full-width brand hero: badge, headline, two CTAs, a visual on the right, and a category strip. */
export async function Hero({ settings, currency, categories, course = null }: HeroProps) {
  const t = await getTranslations("Hero");
  const tx = await getTranslations("HeroExtra");

  return (
    <section
      className="relative overflow-hidden text-white"
      style={{ backgroundImage: "linear-gradient(135deg, #064e3b 0%, #0b6b53 62%, #0e7a5a 100%)" }}
    >
      <div className="wrap relative pt-12 pb-12 lg:pt-20 lg:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-12 items-center">
          {/* Left — copy (all text comes from Site Settings) */}
          <div>
            <span className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-4 py-2 text-[12px] font-bold uppercase tracking-[0.06em]">
              {settings.heroKicker}
            </span>

            <h1 className="mt-6 text-[38px] sm:text-[50px] lg:text-[62px] font-extrabold leading-[1.05] tracking-[-0.02em]">
              {settings.heroTitleLine1}
              <br />
              <span className="text-[0.85em] text-primary-bright">{settings.heroTitleLine2}</span>
              {settings.heroTitleLine3?.trim() && (
                <>
                  <br />
                  {settings.heroTitleLine3}
                </>
              )}
            </h1>

            <p className="mt-6 max-w-[540px] whitespace-pre-line text-[16px] sm:text-[17px] leading-relaxed text-white/85 font-medium">
              {settings.heroSubtitle}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/courses"
                className="inline-flex items-center justify-center h-12 px-7 rounded-full border-2 border-white/70 text-white text-[15px] font-bold hover:bg-white hover:text-primary transition-colors"
              >
                {t("ctaCourses")}
              </Link>
              <Link
                href="/live"
                className="inline-flex items-center justify-center h-12 px-7 rounded-full border-2 border-white/70 text-white text-[15px] font-bold hover:bg-white hover:text-primary transition-colors"
              >
                {t("ctaLive")}
              </Link>
              <Link
                href="/consultants"
                className="inline-flex items-center justify-center h-12 px-7 rounded-full border-2 border-white/70 text-white text-[15px] font-bold hover:bg-white hover:text-primary transition-colors"
              >
                {t("ctaExpert")}
              </Link>
            </div>
          </div>

          {/* Right — our own visual: brand mark panel, floating icons, a real course */}
          <div className="relative hidden lg:block h-[400px]" aria-hidden={!course}>
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
                className="absolute -bottom-2 right-0 w-[260px] rounded-2xl bg-white text-ink p-4 shadow-[0_24px_50px_-18px_rgba(0,0,0,0.5)] hover:-translate-y-1 transition-transform duration-200"
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
                  <span className="text-[12px] font-bold text-primary-mid">{tx("viewCourse")}</span>
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Category strip — real categories, moving, on white */}
      {categories.length > 0 && (
        <div className="relative bg-white border-b border-line py-5">
          <div
            className="group overflow-hidden"
            style={{
              maskImage: "linear-gradient(to right, transparent, #000 8%, #000 92%, transparent)",
              WebkitMaskImage: "linear-gradient(to right, transparent, #000 8%, #000 92%, transparent)",
            }}
          >
            <div className="flex w-max items-center animate-marquee group-hover:[animation-play-state:paused] motion-reduce:animate-none">
              {[...categories, ...categories].map((c, i) => (
                <div key={`${c.slug}-${i}`} className="flex shrink-0 items-center">
                  <Link
                    href={`/courses?category=${c.slug}`}
                    tabIndex={i >= categories.length ? -1 : undefined}
                    aria-hidden={i >= categories.length ? true : undefined}
                    className="px-7 text-[13px] font-bold uppercase tracking-[0.1em] text-black hover:text-primary whitespace-nowrap transition-colors"
                  >
                    {c.name}
                  </Link>
                  <span className="h-4 w-px bg-line-strong" aria-hidden="true" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
