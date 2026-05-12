import Link from "next/link";
import Image from "next/image";
import type { SiteSettings, Course } from "@/lib/data/homepage";
import { formatPrice, type Currency } from "@/lib/currency";

interface MidCtaBannerProps {
  settings: SiteSettings;
  featuredCourses?: Course[];
  currency?: Currency;
}

export function MidCtaBanner({ settings, featuredCourses = [], currency = "MAD" }: MidCtaBannerProps) {
  return (
    <section
      className="py-[72px] relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #003d80 0%, #002a5a 100%)",
      }}
    >
      <div className="wrap relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-12 items-center">
          {/* Left — copy */}
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
              <Link
                href={settings.midCtaSecondaryUrl}
                className="px-6 py-3 border-[1.5px] border-white/40 text-white text-[14px] font-semibold rounded-lg hover:border-white hover:bg-white/10 transition-all duration-200"
              >
                {settings.midCtaSecondaryLabel}
              </Link>
            </div>
          </div>

          {/* Right — 2 featured course cards */}
          {featuredCourses.length > 0 && (
            <div className="flex flex-col gap-3 md:justify-self-end w-full max-w-[360px] mx-auto md:mx-0">
              {featuredCourses.map((course) => (
                <MidCtaCourseCard key={course.id} course={course} currency={currency} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function MidCtaCourseCard({ course, currency }: { course: Course; currency: Currency }) {
  const reviewCount = course.reviews?.length ?? 0;
  const avgRating =
    reviewCount > 0
      ? course.reviews.reduce((s, r) => s + r.rating, 0) / reviewCount
      : 0;
  const instructorName = course.instructor?.name ?? "JissrON Instructor";
  const badge = course.isBestseller ? "BESTSELLER" : course.isFeatured ? "FEATURED" : course.badge ?? null;
  const isRenderableImage = course.thumbnailUrl && /^(https?:\/\/|\/|data:|blob:)/.test(course.thumbnailUrl);

  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group bg-white rounded-2xl border border-white/10 shadow-card-hover overflow-hidden block hover:-translate-y-0.5 transition-transform duration-200"
    >
      <div className="flex items-stretch">
        {/* Thumbnail */}
        <div
          className="relative w-[120px] h-[120px] shrink-0"
          style={{ background: "linear-gradient(135deg, #003d80 0%, #0071e3 100%)" }}
        >
          {isRenderableImage && (
            <Image
              src={course.thumbnailUrl!}
              alt={course.title}
              fill
              className="object-cover"
            />
          )}
          {badge && (
            <span className="absolute top-2 left-2 bg-white text-primary text-[9px] font-extrabold tracking-[0.04em] uppercase px-1.5 py-0.5 rounded-[3px]">
              {badge}
            </span>
          )}
        </div>
        {/* Body */}
        <div className="flex-1 p-3 min-w-0">
          <h4 className="text-[13.5px] font-bold text-ink leading-snug mb-1 line-clamp-2 group-hover:text-primary transition-colors">
            {course.title}
          </h4>
          <p className="text-[11px] text-muted mb-1.5 truncate">{instructorName}</p>
          {reviewCount > 0 && (
            <div className="flex items-center gap-1 text-[11px] mb-1.5">
              <span className="font-bold text-ink">{avgRating.toFixed(1)}</span>
              <span className="text-star tracking-[0.5px]">★★★★★</span>
              <span className="text-muted">({reviewCount.toLocaleString()})</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="text-[14px] font-extrabold text-primary">
              {formatPrice(course.priceMadCents, course.priceUsdCents, currency)}
            </span>
            {course.oldPriceMadCents != null && course.oldPriceUsdCents != null && (
              <span className="text-[11px] text-muted line-through font-medium">
                {formatPrice(course.oldPriceMadCents, course.oldPriceUsdCents, currency)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
