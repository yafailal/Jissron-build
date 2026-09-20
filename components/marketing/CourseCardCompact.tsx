import Image from "next/image";
import Link from "next/link";
import type { Course } from "@/lib/data/homepage";
import { formatPrice, type Currency } from "@/lib/currency";

const THUMB_GRADIENTS = [
  "linear-gradient(135deg,#064e3b 0%,#10b981 100%)",
  "linear-gradient(135deg,#0b6b53 0%,#0e7a5a 100%)",
  "linear-gradient(135deg,#033a2c 0%,#0b6b53 100%)",
  "linear-gradient(135deg,#064e3b 0%,#d9dcd6 100%)",
];

interface CourseCardCompactProps {
  course: Course;
  index: number;
  currency: Currency;
}

/** Compact course card for dense grids: short thumbnail, no button, whole card is the link. */
export function CourseCardCompact({ course, index, currency }: CourseCardCompactProps) {
  const reviewCount = course.reviews.length;
  const avgRating = reviewCount ? course.reviews.reduce((s, r) => s + r.rating, 0) / reviewCount : null;
  const badge = course.badge ?? (course.isBestseller ? "Bestseller" : null);
  const hasOld = !!(course.oldPriceMadCents || course.oldPriceUsdCents);

  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group flex flex-col bg-white border border-line rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-card"
    >
      <div
        className="relative h-[110px] overflow-hidden"
        style={{ background: THUMB_GRADIENTS[index % THUMB_GRADIENTS.length], borderRadius: "0 0 36px 0 / 0 0 24px 0" }}
      >
        {course.thumbnailUrl && (
          <Image src={course.thumbnailUrl} alt="" fill sizes="(min-width:1280px) 240px, 50vw" className="object-cover" />
        )}
        {badge && (
          <span className="absolute top-2 left-2 bg-white text-primary text-[9.5px] font-extrabold uppercase tracking-[0.04em] px-1.5 py-1 rounded-[3px] leading-none">
            {badge}
          </span>
        )}
      </div>

      <div className="p-3 flex flex-col flex-1">
        <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-primary-mid truncate">
          {course.category.name}
        </div>
        <h4 className="mt-1 text-[14px] font-bold leading-snug text-ink line-clamp-2 min-h-[2.5rem]">
          {course.title}
        </h4>
        <div className="mt-0.5 text-[12px] text-muted truncate">{course.instructor.name}</div>

        <div className="mt-2.5 flex items-center justify-between gap-2">
          {avgRating !== null ? (
            <span className="flex items-center gap-1 text-[12px]">
              <span className="text-star">★</span>
              <span className="font-bold text-ink">{avgRating.toFixed(1)}</span>
              <span className="text-muted">({reviewCount})</span>
            </span>
          ) : (
            <span />
          )}
          <span className="flex items-baseline gap-1.5">
            {hasOld && (
              <span className="text-[11px] text-muted line-through">
                {formatPrice(course.oldPriceMadCents ?? 0, course.oldPriceUsdCents ?? 0, currency)}
              </span>
            )}
            <span className="text-[15px] font-extrabold text-primary">
              {formatPrice(course.priceMadCents, course.priceUsdCents, currency)}
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}
