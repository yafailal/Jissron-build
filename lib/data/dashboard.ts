import { db } from "@/lib/db";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PendingOrderData = {
  id: string;
  orderReference: string | null;
  courseTitle: string;
  courseSlug: string;
  amountCents: number;
  currency: string;
  createdAt: Date;
};

export type DashboardStats = {
  totalEnrolled: number;
  totalCompleted: number;
  totalInProgress: number;
  totalNotStarted: number;
  averageProgressPct: number;
};

export type ContinueLearningData = {
  courseSlug: string;
  courseTitle: string;
  thumbnailUrl: string | null;
  instructorName: string;
  moduleTitle: string;
  moduleOrder: number;
  lessonId: string;
  lessonTitle: string;
  progressPct: number;
};

export type EnrolledCourseData = {
  id: string;
  slug: string;
  title: string;
  instructorName: string;
  thumbnailUrl: string | null;
  category: string;
  progressPct: number;
  status: "not_started" | "in_progress" | "completed";
  lastAccessedAt: Date | null;
  enrolledAt: Date;
  firstIncompleteLessonId: string | null;
  firstLessonId: string;
};

export type FeaturedCourseData = {
  id: string;
  slug: string;
  title: string;
  instructorName: string;
  thumbnailUrl: string | null;
  priceMadCents: number;
  priceUsdCents: number;
};

export type DashboardData = {
  pendingOrders: PendingOrderData[];
  stats: DashboardStats | null;
  lastActive: Date | null;
  continueLearning: ContinueLearningData | null;
  enrolledCourses: EnrolledCourseData[];
  featuredCourses: FeaturedCourseData[];
};

// ─── Main query ───────────────────────────────────────────────────────────────

