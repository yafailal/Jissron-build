import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/PageHeader";
import { CourseForm } from "../CourseForm";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "AdminCourses" });
  return { title: t("metaEdit") };
}

export default async function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations("AdminCourses");

  const [course, categories, instructors] = await Promise.all([
    db.course.findUnique({
      where: { id },
      include: {
        modules: {
          orderBy: { order: "asc" },
          include: {
            lessons: {
              orderBy: { order: "asc" },
              include: {
                quiz: { include: { questions: { orderBy: { order: "asc" } } } },
                assignment: true,
              },
            },
          },
        },
        faqs: { orderBy: { order: "asc" } },
      },
    }),
    db.category.findMany({ orderBy: { name: "asc" } }),
    db.user.findMany({
      where: { role: { in: ["INSTRUCTOR", "ADMIN"] } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
  ]);

  if (!course) notFound();

  return (
    <div>
      <PageHeader
        title={t("editTitle", { title: course.title })}
        description={t("editDescription")}
        backHref="/admin/courses"
      />
      <CourseForm course={course} categories={categories} instructors={instructors} />
    </div>
  );
}
