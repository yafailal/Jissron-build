import Link from "next/link";
import type { Course } from "@/lib/data/homepage";
import { formatPrice, discountPct, type Currency } from "@/lib/currency";

const THUMB_GRADIENTS = [
  "linear-gradient(135deg,#003d80 0%,#0071e3 100%)",
  "linear-gradient(135deg,#0a2f5c 0%,#1a6ec9 100%)",
  "linear-gradient(135deg,#002a5a 0%,#0058b8 100%)",
  "linear-gradient(135deg,#003d80 0%,#66b5ff 100%)",
  "linear-gradient(135deg,#001f40 0%,#0071e3 100%)",
  "linear-gradient(135deg,#0058b8 0%,#66b5ff 100%)",
  "linear-gradient(135deg,#003d80 0%,#99c7ff 100%)",
  "linear-gradient(135deg,#002a5a 0%,#0071e3 100%)",
];

function StarRating({ rating }: { rating: number }) {
  return <span className="text-star tracking-[0.5px]">{"★".repeat(Math.round(rating))}</span>;
}

interface CourseCardProps {
  course: Course;
  index: number;
  currency: Currency;
}

export function CourseCard({ course, index, currency }: CourseCardProps) {
  const thumbGradient = THUMB_GRADIENTS[index % THUMB_GRADIENTS.length];
  const avgRating = course.reviews.length
    ? course.reviews.reduce((s, r) => s + r.rating, 0) / course.reviews.length
    : 4.8;
  const reviewCount = course.reviews.length || 0;

  const durationHours = Math.round(course.durationMinutes / 60);
  const moduleCount = course.modules.length || Math.round(durationHours * 0.4);

  return (
    <article className="group bg-white border border-line rounded-xl overflow-hidden flex flex-col w-[272px] shrink-0 transition-all duration-200 hover:-translate-y-[3px] hover:shadow-card hover:border-primary cursor-pointer">
      {/* Thumbnail */}
      <div className="relative h-[160px] overflow-hidden" style={{ background: thumbGradient }}>
        {/* Arched bottom-right corner overlay */}
        <div className="absolute inset-0" style={{ borderRadius: "0 0 60px 0 / 0 0 40px 0", background: thumbGradient }} />

        {course.badge && (
          <span className={`absolute top-3 left-3 text-[10px] font-extrabold tracking-[0.04em] uppercase px-2 py-1 rounded-[3px] leading-none ${
            course.badge === "BESTSELLER"
              ? "bg-white text-primary"
              : course.badge === "NEW"
              ? "bg-primary-bright text-white"
              : "bg-red-500 text-white"
          }`}>
            {course.badge === "BESTSELLER" ? "Bestseller" : course.badge}
            {(course.oldPriceMadCents || course.oldPriceUsdCents) && course.badge !== "BESTSELLER" && course.badge !== "NEW"
              ? ` -${discountPct(currency === "USD" ? course.priceUsdCents : course.priceMadCents, currency === "USD" ? (course.oldPriceUsdCents ?? 0) : (course.oldPriceMadCents ?? 0))}%`
              : ""}
          </span>
        )}

        <div className="absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="w-10 h-10 rounded-full bg-white/25 grid place-items-center backdrop-blur-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        <div className="text-[10.5px] font-bold text-primary-bright uppercase tracking-[0.1em] mb-1.5">
          {course.category.name}
        </div>
        <h4 className="text-[14.5px] font-bold text-ink leading-snug mb-1 line-clamp-2">
          {course.title}
        </h4>
        <div className="text-[12px] text-muted mb-2">{course.instructor.name}</div>
        <div className="flex items-center gap-1.5 text-[12px] mb-1.5">
          <span className="font-bold text-ink">{avgRating.toFixed(1)}</span>
          <StarRating rating={avgRating} />
          {reviewCount > 0 && (
            <span className="text-muted">({reviewCount.toLocaleString()})</span>
          )}
        </div>
        <div className="text-[12px] text-muted mb-3">
          {durationHours} hours · {moduleCount} modules
        </div>
        <div className="flex items-center gap-2 mb-3 mt-auto">
          <span className="text-[18px] font-extrabold text-primary">{formatPrice(course.priceMadCents, course.priceUsdCents, currency)}</span>
          {(course.oldPriceMadCents || course.oldPriceUsdCents) && (
            <span className="text-[13px] text-muted line-through font-medium">
              {formatPrice(course.oldPriceMadCents ?? 0, course.oldPriceUsdCents ?? 0, currency)}
            </span>
          )}
        </div>
        {course.isBestseller && (
          <span className="self-start bg-primary-soft text-primary-hover text-[10px] font-extrabold tracking-[0.02em] uppercase px-1.5 py-0.5 rounded-[3px] mb-2.5">
            Bestseller
          </span>
        )}
        <Link
          href={`/courses/${course.slug}`}
          className="block w-full text-center py-2.5 bg-primary text-white text-[11px] font-extrabold tracking-[0.08em] uppercase rounded-lg hover:bg-primary-hover transition-colors mt-auto"
        >
          Continue Learning
        </Link>
      </div>
    </article>
  );
}
