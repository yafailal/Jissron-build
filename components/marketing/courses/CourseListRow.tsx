import { getTranslations } from "next-intl/server";
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

export async function CourseListRow({ course, index, currency }: CourseListRowProps) {
  const t = await getTranslations("Courses");
  const avgRating =
    course.reviews.length
      ? course.reviews.reduce((s, r) => s + r.rating, 0) / course.reviews.length
      : 0;

  const durationHours = Math.round(course.durationMinutes / 60);
  const moduleCount = course.modules.length;

  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group grid items-center gap-4 md:gap-5 bg-white rounded-2xl border border-line p-4 transition-colors hover:border-primary hover:shadow-card grid-cols-1 md:grid-cols-[200px_1fr_auto]"
    >
      {/* Thumbnail */}
      <div
        className="relative h-[120px] rounded-2xl overflow-hidden flex items-center justify-center shrink-0"
        style={{ background: THUMB_GRADIENTS[index % THUMB_GRADIENTS.length] }}
      >
        <span
          className="text-[48px] text-white/20 select-none"
          aria-hidden="true"
        >
          {course.title[0]}
        </span>
        {course.isBestseller && (
          <span className="absolute top-2 start-2 bg-primary-bright text-white text-[9px] font-bold px-1.5 py-[2px] rounded-full">
            {t("bestseller")}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary-mid mb-1.5">
          {course.category.name}
        </p>
        <h3 className="text-[15px] font-bold text-ink leading-[1.35] line-clamp-2 mb-1.5">
          {course.title}
        </h3>
        {course.subtitle && (
          <p className="text-[13px] text-muted line-clamp-1 mb-2">{course.subtitle}</p>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[12px] text-muted">{course.instructor.name}</span>

          {avgRating > 0 && (
            <>
              <span className="text-line-strong">·</span>
              <div className="flex items-center gap-1">
                <span className="text-primary-mid text-[12px]">{"★".repeat(Math.round(avgRating))}</span>
                <span className="text-[11px] text-muted">
                  {avgRating.toFixed(1)} ({course.reviews.length})
                </span>
              </div>
            </>
          )}

          {durationHours > 0 && (
            <>
              <span className="text-line-strong">·</span>
              <span className="text-[12px] text-muted">{t("hoursTotal", { count: durationHours })}</span>
            </>
          )}

          {moduleCount > 0 && (
            <>
              <span className="text-line-strong">·</span>
              <span className="text-[12px] text-muted">{t("modulesCount", { count: moduleCount })}</span>
            </>
          )}

          {course.level && (
            <>
              <span className="text-line-strong">·</span>
              <span className="text-[12px] text-muted capitalize">{t(`filters.levelOpts.${course.level}`)}</span>
            </>
          )}
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 mt-2.5 flex-wrap">
          {course.language && course.language !== "en" && (
            <span className="text-[10px] font-semibold px-2 py-[2px] rounded-full bg-primary-softer text-muted uppercase">
              {course.language}
            </span>
          )}
          {course.priceMadCents > 0 && (
            <span className="text-[10px] font-semibold px-2 py-[2px] rounded-full bg-bg-soft text-muted border border-line">
              🏦 {t("bankTransfer")}
            </span>
          )}
          {course.priceUsdCents > 0 && (
            <span className="text-[10px] font-semibold px-2 py-[2px] rounded-full bg-bg-soft text-muted border border-line">
              💳 {t("card")}
            </span>
          )}
        </div>
      </div>

      {/* Price */}
      <div className="flex flex-row md:flex-col items-center md:items-end gap-2 md:gap-1.5 md:text-end shrink-0">
        <span className="text-[18px] font-extrabold text-ink">
          {formatPrice(course.priceMadCents, course.priceUsdCents, currency)}
        </span>
        {course.priceMadCents === 0 && course.priceUsdCents === 0 ? null : (
          <span
            className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-4 text-[13px] font-bold text-white transition-colors group-hover:bg-primary-hover"
          >
            {t("viewCourse")}
          </span>
        )}
        {course.priceMadCents === 0 && course.priceUsdCents === 0 && (
          <span
            className="inline-flex h-9 items-center justify-center rounded-full bg-primary-bright px-4 text-[13px] font-bold text-white"
          >
            {t("enrollFree")}
          </span>
        )}
      </div>
    </Link>
  );
}
