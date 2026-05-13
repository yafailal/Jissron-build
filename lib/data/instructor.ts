// Server-side data loader for the instructor dashboard.
// Aggregates everything a single instructor needs to see about THEIR own
// content + revenue. Admins can call this for any instructor id; instructors
// should always pass their own session user id.

import { db } from "@/lib/db";

function splitCut(amountCents: number, platformCutPercent: number) {
  const platform = Math.round((amountCents * platformCutPercent) / 100);
  const instructor = amountCents - platform;
  return { platform, instructor };
}

export interface InstructorOverviewCourse {
  id: string;
  slug: string;
  title: string;
  thumbnailUrl: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  enrollmentCount: number;
  completedCount: number;
  paidOrderCount: number;
  grossMadCents: number;
  instructorMadCents: number;
}

export interface InstructorOverview {
  // Top-level KPIs
  totalStudents: number;
  totalCoursesPublished: number;
  totalCoursesDraft: number;
  grossMadCents: number;
  instructorMadCents: number;
  paidOutMadCents: number;
  pendingPayoutMadCents: number;
  pendingPayoutCount: number;
  platformCutPercent: number;

  // Grading queue
  pendingAssignmentSubmissions: number;
  pendingQuizAttempts: number;

  // Lists
  courses: InstructorOverviewCourse[];
  recentEnrollments: Array<{
    id: string;
    enrolledAt: Date;
    student: { id: string; name: string | null; email: string; image: string | null };
    course: { id: string; title: string; slug: string };
  }>;
}

export async function loadInstructorOverview(
  instructorId: string
): Promise<InstructorOverview> {
  const [
    instructor,
    coursesRaw,
    paidOrders,
    enrollmentsTotal,
    recentEnrollments,
    pendingAssignmentCount,
    pendingQuizCount,
  ] = await Promise.all([
    db.user.findUnique({
      where: { id: instructorId },
      select: { platformCutPercent: true },
    }),
    db.course.findMany({
      where: { instructorId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        thumbnailUrl: true,
        status: true,
        _count: { select: { enrollments: true } },
      },
    }),
    db.order.findMany({
      where: {
        status: "PAID",
        currency: "MAD",
        course: { instructorId },
      },
      select: {
        amountCents: true,
        courseId: true,
        instructorPayoutAt: true,
      },
    }),
    db.enrollment.count({
      where: { course: { instructorId } },
    }),
    db.enrollment.findMany({
      where: { course: { instructorId } },
      orderBy: { enrolledAt: "desc" },
      take: 8,
      select: {
        id: true,
        enrolledAt: true,
        user: { select: { id: true, name: true, email: true, image: true } },
        course: { select: { id: true, title: true, slug: true } },
      },
    }),
    db.assignmentSubmission.count({
      where: {
        status: "SUBMITTED",
        gradedAt: null,
        assignment: { lesson: { module: { course: { instructorId } } } },
      },
    }),
    db.quizAttempt.count({
      where: {
        completedAt: null,
        quiz: { lesson: { module: { course: { instructorId } } } },
      },
    }),
  ]);

  const platformCutPercent = instructor?.platformCutPercent ?? 30;

  // Per-course aggregates
  const perCourse = new Map<string, { paidOrderCount: number; grossMad: number }>();
  let grossMadCents = 0;
  let instructorMadCents = 0;
  let paidOutMadCents = 0;
  let pendingPayoutMadCents = 0;
  let pendingPayoutCount = 0;

  for (const order of paidOrders) {
    if (!order.courseId) continue;
    const bucket = perCourse.get(order.courseId) ?? { paidOrderCount: 0, grossMad: 0 };
    bucket.paidOrderCount += 1;
    bucket.grossMad += order.amountCents;
    perCourse.set(order.courseId, bucket);

    grossMadCents += order.amountCents;
    const { instructor: cut } = splitCut(order.amountCents, platformCutPercent);
    instructorMadCents += cut;

    if (order.instructorPayoutAt) {
      paidOutMadCents += cut;
    } else {
      pendingPayoutMadCents += cut;
      pendingPayoutCount += 1;
    }
  }

  // Completed-count per course (sum across all enrollments). One query.
  const completedByCourse = await db.enrollment.groupBy({
    by: ["courseId"],
    where: {
      course: { instructorId },
      completedAt: { not: null },
    },
    _count: { _all: true },
  });
  const completedMap = new Map(completedByCourse.map((c) => [c.courseId, c._count._all]));

  const courses: InstructorOverviewCourse[] = coursesRaw.map((c) => {
    const cut = perCourse.get(c.id) ?? { paidOrderCount: 0, grossMad: 0 };
    const { instructor: instructorShare } = splitCut(cut.grossMad, platformCutPercent);
    return {
      id: c.id,
      slug: c.slug,
      title: c.title,
      thumbnailUrl: c.thumbnailUrl,
      status: c.status,
      enrollmentCount: c._count.enrollments,
      completedCount: completedMap.get(c.id) ?? 0,
      paidOrderCount: cut.paidOrderCount,
      grossMadCents: cut.grossMad,
      instructorMadCents: instructorShare,
    };
  });

  return {
    totalStudents: enrollmentsTotal,
    totalCoursesPublished: coursesRaw.filter((c) => c.status === "PUBLISHED").length,
    totalCoursesDraft: coursesRaw.filter((c) => c.status === "DRAFT").length,
    grossMadCents,
    instructorMadCents,
    paidOutMadCents,
    pendingPayoutMadCents,
    pendingPayoutCount,
    platformCutPercent,
    pendingAssignmentSubmissions: pendingAssignmentCount,
    pendingQuizAttempts: pendingQuizCount,
    courses,
    recentEnrollments: recentEnrollments.map((e) => ({
      id: e.id,
      enrolledAt: e.enrolledAt,
      student: e.user,
      course: e.course,
    })),
  };
}
