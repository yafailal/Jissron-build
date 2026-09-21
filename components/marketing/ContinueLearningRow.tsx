import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { DashboardCourseCard } from "@/components/dashboard/DashboardCourseCard";
import type { EnrolledCourseData } from "@/lib/data/dashboard";

interface ContinueLearningRowProps {
  courses: EnrolledCourseData[];
}

/** Logged-in learners' in-progress courses, shown at the top of the homepage. */
export function ContinueLearningRow({ courses }: ContinueLearningRowProps) {
  const t = useTranslations("Home");
  if (courses.length === 0) return null;
  return (
    <section className="pt-8 pb-3">
      <div className="wrap">
        <div className="flex items-baseline justify-between gap-4 mb-5">
          <h2 className="text-[22px] sm:text-[26px] font-extrabold tracking-[-0.02em] text-ink">{t("continueLearning")}</h2>
          <Link href="/dashboard" className="shrink-0 text-[13.5px] font-semibold text-primary-mid hover:underline underline-offset-2">
            {t("myLearning")}
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {courses.slice(0, 4).map((c, i) => (
            <DashboardCourseCard key={c.id} course={c} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
