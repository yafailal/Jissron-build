import Link from "next/link";
import Image from "next/image";
import type { FeaturedCourseData } from "@/lib/data/dashboard";

const THUMB_GRADIENTS = [
  "linear-gradient(135deg,#003d80 0%,#0071e3 100%)",
  "linear-gradient(135deg,#0a2f5c 0%,#1a6ec9 100%)",
  "linear-gradient(135deg,#002a5a 0%,#0058b8 100%)",
  "linear-gradient(135deg,#003d80 0%,#66b5ff 100%)",
];

interface DashboardEmptyStateProps {
  featuredCourses: FeaturedCourseData[];
}

export function DashboardEmptyState({ featuredCourses }: DashboardEmptyStateProps) {
  return (
    <div>
      {/* Hero CTA */}
      <div className="text-center py-10 mb-10">
        <h2
          className="text-3xl sm:text-4xl font-700 text-ink leading-snug mb-3"
          style={{ fontFamily: "var(--font-crimson), Georgia, serif" }}
        >
          <em>Ready to start learning?</em>
        </h2>
        <p className="text-muted font-500 mb-7 max-w-sm mx-auto">
          Browse our catalog and find your first course.
        </p>
        <Link
          href="/courses"
          className="inline-flex items-center h-11 px-8 rounded-xl bg-primary text-white font-700 hover:bg-primary-hover transition-colors"
        >
          Browse courses
        </Link>
      </div>

      {/* Featured courses */}
      {featuredCourses.length > 0 && (
        <div>
          <h3 className="text-[13px] font-700 uppercase tracking-[.08em] text-muted mb-4">
            Featured courses
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredCourses.map((course, i) => {
              const gradient = THUMB_GRADIENTS[i % THUMB_GRADIENTS.length];
              return (
                <Link
                  key={course.id}
                  href={`/courses/${course.slug}`}
                  className="group block bg-white border border-line rounded-xl overflow-hidden hover:border-primary/30 hover:shadow-card transition-all duration-200"
                >
                  <div
                    className="relative h-36 overflow-hidden"
                    style={{ background: course.thumbnailUrl ? undefined : gradient }}
                  >
                    {course.thumbnailUrl && (
                      <Image
                        src={course.thumbnailUrl}
                        alt={course.title}
                        fill
                        className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                      />
                    )}
                  </div>
                  <div className="p-4">
                    <h4 className="text-[14px] font-700 text-ink leading-snug line-clamp-2 mb-1">
                      {course.title}
                    </h4>
                    <p className="text-[12px] text-muted font-500">{course.instructorName}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
