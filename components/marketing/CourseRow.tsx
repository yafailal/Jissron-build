import Link from "next/link";
import { CodeDoodles } from "./CodeDoodles";
import { CourseCarousel } from "./CourseCarousel";
import type { Course } from "@/lib/data/homepage";
import type { Currency } from "@/lib/currency";

interface CourseRowProps {
  title: string;
  seeAllHref: string;
  courses: Course[];
  currency: Currency;
  /** Wrap the row in a large framed panel. */
  framed?: boolean;
}

/** One horizontally scrolling row of course cards with a title and "See all" link. */
export function CourseRow({ title, seeAllHref, courses, currency, framed = false }: CourseRowProps) {
  if (courses.length === 0) return null;
  return (
    <section className="py-7">
      <div className="wrap">
        <div
          className={
            framed
              ? "group/panel relative rounded-[2rem] p-6 sm:p-10 shadow-card"
              : undefined
          }
          style={framed ? { background: "linear-gradient(135deg, #064e3b 0%, #0e7a5a 55%, #10b981 100%)" } : undefined}
        >
        {framed && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2rem] opacity-0 transition-opacity duration-500 group-hover/panel:opacity-100" aria-hidden="true">
            <CodeDoodles />
          </div>
        )}
        <div className="relative z-10 flex items-baseline justify-between gap-4">
          <h2 className={`text-[22px] sm:text-[26px] font-extrabold tracking-[-0.02em] ${framed ? "text-white" : "text-ink"}`}>{title}</h2>
          <Link href={seeAllHref} className={`shrink-0 text-[13.5px] font-semibold hover:underline underline-offset-2 ${framed ? "text-primary-bright" : "text-primary-mid"}`}>
            See all →
          </Link>
        </div>
        <CourseCarousel courses={courses} currency={currency} bestsellerOnTopOnly={framed} />
        </div>
      </div>
    </section>
  );
}
