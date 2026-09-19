import Link from "next/link";
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
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group block bg-white border border-line rounded-lg overflow-hidden hover:border-primary-bright/40 hover:shadow-sm transition-all"
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
            <div className="absolute top-1.5 left-1.5 flex flex-wrap gap-1">
              {course.badge && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9.5px] font-bold uppercase tracking-wide bg-primary text-white">
                  {course.badge}
                </span>
              )}
              {course.isBestseller && !course.badge && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9.5px] font-bold uppercase tracking-wide bg-amber-100 text-amber-800 border border-amber-200">
                  <Star className="w-2.5 h-2.5 fill-current" />
                  Bestseller
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
            {course.priceMadCents > 0 ? formatMad(course.priceMadCents) : "Free"}
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
  if (sameCategory.length === 0 && crossCategory.length === 0) return null;

  return (
    <aside className="flex flex-col h-full overflow-y-auto bg-white">
      <div className="px-4 py-4 border-b border-line shrink-0">
        <p className="font-bold text-[13px] text-ink">Keep learning</p>
        <p className="text-[11.5px] text-muted mt-0.5">
          Courses we think you&apos;ll like
        </p>
      </div>

      <div className="flex-1 px-3 py-3 space-y-4">
        {sameCategory.length > 0 && (
          <section>
            <p className="text-[10.5px] font-bold uppercase tracking-wide text-muted px-1 mb-2">
              More in {sameCategory[0].category.name}
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
            <p className="text-[10.5px] font-bold uppercase tracking-wide text-muted px-1 mb-2">
              You might also like
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
          className="inline-flex items-center justify-center gap-1 w-full py-2 rounded-md text-[11.5px] font-semibold text-primary hover:bg-primary-soft transition-colors"
        >
          Browse all courses
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </aside>
  );
}
