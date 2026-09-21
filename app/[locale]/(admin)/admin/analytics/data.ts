// Shared analytics data loader — runs the filtered queries and returns
// hero totals + breakdown rows. Used by both the analytics page and the
// CSV/JSON export route.

import { db } from "@/lib/db";
import { buildOrderWhere, type AnalyticsFilters } from "./filters";

export interface BreakdownRow {
  key: string; // stable id (categoryId, instructorId, etc.) or label fallback
  label: string;
  amountCents: number;
  orders: number;
}

export interface AnalyticsResult {
  total: { amountCents: number; orders: number; avgOrderCents: number };
  byType: BreakdownRow[];
  byCategory: BreakdownRow[];
  byLanguage: BreakdownRow[];
  byTeacher: BreakdownRow[];
  byStudent: BreakdownRow[];
}

const LANG_LABEL: Record<string, string> = {
  en: "English",
  fr: "French",
  ar: "Arabic",
  es: "Spanish",
  de: "German",
};

function sortDesc(rows: BreakdownRow[]) {
  return rows.sort((a, b) => b.amountCents - a.amountCents);
}

export async function loadAnalytics(f: AnalyticsFilters): Promise<AnalyticsResult> {
  const where = buildOrderWhere(f);

  const orders = await db.order.findMany({
    where,
    select: {
      id: true,
      amountCents: true,
      currency: true,
      courseId: true,
      liveSessionId: true,
      consultBookingId: true,
      userId: true,
      user: { select: { name: true, email: true } },
      course: {
        select: {
          id: true,
          title: true,
          language: true,
          category: { select: { id: true, name: true } },
          instructor: { select: { id: true, name: true, email: true } },
        },
      },
      liveSession: {
        select: {
          id: true,
          title: true,
          language: true,
          category: { select: { id: true, name: true } },
          host: { select: { id: true, name: true, email: true } },
        },
      },
      consultBooking: {
        select: {
          id: true,
          consultant: {
            select: {
              id: true,
              language: true,
              category: { select: { id: true, name: true } },
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      },
    },
  });

  let totalAmount = 0;
  const byType: Record<string, BreakdownRow> = {};
  const byCategory: Record<string, BreakdownRow> = {};
  const byLanguage: Record<string, BreakdownRow> = {};
  const byTeacher: Record<string, BreakdownRow> = {};
  const byStudent: Record<string, BreakdownRow> = {};

  const bump = (
    bucket: Record<string, BreakdownRow>,
    key: string,
    label: string,
    cents: number
  ) => {
    if (!bucket[key]) bucket[key] = { key, label, amountCents: 0, orders: 0 };
    bucket[key].amountCents += cents;
    bucket[key].orders += 1;
  };

  for (const o of orders) {
    totalAmount += o.amountCents;

    let typeKey: "course" | "live" | "consult" | "unknown" = "unknown";
    let categoryId: string | null = null;
    let categoryName: string | null = null;
    let language: string | null = null;
    let teacherId: string | null = null;
    let teacherName: string | null = null;

    if (o.course) {
      typeKey = "course";
      categoryId = o.course.category?.id ?? null;
      categoryName = o.course.category?.name ?? null;
      language = o.course.language;
      teacherId = o.course.instructor?.id ?? null;
      teacherName = o.course.instructor?.name ?? o.course.instructor?.email ?? null;
    } else if (o.liveSession) {
      typeKey = "live";
      categoryId = o.liveSession.category?.id ?? null;
      categoryName = o.liveSession.category?.name ?? null;
      language = o.liveSession.language;
      teacherId = o.liveSession.host?.id ?? null;
      teacherName = o.liveSession.host?.name ?? o.liveSession.host?.email ?? null;
    } else if (o.consultBooking) {
      typeKey = "consult";
      const c = o.consultBooking.consultant;
      categoryId = c.category?.id ?? null;
      categoryName = c.category?.name ?? null;
      language = c.language;
      teacherId = c.user?.id ?? null;
      teacherName = c.user?.name ?? c.user?.email ?? null;
    }

    bump(byType, typeKey, typeLabel(typeKey), o.amountCents);

    if (categoryId) bump(byCategory, categoryId, categoryName ?? "—", o.amountCents);
    else bump(byCategory, "uncategorized", "Uncategorized", o.amountCents);

    if (language) bump(byLanguage, language, LANG_LABEL[language] ?? language.toUpperCase(), o.amountCents);

    if (teacherId) bump(byTeacher, teacherId, teacherName ?? teacherId, o.amountCents);
    else bump(byTeacher, "unassigned", "Unassigned", o.amountCents);

    const studentKey = o.userId;
    const studentLabel = o.user.name ?? o.user.email;
    bump(byStudent, studentKey, studentLabel, o.amountCents);
  }

  const orderCount = orders.length;
  return {
    total: {
      amountCents: totalAmount,
      orders: orderCount,
      avgOrderCents: orderCount > 0 ? Math.round(totalAmount / orderCount) : 0,
    },
    byType: sortDesc(Object.values(byType)),
    byCategory: sortDesc(Object.values(byCategory)),
    byLanguage: sortDesc(Object.values(byLanguage)),
    byTeacher: sortDesc(Object.values(byTeacher)),
    byStudent: sortDesc(Object.values(byStudent)),
  };
}

function typeLabel(t: string): string {
  if (t === "course") return "Courses";
  if (t === "live") return "Live sessions";
  if (t === "consult") return "Consulting";
  return "Other";
}

// For the filter dropdowns — these are constant lists, queried once on page load.
export async function loadFilterOptions() {
  const [categories, instructors, students] = await Promise.all([
    db.category.findMany({ orderBy: { order: "asc" }, select: { id: true, name: true } }),
    db.user.findMany({
      where: { role: { in: ["INSTRUCTOR", "ADMIN"] } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
    db.user.findMany({
      where: { role: "STUDENT" },
      orderBy: { name: "asc" },
      take: 200,
      select: { id: true, name: true, email: true },
    }),
  ]);

  const languages = await db.course.findMany({
    distinct: ["language"],
    select: { language: true },
  });

  return {
    categories: categories.map((c) => ({ value: c.id, label: c.name })),
    languages: languages.map((l) => ({
      value: l.language,
      label: LANG_LABEL[l.language] ?? l.language.toUpperCase(),
    })),
    instructors: instructors.map((i) => ({ value: i.id, label: i.name ?? i.email })),
    students: students.map((s) => ({ value: s.id, label: s.name ?? s.email })),
  };
}
