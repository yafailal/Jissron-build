import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { CheckCircle2 } from "lucide-react";

const THUMB_GRADIENTS = [
  "linear-gradient(135deg,#064e3b 0%,#10b981 100%)",
  "linear-gradient(135deg,#0b6b53 0%,#0e7a5a 100%)",
  "linear-gradient(135deg,#033a2c 0%,#0b6b53 100%)",
  "linear-gradient(135deg,#064e3b 0%,#10b981 100%)",
  "linear-gradient(135deg,#033a2c 0%,#10b981 100%)",
  "linear-gradient(135deg,#0b6b53 0%,#10b981 100%)",
  "linear-gradient(135deg,#064e3b 0%,#d9dcd6 100%)",
  "linear-gradient(135deg,#033a2c 0%,#10b981 100%)",
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
  const t = useTranslations("Dashboard.card");
  const gradient = THUMB_GRADIENTS[index % THUMB_GRADIENTS.length];
  const targetLessonId = course.firstIncompleteLessonId ?? course.firstLessonId;
  const href = `/courses/${course.slug}/learn${targetLessonId ? `?lessonId=${targetLessonId}` : ""}`;

  return (
    <Link
      href={href}
      className="group block bg-white border border-line rounded-2xl overflow-hidden hover:border-primary hover:shadow-card transition-all duration-200"
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
          <span className="absolute top-2.5 end-2.5 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-primary-softer text-primary border border-primary/10">
            {t("inProgress")}
          </span>
        )}
        {course.status === "completed" && (
          <span className="absolute top-2.5 end-2.5 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-primary-soft text-primary border border-primary-mid/30">
            <CheckCircle2 size={10} strokeWidth={2.5} />
            {t("completed")}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        <h3 className="text-[14px] font-bold text-ink leading-snug line-clamp-2 mb-1">
          {course.title}
        </h3>
        <p className="text-[12px] text-muted font-medium mb-3">{course.instructorName}</p>

        {/* Progress bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-line overflow-hidden">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${course.progressPct}%` }}
            />
          </div>
          <span className="text-[11px] font-semibold text-muted shrink-0 tabular-nums">
            {course.progressPct}%
          </span>
        </div>
      </div>
    </Link>
  );
}
