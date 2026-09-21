import { Link } from "@/i18n/navigation";
import type { CourseCard } from "@/lib/data/courses";
import type { Currency } from "@/lib/currency";
import { formatPrice } from "@/lib/currency";

const THUMB_GRADIENTS = [
  "linear-gradient(135deg,#064e3b 0%,#10b981 100%)",
  "linear-gradient(135deg,#0b6b53 0%,#0e7a5a 100%)",
  "linear-gradient(135deg,#033a2c 0%,#0b6b53 100%)",
  "linear-gradient(135deg,#064e3b 0%,#10b981 100%)",
  "linear-gradient(135deg,#033a2c 0%,#10b981 100%)",
];

interface CourseListRowProps {
  course: CourseCard;
  index: number;
  currency: Currency;
}

export function CourseListRow({ course, index, currency }: CourseListRowProps) {
  const avgRating =
    course.reviews.length
      ? course.reviews.reduce((s, r) => s + r.rating, 0) / course.reviews.length
      : 0;

  const durationHours = Math.round(course.durationMinutes / 60);
  const moduleCount = course.modules.length;

  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group grid items-center gap-4 md:gap-5 bg-white rounded-xl border border-[#d9dcd6] p-4 transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_8px_24px_rgba(0,20,60,0.1)] hover:border-[#064e3b] grid-cols-1 md:grid-cols-[200px_1fr_auto]"
    >
      {/* Thumbnail */}
      <div
        className="relative h-[120px] rounded-lg overflow-hidden flex items-center justify-center shrink-0"
        style={{ background: THUMB_GRADIENTS[index % THUMB_GRADIENTS.length] }}
      >
        <span
          className="text-[48px] text-white/20 italic select-none"
          aria-hidden="true"
        >
          {course.title[0]}
        </span>
        {course.isBestseller && (
          <span className="absolute top-2 left-2 bg-[#10b981] text-white text-[9px] font-700 px-1.5 py-[2px] rounded-full">
            Bestseller
          </span>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0">
        <p className="text-[11px] font-600 uppercase tracking-[0.08em] text-[#10b981] mb-1.5">
          {course.category.name}
        </p>
        <h3 className="text-[15px] font-700 text-[#064e3b] leading-[1.35] line-clamp-2 group-hover:text-[#064e3b] transition-colors mb-1.5">
          {course.title}
        </h3>
        {course.subtitle && (
          <p className="text-[13px] text-[#6b7b72] line-clamp-1 mb-2">{course.subtitle}</p>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[12px] text-[#6b7b72]">{course.instructor.name}</span>

          {avgRating > 0 && (
            <>
              <span className="text-[#d9dcd6]">·</span>
              <div className="flex items-center gap-1">
                <span className="text-[#10b981] text-[12px]">{"★".repeat(Math.round(avgRating))}</span>
                <span className="text-[11px] text-[#6b7b72]">
                  {avgRating.toFixed(1)} ({course.reviews.length})
                </span>
              </div>
            </>
          )}

          {durationHours > 0 && (
            <>
              <span className="text-[#d9dcd6]">·</span>
              <span className="text-[12px] text-[#6b7b72]">{durationHours}h total</span>
            </>
          )}

          {moduleCount > 0 && (
            <>
              <span className="text-[#d9dcd6]">·</span>
              <span className="text-[12px] text-[#6b7b72]">{moduleCount} modules</span>
            </>
          )}

          {course.level && (
            <>
              <span className="text-[#d9dcd6]">·</span>
              <span className="text-[12px] text-[#6b7b72] capitalize">{course.level.toLowerCase()}</span>
            </>
          )}
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 mt-2.5 flex-wrap">
          {course.language && course.language !== "en" && (
            <span className="text-[10px] font-600 px-2 py-[2px] rounded-full bg-[#f7f6ef] text-[#6b7b72] uppercase">
              {course.language}
            </span>
          )}
          {course.priceMadCents > 0 && (
            <span className="text-[10px] font-600 px-2 py-[2px] rounded-full bg-[#fbfaf5] text-[#6b7b72] border border-[#d9dcd6]">
              🏦 Bank transfer
            </span>
          )}
          {course.priceUsdCents > 0 && (
            <span className="text-[10px] font-600 px-2 py-[2px] rounded-full bg-[#fbfaf5] text-[#6b7b72] border border-[#d9dcd6]">
              💳 Card
            </span>
          )}
        </div>
      </div>

      {/* Price */}
      <div className="flex flex-row md:flex-col items-center md:items-end gap-2 md:gap-1.5 md:text-right shrink-0">
        <span className="text-[18px] font-800 text-[#064e3b]">
          {formatPrice(course.priceMadCents, course.priceUsdCents, currency)}
        </span>
        {course.priceMadCents === 0 && course.priceUsdCents === 0 ? null : (
          <span
            className="inline-flex items-center justify-center text-[11px] font-600 px-3 py-1.5 rounded-lg transition-all duration-150"
            style={{ background: "#064e3b", color: "#ffffff" }}
          >
            View course
          </span>
        )}
        {course.priceMadCents === 0 && course.priceUsdCents === 0 && (
          <span
            className="inline-flex items-center justify-center text-[11px] font-600 px-3 py-1.5 rounded-lg"
            style={{ background: "#16a34a", color: "#ffffff" }}
          >
            Enroll free
          </span>
        )}
      </div>
    </Link>
  );
}
