import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { AdminListPage } from "@/components/admin/AdminListPage";
import { CoursesTable } from "./CoursesTable";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "AdminCourses" });
  return { title: t("metaCourses") };
}

export default async function AdminCoursesPage() {
  const t = await getTranslations("AdminCourses");
  const [courses, categories] = await Promise.all([
    db.course.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        category: { select: { name: true } },
        instructor: { select: { id: true, name: true } },
        _count: { select: { enrollments: true } },
      },
    }),
    db.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <AdminListPage
      title={t("title")}
      description={t("listDescription")}
      newHref="/admin/courses/new"
      newLabel={t("newCourse")}
    >
      <CoursesTable courses={courses} categories={categories} />
    </AdminListPage>
  );
}
