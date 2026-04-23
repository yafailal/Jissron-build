import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/PageHeader";
import { CourseForm } from "../CourseForm";

export const metadata = { title: "New Course — JissrON Admin" };

export default async function NewCoursePage() {
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
        title="New course"
        description="Fill in the details to create a new course."
        backHref="/admin/courses"
      />
      <CourseForm categories={categories} instructors={instructors} />
    </div>
  );
}
