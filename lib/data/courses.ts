import { cache } from "react";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import type { CourseLevel, Prisma } from "@prisma/client";

// ─── Shared include shape (used for card/row display) ─────────────────────────

const courseCardInclude = {
  instructor: true,
  category: true,
  modules: { orderBy: { order: "asc" as const } },
  reviews: true,
} as const;

// ─── Listing filters ──────────────────────────────────────────────────────────

export type DurationRange = "under_2h" | "2_6h" | "6_17h" | "over_17h";
export type PaymentMethodFilter = "BANK_TRANSFER" | "LEMON_SQUEEZY";

export interface CourseFilters {
  categorySlug?: string;
  level?: string;
  price?: "free" | "paid";
  sort?: "newest" | "popular";
  page?: number;
  // Extended filters for redesigned listing page
  paymentMethods?: PaymentMethodFilter[];
  languages?: string[];
  durationRanges?: DurationRange[];
  minRating?: number;
}

const PAGE_SIZE = 12;

function durationRangesToMinutes(ranges: DurationRange[]): Prisma.IntFilter | undefined {
  if (!ranges.length) return undefined;
  const conditions: Prisma.IntFilter[] = [];
  if (ranges.includes("under_2h")) conditions.push({ lt: 120 });
  if (ranges.includes("2_6h")) conditions.push({ gte: 120, lt: 360 });
  if (ranges.includes("6_17h")) conditions.push({ gte: 360, lt: 1020 });
  if (ranges.includes("over_17h")) conditions.push({ gte: 1020 });
  if (conditions.length === 1) return conditions[0];
  // Multiple ranges — handled post-query (OR across ranges isn't trivial in Prisma IntFilter)
  return undefined;
}

export const getPublishedCourses = cache(async (filters: CourseFilters = {}) => {
  const {
    categorySlug,
    level,
    price,
    sort = "newest",
    page = 1,
    paymentMethods = [],
    languages = [],
    durationRanges = [],
    minRating = 0,
  } = filters;

  const where: Prisma.CourseWhereInput = {
    status: "PUBLISHED",
    ...(categorySlug ? { category: { slug: categorySlug } } : {}),
    ...(level && level !== "ALL" ? { level: level as CourseLevel } : {}),
    ...(price === "free"
      ? { priceMadCents: 0, priceUsdCents: 0 }
      : price === "paid"
      ? { OR: [{ priceMadCents: { gt: 0 } }, { priceUsdCents: { gt: 0 } }] }
      : {}),
    // Payment method: bank = MAD price exists, LS = USD price exists
    ...(paymentMethods.length
      ? {
          AND: paymentMethods.map((m) =>
            m === "BANK_TRANSFER"
              ? { priceMadCents: { gt: 0 } }
              : { priceUsdCents: { gt: 0 } }
          ),
        }
      : {}),
    ...(languages.length ? { language: { in: languages } } : {}),
  };

  const [allCourses, total] = await Promise.all([
    db.course.findMany({
      where,
      include: courseCardInclude,
      orderBy:
        sort === "popular"
          ? [{ isFeatured: "desc" }, { isBestseller: "desc" }, { reviews: { _count: "desc" } }]
          : [{ publishedAt: "desc" }, { createdAt: "desc" }],
    }),
    db.course.count({ where }),
  ]);

  // Post-query filters (rating + duration ranges)
  // TODO Phase 7: denormalize avgRating and reviewCount onto Course table for
  // efficient DB-level filtering at scale. Currently O(n) post-query.
  let courses = allCourses;

  if (minRating > 0) {
    courses = courses.filter((c) => {
      if (!c.reviews.length) return minRating === 0;
      const avg = c.reviews.reduce((s, r) => s + r.rating, 0) / c.reviews.length;
      return avg >= minRating;
    });
  }

  if (durationRanges.length) {
    courses = courses.filter((c) => {
      const m = c.durationMinutes;
      return durationRanges.some((r) => {
        if (r === "under_2h") return m < 120;
        if (r === "2_6h") return m >= 120 && m < 360;
        if (r === "6_17h") return m >= 360 && m < 1020;
        if (r === "over_17h") return m >= 1020;
        return false;
      });
    });
  }

  const filteredTotal = courses.length;
  const pageCount = Math.ceil(filteredTotal / PAGE_SIZE);
  const paginated = courses.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return { courses: paginated, total: filteredTotal, pageCount, page };
});

// ─── Categories ───────────────────────────────────────────────────────────────

export const getCategories = cache(async () => {
  return db.category.findMany({ orderBy: { name: "asc" } });
});

export const getAllCategoriesWithCounts = cache(async () => {
  return db.category.findMany({
    orderBy: { order: "asc" },
    include: {
      _count: { select: { courses: { where: { status: "PUBLISHED" } } } },
    },
  });
});

// ─── Editor's picks ───────────────────────────────────────────────────────────

export type EditorPickType = "featured" | "new" | "free";

export const getEditorsPicks = cache(async (type: EditorPickType, limit = 4) => {
  const where: Prisma.CourseWhereInput = {
    status: "PUBLISHED",
    ...(type === "featured" ? { isFeatured: true } : {}),
    ...(type === "free" ? { priceMadCents: 0, priceUsdCents: 0 } : {}),
  };

  return db.course.findMany({
    where,
    include: courseCardInclude,
    orderBy:
      type === "new"
        ? [{ publishedAt: "desc" }, { createdAt: "desc" }]
        : type === "featured"
        ? [{ isBestseller: "desc" }, { createdAt: "desc" }]
        : [{ createdAt: "desc" }],
    take: limit,
  });
});

