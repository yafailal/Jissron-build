import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Star, Sparkles, ArrowRight } from "lucide-react";

interface SuggestedCourse {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  thumbnailUrl: string | null;
  priceMadCents: number;
  oldPriceMadCents: number | null;
  isBestseller: boolean;
  isFeatured: boolean;
  badge: string | null;
  instructor: { name: string | null };
  category: { name: string; slug: string };
}

interface SuggestedCoursesPanelProps {
  sameCategory: SuggestedCourse[];
  crossCategory: SuggestedCourse[];
}

function formatMad(cents: number) {
  return `${Math.round(cents / 100).toLocaleString("fr-MA")} MAD`;
}

function CourseCard({ course }: { course: SuggestedCourse }) {
  const t = useTranslations("Learn");
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group block bg-white border border-line rounded-2xl overflow-hidden hover:border-primary hover:shadow-card transition-all"
    >
      {course.thumbnailUrl ? (
        <div className="relative w-full aspect-video bg-bg-soft">
          <Image
            src={course.thumbnailUrl}
            alt={course.title}
            fill
            sizes="288px"
            className="object-cover"
          />
          {(course.isBestseller || course.isFeatured || course.badge) && (
            <div className="absolute top-1.5 start-1.5 flex flex-wrap gap-1">
              {course.badge && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wide bg-primary text-white">
                  {course.badge}
                </span>
              )}
              {course.isBestseller && !course.badge && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wide bg-amber-100 text-amber-800 border border-amber-200">
                  <Star className="w-2.5 h-2.5 fill-current" />
                  {t("suggested.bestseller")}
                </span>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="w-full aspect-video bg-bg-soft grid place-items-center">
          <Sparkles className="w-6 h-6 text-muted/40" />
        </div>
      )}
      <div className="p-2.5">
        <p className="font-bold text-[12.5px] text-ink leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {course.title}
        </p>
        {course.instructor.name && (
          <p className="text-[10.5px] text-muted mt-0.5 truncate">
            {course.instructor.name}
          </p>
        )}
        <div className="flex items-baseline gap-1.5 mt-1.5">
          <span className="text-[12px] font-bold text-primary">
            {course.priceMadCents > 0 ? formatMad(course.priceMadCents) : t("suggested.free")}
          </span>
          {course.oldPriceMadCents && course.oldPriceMadCents > course.priceMadCents && (
            <span className="text-[10.5px] text-muted line-through">
              {formatMad(course.oldPriceMadCents)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function SuggestedCoursesPanel({
  sameCategory,
  crossCategory,
}: SuggestedCoursesPanelProps) {
  const t = useTranslations("Learn");
  if (sameCategory.length === 0 && crossCategory.length === 0) return null;

  return (
    <aside className="flex flex-col h-full overflow-y-auto bg-bg-soft">
      <div className="px-4 py-4 border-b border-line shrink-0">
        <p className="font-bold text-[13px] text-ink">{t("suggested.keepLearning")}</p>
        <p className="text-[11.5px] text-muted mt-0.5">
          {t("suggested.subtitle")}
        </p>
      </div>

      <div className="flex-1 px-3 py-3 space-y-4">
        {sameCategory.length > 0 && (
          <section>
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-primary-mid px-1 mb-2">
              {t("suggested.moreIn", { category: sameCategory[0].category.name })}
            </p>
            <div className="space-y-2">
              {sameCategory.map((c) => (
                <CourseCard key={c.id} course={c} />
              ))}
            </div>
          </section>
        )}

        {crossCategory.length > 0 && (
          <section>
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-primary-mid px-1 mb-2">
              {t("suggested.mightLike")}
            </p>
            <div className="space-y-2">
              {crossCategory.map((c) => (
                <CourseCard key={c.id} course={c} />
              ))}
            </div>
          </section>
        )}

        <Link
          href="/courses"
          className="inline-flex items-center justify-center gap-1 w-full h-9 rounded-full border-[1.5px] border-primary text-[13px] font-bold text-primary hover:bg-primary hover:text-white transition-colors"
        >
          {t("suggested.browseAll")}
          <ArrowRight className="w-3 h-3 rtl:rotate-180" />
        </Link>
      </div>
    </aside>
  );
}
