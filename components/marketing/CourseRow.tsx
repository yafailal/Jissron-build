import Link from "next/link";
import { CourseCarousel } from "./CourseCarousel";
import type { Course } from "@/lib/data/homepage";
import type { Currency } from "@/lib/currency";

interface CourseRowProps {
  title: string;
  seeAllHref: string;
  courses: Course[];
  currency: Currency;
}

/** One horizontally scrolling row of course cards with a title and "See all" link. */
export function CourseRow({ title, seeAllHref, courses, currency }: CourseRowProps) {
  if (courses.length === 0) return null;
  return (
    <section className="py-7">
      <div className="wrap">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-[22px] sm:text-[26px] font-extrabold tracking-[-0.02em] text-ink">{title}</h2>
          <Link href={seeAllHref} className="shrink-0 text-[13.5px] font-semibold text-primary-mid hover:underline underline-offset-2">
            See all →
          </Link>
        </div>
        <CourseCarousel courses={courses} currency={currency} />
      </div>
    </section>
  );
}