// ─── Search index ─────────────────────────────────────────────────────────────

export const getCoursesSearchIndex = cache(async () => {
  const courses = await db.course.findMany({
    where: { status: "PUBLISHED" },
    select: {
      id: true,
      title: true,
      slug: true,
      durationMinutes: true,
      priceMadCents: true,
      priceUsdCents: true,
      instructor: { select: { name: true } },
      category: { select: { name: true, slug: true } },
    },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
  });

  return courses.map((c) => ({
    id: c.id,
    title: c.title,
    slug: c.slug,
    instructorName: c.instructor.name ?? "",
    categoryName: c.category.name,
    categorySlug: c.category.slug,
    durationMinutes: c.durationMinutes,
    priceMadCents: c.priceMadCents,
    priceUsdCents: c.priceUsdCents,
  }));
});

export type SearchIndexItem = Awaited<ReturnType<typeof getCoursesSearchIndex>>[number];

// ─── Detail ───────────────────────────────────────────────────────────────────

export const getCourseBySlug = cache(async (slug: string) => {
  return db.course.findUnique({
    where: { slug, status: "PUBLISHED" },
    include: {
      category: true,
      instructor: {
        include: { consultant: true },
      },
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              title: true,
              type: true,
              durationSeconds: true,
              isPreview: true,
              order: true,
            },
          },
        },
      },
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          user: { select: { name: true, image: true } },
        },
      },
      faqs: {
        orderBy: { order: "asc" },
      },
    },
  });
});

export type CourseDetail = NonNullable<Awaited<ReturnType<typeof getCourseBySlug>>>;
export type CourseCard = Awaited<ReturnType<typeof getPublishedCourses>>["courses"][number];

// ─── Enrollment check ─────────────────────────────────────────────────────────

export type EnrollmentResult =
  | { status: "not-authed"; enrolledAt: null; progressPct: 0 }
  | { status: "enrolled"; enrolledAt: Date; progressPct: number }
  | { status: "not-enrolled"; enrolledAt: null; progressPct: 0 };

export async function getEnrollmentStatus(courseId: string): Promise<EnrollmentResult> {
  const session = await auth();
  if (!session) return { status: "not-authed", enrolledAt: null, progressPct: 0 };

  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId } },
    select: { status: true, enrolledAt: true },
  });

  if (enrollment?.status === "ACTIVE") {
    // Count total lessons and completed lessons for this user/course
    const [totalLessons, completedLessons] = await Promise.all([
      db.lesson.count({
        where: { module: { courseId } },
      }),
      db.lessonProgress.count({
        where: {
          enrollment: { userId: session.user.id, courseId },
          completed: true,
        },
      }),
    ]);
    const progressPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    return { status: "enrolled", enrolledAt: enrollment.enrolledAt, progressPct };
  }
  return { status: "not-enrolled", enrolledAt: null, progressPct: 0 };
}

// ─── Learn page data ──────────────────────────────────────────────────────────

const learnLessonSelect = {
  id: true,
  title: true,
  type: true,
  videoUrl: true,
  videoGuid: true,
  audioUrl: true,
  pdfUrl: true,
  htmlContent: true,
  textContent: true,
  durationSeconds: true,
  isPreview: true,
  order: true,
  quizId: true,
  assignmentId: true,
} as const;

export async function getCourseLearnData(slug: string, userId: string) {
  const course = await db.course.findUnique({
    where: { slug, status: "PUBLISHED" },
    select: {
      id: true,
      slug: true,
      title: true,
      modules: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          order: true,
          lessons: {
            orderBy: { order: "asc" },
            select: learnLessonSelect,
          },
        },
      },
    },
  });

  if (!course) return null;

  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: course.id } },
    select: {
      id: true,
      enrolledAt: true,
      progress: {
        select: {
          lessonId: true,
          watchedSecs: true,
          completed: true,
        },
      },
    },
  });

  if (!enrollment) return null;

  const progressMap = new Map(enrollment.progress.map((p) => [p.lessonId, p]));
  const allLessons = course.modules.flatMap((m) => m.lessons);
  const totalLessons = allLessons.length;
  const completedCount = allLessons.filter((l) => progressMap.get(l.id)?.completed).length;
  const progressPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const firstIncomplete = allLessons.find((l) => !progressMap.get(l.id)?.completed);
  const firstIncompleteId = firstIncomplete?.id ?? allLessons[0]?.id ?? null;

  return {
    course,
    enrollment,
    progressMap,
    totalLessons,
    completedCount,
    progressPct,
    firstIncompleteId,
  };
}

export async function getLessonById(lessonId: string, userId: string) {
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    select: {
      ...learnLessonSelect,
      module: {
        select: {
          courseId: true,
          course: { select: { id: true, slug: true } },
        },
      },
    },
  });

  if (!lesson) return null;

  const enrollment = await db.enrollment.findUnique({
    where: {
      userId_courseId: { userId, courseId: lesson.module.courseId },
    },
    select: {
      id: true,
      progress: {
        where: { lessonId },
        select: { watchedSecs: true, completed: true },
      },
    },
  });

  if (!enrollment) return null;

  const progress = enrollment.progress[0] ?? null;
  return { lesson, enrollment, progress };
}
