import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/PageHeader";
import { CourseForm } from "../CourseForm";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "AdminCourses" });
  return { title: t("metaNew") };
}

export default async function NewCoursePage() {
  const t = await getTranslations("AdminCourses");
  const [categories, instructors] = await Promise.all([
    db.category.findMany({ orderBy: { name: "asc" } }),
    db.user.findMany({
      where: { role: { in: ["INSTRUCTOR", "ADMIN"] } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title={t("newCourse")}
        description={t("newDescription")}
        backHref="/admin/courses"
      />
      <CourseForm categories={categories} instructors={instructors} />
    </div>
  );
}