export async function getDashboardData(userId: string): Promise<DashboardData> {
  const [pendingOrderRows, enrollmentRows] = await Promise.all([
    db.order.findMany({
      where: { userId, status: "PENDING" },
      include: { course: { select: { title: true, slug: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.enrollment.findMany({
      where: {
        userId,
        status: "ACTIVE",
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      include: {
        course: {
          include: {
            instructor: { select: { name: true } },
            category: { select: { name: true } },
            modules: {
              orderBy: { order: "asc" },
              include: {
                lessons: {
                  orderBy: { order: "asc" },
                  select: { id: true, title: true },
                },
              },
            },
          },
        },
        progress: {
          select: { lessonId: true, completed: true, updatedAt: true },
        },
      },
      orderBy: { enrolledAt: "desc" },
    }),
  ]);

  const pendingOrders: PendingOrderData[] = pendingOrderRows.map((o) => ({
    id: o.id,
    orderReference: o.orderReference,
    courseTitle: o.course.title,
    courseSlug: o.course.slug,
    amountCents: o.amountCents,
    currency: o.currency,
    createdAt: o.createdAt,
  }));

  // No enrollments — return early with featured courses
  if (enrollmentRows.length === 0) {
    const featuredRows = await db.course.findMany({
      where: {
        status: "PUBLISHED",
        OR: [{ isFeatured: true }, { isBestseller: true }],
      },
      include: { instructor: { select: { name: true } } },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      take: 4,
    });

    return {
      pendingOrders,
      stats: null,
      lastActive: null,
      continueLearning: null,
      enrolledCourses: [],
      featuredCourses: featuredRows.map((c) => ({
        id: c.id,
        slug: c.slug,
        title: c.title,
        instructorName: c.instructor.name ?? "",
        thumbnailUrl: c.thumbnailUrl,
        priceMadCents: c.priceMadCents,
        priceUsdCents: c.priceUsdCents,
      })),
    };
  }

  // ── In-memory aggregation ─────────────────────────────────────────────────

  type FlatLesson = { id: string; title: string; moduleTitle: string; moduleOrder: number };

  let globalLastActive: Date | null = null;
  let totalProgressSum = 0;
  let totalCompleted = 0;
  let totalNotStarted = 0;
  let totalInProgress = 0;

  type BestContinue = {
    courseSlug: string;
    courseTitle: string;
    thumbnailUrl: string | null;
    instructorName: string;
    lessonId: string;
    lessonTitle: string;
    moduleTitle: string;
    moduleOrder: number;
    progressPct: number;
    lastAccessedAt: Date;
  };
  let bestContinue: BestContinue | null = null;

  const enrolledCourses: EnrolledCourseData[] = [];

  for (const enrollment of enrollmentRows) {
    const allLessons: FlatLesson[] = enrollment.course.modules.flatMap((m) =>
      m.lessons.map((l) => ({
        id: l.id,
        title: l.title,
        moduleTitle: m.title,
        moduleOrder: m.order,
      }))
    );

    const completedIds = new Set(
      enrollment.progress.filter((p) => p.completed).map((p) => p.lessonId)
    );
    const totalLessons = allLessons.length;
    const completedCount = completedIds.size;
    const progressPct =
      totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

    // Most recent progress update in this enrollment
    const enrollmentLastActive = enrollment.progress.reduce<Date | null>(
      (max, p) => (max === null || p.updatedAt > max ? p.updatedAt : max),
      null
    );
    if (
      enrollmentLastActive &&
      (globalLastActive === null || enrollmentLastActive > globalLastActive)
    ) {
      globalLastActive = enrollmentLastActive;
    }

    const status: "not_started" | "in_progress" | "completed" =
      progressPct === 100 ? "completed" : progressPct === 0 ? "not_started" : "in_progress";

    if (status === "completed") totalCompleted++;
    else if (status === "not_started") totalNotStarted++;
    else totalInProgress++;
    totalProgressSum += progressPct;

    const firstIncomplete = allLessons.find((l) => !completedIds.has(l.id)) ?? null;
    const firstLessonId = allLessons[0]?.id ?? "";

    // Continue learning: in-progress only, prefer most recently accessed
    if (status === "in_progress" && enrollmentLastActive !== null) {
      const replace =
        bestContinue === null || enrollmentLastActive > bestContinue.lastAccessedAt;
      if (replace) {
        // Last watched = most recent incomplete progress row
        const lastWatched = enrollment.progress
          .filter((p) => !p.completed)
          .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];

        const targetLessonId = lastWatched?.lessonId ?? firstIncomplete?.id ?? firstLessonId;
        const lessonMeta = allLessons.find((l) => l.id === targetLessonId);

        if (lessonMeta) {
          bestContinue = {
            courseSlug: enrollment.course.slug,
            courseTitle: enrollment.course.title,
            thumbnailUrl: enrollment.course.thumbnailUrl,
            instructorName: enrollment.course.instructor.name ?? "",
            lessonId: targetLessonId,
            lessonTitle: lessonMeta.title,
            moduleTitle: lessonMeta.moduleTitle,
            moduleOrder: lessonMeta.moduleOrder,
            progressPct,
            lastAccessedAt: enrollmentLastActive,
          };
        }
      }
    }

    enrolledCourses.push({
      id: enrollment.course.id,
      slug: enrollment.course.slug,
      title: enrollment.course.title,
      instructorName: enrollment.course.instructor.name ?? "",
      thumbnailUrl: enrollment.course.thumbnailUrl,
      category: enrollment.course.category.name,
      progressPct,
      status,
      lastAccessedAt: enrollmentLastActive,
      enrolledAt: enrollment.enrolledAt,
      firstIncompleteLessonId: firstIncomplete?.id ?? null,
      firstLessonId,
    });
  }

  // Sort: most recently accessed first, enrolledAt as tiebreaker
  enrolledCourses.sort((a, b) => {
    const aTime = a.lastAccessedAt?.getTime() ?? 0;
    const bTime = b.lastAccessedAt?.getTime() ?? 0;
    if (bTime !== aTime) return bTime - aTime;
    return b.enrolledAt.getTime() - a.enrolledAt.getTime();
  });

  const totalEnrolled = enrollmentRows.length;

  return {
    pendingOrders,
    stats: {
      totalEnrolled,
      totalCompleted,
      totalInProgress,
      totalNotStarted,
      averageProgressPct: Math.round(totalProgressSum / totalEnrolled),
    },
    lastActive: globalLastActive,
    continueLearning: bestContinue
      ? {
          courseSlug: bestContinue.courseSlug,
          courseTitle: bestContinue.courseTitle,
          thumbnailUrl: bestContinue.thumbnailUrl,
          instructorName: bestContinue.instructorName,
          moduleTitle: bestContinue.moduleTitle,
          moduleOrder: bestContinue.moduleOrder,
          lessonId: bestContinue.lessonId,
          lessonTitle: bestContinue.lessonTitle,
          progressPct: bestContinue.progressPct,
        }
      : null,
    enrolledCourses,
    featuredCourses: [],
  };
}
