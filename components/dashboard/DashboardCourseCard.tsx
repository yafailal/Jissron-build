import Link from "next/link";
import Image from "next/image";
import { CheckCircle2 } from "lucide-react";

const THUMB_GRADIENTS = [
  "linear-gradient(135deg,#003d80 0%,#0071e3 100%)",
  "linear-gradient(135deg,#0a2f5c 0%,#1a6ec9 100%)",
  "linear-gradient(135deg,#002a5a 0%,#0058b8 100%)",
  "linear-gradient(135deg,#003d80 0%,#66b5ff 100%)",
  "linear-gradient(135deg,#001f40 0%,#0071e3 100%)",
  "linear-gradient(135deg,#0058b8 0%,#66b5ff 100%)",
  "linear-gradient(135deg,#003d80 0%,#99c7ff 100%)",
  "linear-gradient(135deg,#002a5a 0%,#0071e3 100%)",
];

// Only the fields this card needs — compatible with both EnrolledCourseData and EnrolledCourseForClient
export interface CourseCardData {
  id: string;
  slug: string;
  title: string;
  instructorName: string;
  thumbnailUrl: string | null;
  progressPct: number;
  status: "not_started" | "in_progress" | "completed";
  firstIncompleteLessonId: string | null;
  firstLessonId: string;
}

interface DashboardCourseCardProps {
  course: CourseCardData;
  index: number;
}

export function DashboardCourseCard({ course, index }: DashboardCourseCardProps) {
  const gradient = THUMB_GRADIENTS[index % THUMB_GRADIENTS.length];
  const targetLessonId = course.firstIncompleteLessonId ?? course.firstLessonId;
  const href = `/courses/${course.slug}/learn${targetLessonId ? `?lessonId=${targetLessonId}` : ""}`;

  return (
    <Link
      href={href}
      className="group block bg-white border border-line rounded-xl overflow-hidden hover:border-primary/30 hover:shadow-card transition-all duration-200"
    >
      {/* Thumbnail */}
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

        {/* Status badge — no badge for not_started */}
        {course.status === "in_progress" && (
          <span className="absolute top-2.5 right-2.5 text-[10px] font-700 uppercase tracking-wide px-2 py-1 rounded-md bg-primary-softer text-primary border border-primary/10">
            In progress
          </span>
        )}
        {course.status === "completed" && (
          <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 text-[10px] font-700 uppercase tracking-wide px-2 py-1 rounded-md bg-green-50 text-green-700 border border-green-200">
            <CheckCircle2 size={10} strokeWidth={2.5} />
            Completed
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        <h3 className="text-[14px] font-700 text-ink leading-snug line-clamp-2 mb-1">
          {course.title}
        </h3>
        <p className="text-[12px] text-muted font-500 mb-3">{course.instructorName}</p>

        {/* Progress bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-line overflow-hidden">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${course.progressPct}%` }}
            />
          </div>
          <span className="text-[11px] font-600 text-muted shrink-0 tabular-nums">
            {course.progressPct}%
          </span>
        </div>
      </div>
    </Link>
  );
}
