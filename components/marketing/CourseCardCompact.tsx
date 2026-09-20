import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
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

/**
 * Framed course card for dense grids: inset rounded thumbnail, title, instructor, a row of
 * small chips (badge, rating, ratings count) and the price. The whole card is the link.
 */
export function CourseCardCompact({ course, index, currency }: CourseCardCompactProps) {
  const reviewCount = course.reviews.length;
  const avgRating = reviewCount ? course.reviews.reduce((s, r) => s + r.rating, 0) / reviewCount : null;
  const badge = course.badge ?? (course.isBestseller ? "Bestseller" : null);
  const hasOld = !!(course.oldPriceMadCents || course.oldPriceUsdCents);

  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group flex h-full flex-col bg-white border border-line rounded-2xl p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-card"
    >
      <div
        className="relative aspect-video overflow-hidden rounded-xl"
        style={{ background: THUMB_GRADIENTS[index % THUMB_GRADIENTS.length] }}
      >
        {course.thumbnailUrl && (
          <Image src={course.thumbnailUrl} alt="" fill sizes="(min-width:1280px) 240px, 50vw" className="object-cover" />
        )}
      </div>

      <h4 className="mt-3.5 text-[15px] font-bold leading-snug text-ink line-clamp-3">{course.title}</h4>
      <div className="mt-1 text-[12.5px] text-muted truncate">{course.instructor.name}</div>

      <div className="mt-auto pt-4">
        <div className="flex flex-wrap items-center gap-1.5 min-h-[26px]">
          {badge && (
            <span className="rounded-md bg-primary-soft px-2 py-1 text-[11px] font-bold leading-none text-primary-hover">
              {badge}
            </span>
          )}
          {avgRating !== null && (
            <>
              <span className="inline-flex items-center gap-1 rounded-md border border-line px-2 py-1 text-[11px] font-bold leading-none text-ink">
                <Star size={11} className="fill-star text-star" aria-hidden="true" />
                {avgRating.toFixed(1)}
              </span>
              <span className="rounded-md border border-line px-2 py-1 text-[11px] font-medium leading-none text-muted">
                {reviewCount.toLocaleString()} {reviewCount === 1 ? "rating" : "ratings"}
              </span>
            </>
          )}
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-[18px] font-extrabold text-ink">
            {formatPrice(course.priceMadCents, course.priceUsdCents, currency)}
          </span>
          {hasOld && (
            <span className="text-[13px] text-muted line-through">
              {formatPrice(course.oldPriceMadCents ?? 0, course.oldPriceUsdCents ?? 0, currency)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
