import Link from "next/link";
import { CourseCarousel } from "./CourseCarousel";
import type { Course } from "@/lib/data/homepage";
import type { Currency } from "@/lib/currency";

// Small floating points for the framed panel: [left %, top %, size px, opacity, duration s, delay s]
const POINTS: [number, number, number, number, number, number][] = [
  [4, 12, 6, 0.5, 7, 0], [11, 70, 4, 0.4, 9, 1.2], [18, 30, 8, 0.3, 8, 2.4], [26, 82, 5, 0.5, 6, 0.6],
  [34, 18, 4, 0.4, 10, 3], [42, 60, 7, 0.3, 7.5, 1.8], [50, 8, 5, 0.5, 8.5, 0.3], [57, 88, 6, 0.35, 9.5, 2.1],
  [65, 40, 4, 0.5, 6.5, 3.6], [72, 14, 8, 0.3, 8, 1], [79, 74, 5, 0.45, 7, 2.7], [86, 32, 6, 0.4, 9, 0.9],
  [92, 86, 4, 0.5, 6, 3.3], [96, 20, 7, 0.3, 10, 1.5],
];

// 200 more points, generated from a fixed seed so server and client render the same layout.
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = seeded(20260921);
const MORE_POINTS: [number, number, number, number, number, number][] = Array.from({ length: 200 }, () => [
  +(rand() * 100).toFixed(1),
  +(rand() * 100).toFixed(1),
  2 + Math.round(rand() * 4),
  +(0.2 + rand() * 0.4).toFixed(2),
  +(6 + rand() * 6).toFixed(1),
  +(rand() * 6).toFixed(1),
]);

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
              ? "relative rounded-[2rem] p-6 sm:p-10 shadow-card"
              : undefined
          }
          style={framed ? { background: "linear-gradient(135deg, #064e3b 0%, #0e7a5a 55%, #10b981 100%)" } : undefined}
        >
        {framed && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2rem]" aria-hidden="true">
            {[...POINTS, ...MORE_POINTS].map(([left, top, size, opacity, dur, delay], i) => (
              <span
                key={i}
                className="absolute rounded-full bg-white animate-float motion-reduce:animate-none"
                style={{ left: `${left}%`, top: `${top}%`, width: size, height: size, opacity, animationDuration: `${dur}s`, animationDelay: `${delay}s` }}
              />
            ))}
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
