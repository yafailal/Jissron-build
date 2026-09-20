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
 * Wide, short course card for dense grids: thumbnail on the left; title, instructor, chips
 * (badge, rating, ratings count) and price on the right. The whole card is the link.
 */
export function CourseCardCompact({ course, index, currency }: CourseCardCompactProps) {
  const reviewCount = course.reviews.length;
  const avgRating = reviewCount ? course.reviews.reduce((s, r) => s + r.rating, 0) / reviewCount : null;
  const badge = course.badge ?? (course.isBestseller ? "Bestseller" : null);
  const expertise = course.instructor.featuredTagline || course.category.name;
  const hasOld = !!(course.oldPriceMadCents || course.oldPriceUsdCents);

  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group flex h-[240px] w-[340px] max-w-full flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-line transition-all duration-200 hover:-translate-y-0.5 hover:ring-primary hover:shadow-card"
    >
      <div
        className="relative h-[180px] w-full shrink-0 overflow-hidden"
        style={{ background: THUMB_GRADIENTS[index % THUMB_GRADIENTS.length] }}
      >
        {/* Brand-kit artwork instead of a photo: soft emerald orbs + logo mark tile */}
        <span className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-primary-bright/25" aria-hidden="true" />
        <span className="pointer-events-none absolute -bottom-16 -left-8 h-44 w-44 rounded-full bg-white/10" aria-hidden="true" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-card">
            <Image src="/logo-icon.png" alt="" width={34} height={34} className="h-[34px] w-[34px] object-contain" />
          </span>
          <span className="max-w-[80%] truncate rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-white">
            {course.category.name}
          </span>
        </div>
        {badge && (
          <span className="absolute left-2 top-2 rounded-md bg-white/95 px-1.5 py-1 text-[10.5px] font-bold leading-none text-primary">
            {badge}
          </span>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-center px-3">
        <h4 className="text-[14px] font-bold leading-tight text-ink truncate">{course.title}</h4>
        <div className="flex items-center justify-between gap-2 leading-tight">
          <span className="min-w-0 truncate text-[12px] font-semibold leading-tight text-ink">{course.instructor.name}</span>
          <span className="flex shrink-0 items-center gap-1.5">
            <span className="text-[15px] font-extrabold text-ink">
              {formatPrice(course.priceMadCents, course.priceUsdCents, currency)}
            </span>
            {hasOld && (
              <span className="text-[11px] text-muted line-through">
                {formatPrice(course.oldPriceMadCents ?? 0, course.oldPriceUsdCents ?? 0, currency)}
              </span>
            )}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 text-[11.5px] leading-tight text-muted">
          <span className="min-w-0 truncate">{expertise}</span>
          {avgRating !== null && (
            <span className="inline-flex shrink-0 items-center gap-1 font-medium">
              <Star size={11} className="fill-star text-star" aria-hidden="true" />
              <span className="font-bold text-ink">{avgRating.toFixed(1)}</span>({reviewCount.toLocaleString()})
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
