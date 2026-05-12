import { db } from "@/lib/db";
import { AdminListPage } from "@/components/admin/AdminListPage";
import { CoursesTable } from "./CoursesTable";

export const metadata = { title: "Courses — JissrON Admin" };

export default async function AdminCoursesPage() {
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
      title="Courses"
      description="Manage your course catalog."
      newHref="/admin/courses/new"
      newLabel="New course"
    >
      <CoursesTable courses={courses} categories={categories} />
    </AdminListPage>
  );
}
