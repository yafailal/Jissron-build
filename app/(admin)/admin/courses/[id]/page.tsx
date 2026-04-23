import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/PageHeader";
import { CourseForm } from "../CourseForm";

export const metadata = { title: "Edit Course — JissrON Admin" };

export default async function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [course, categories, instructors] = await Promise.all([
    db.course.findUnique({
      where: { id },
      include: {
        modules: {
          orderBy: { order: "asc" },
          include: { lessons: { orderBy: { order: "asc" } } },
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
        title={`Edit: ${course.title}`}
        description="Update course details."
        backHref="/admin/courses"
      />
      <CourseForm course={course} categories={categories} instructors={instructors} />
    </div>
  );
}
