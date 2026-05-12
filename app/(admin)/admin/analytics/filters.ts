// Filter parsing + Prisma where-building shared between page render and export route.

import type { Prisma } from "@prisma/client";

export type AnalyticsPeriod = "all" | "thisMonth" | "lastMonth" | "thisWeek" | "today" | "custom";
export type AnalyticsType = "all" | "course" | "live" | "consult";

export interface AnalyticsFilters {
  period: AnalyticsPeriod;
  from: string | null;
  to: string | null;
  type: AnalyticsType;
  categoryId: string | null;
  language: string | null;
  instructorId: string | null;
  studentId: string | null;
}

const ALLOWED_PERIODS: AnalyticsPeriod[] = ["all", "thisMonth", "lastMonth", "thisWeek", "today", "custom"];
const ALLOWED_TYPES: AnalyticsType[] = ["all", "course", "live", "consult"];

export function parseFilters(sp: Record<string, string | string[] | undefined>): AnalyticsFilters {
  const get = (k: string) => {
    const v = sp[k];
    if (Array.isArray(v)) return v[0] ?? null;
    return v ?? null;
  };
  const period = (get("period") as AnalyticsPeriod) ?? "thisMonth";
  const type = (get("type") as AnalyticsType) ?? "all";
  return {
    period: ALLOWED_PERIODS.includes(period) ? period : "thisMonth",
    from: get("from"),
    to: get("to"),
    type: ALLOWED_TYPES.includes(type) ? type : "all",
    categoryId: get("categoryId"),
    language: get("language"),
    instructorId: get("instructorId"),
    studentId: get("studentId"),
  };
}

export function dateRangeFromPeriod(f: AnalyticsFilters): { gte?: Date; lte?: Date } {
  const now = new Date();
  if (f.period === "all") return {};
  if (f.period === "today") {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return { gte: d };
  }
  if (f.period === "thisWeek") {
    const d = new Date(now);
    d.setDate(now.getDate() - now.getDay());
    d.setHours(0, 0, 0, 0);
    return { gte: d };
  }
  if (f.period === "thisMonth") {
    return { gte: new Date(now.getFullYear(), now.getMonth(), 1) };
  }
  if (f.period === "lastMonth") {
    return {
      gte: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      lte: new Date(now.getFullYear(), now.getMonth(), 1),
    };
  }
  // custom
  const out: { gte?: Date; lte?: Date } = {};
  if (f.from) out.gte = new Date(f.from);
  if (f.to) {
    const t = new Date(f.to);
    t.setHours(23, 59, 59, 999);
    out.lte = t;
  }
  return out;
}

// Build Prisma where for paid orders matching the filters.
// All revenue in MAD only — per user preference.
export function buildOrderWhere(f: AnalyticsFilters): Prisma.OrderWhereInput {
  const date = dateRangeFromPeriod(f);
  const where: Prisma.OrderWhereInput = {
    status: "PAID",
    currency: "MAD",
  };
  if (date.gte || date.lte) where.createdAt = date;

  // Type filter
  if (f.type === "course") where.courseId = { not: null };
  if (f.type === "live") where.liveSessionId = { not: null };
  if (f.type === "consult") where.consultBookingId = { not: null };

  // Student filter
  if (f.studentId) where.userId = f.studentId;

  // Category / Language / Instructor are joined through the entity (course | liveSession | consultBooking.consultant)
  if (f.categoryId || f.language || f.instructorId) {
    const conds: Prisma.OrderWhereInput[] = [];
    // Course-bound condition
    const courseCond: Prisma.CourseWhereInput = {};
    if (f.categoryId) courseCond.categoryId = f.categoryId;
    if (f.language) courseCond.language = f.language;
    if (f.instructorId) courseCond.instructorId = f.instructorId;
    if (Object.keys(courseCond).length > 0) {
      conds.push({ course: courseCond });
    }
    // Live-bound condition
    const liveCond: Prisma.LiveSessionWhereInput = {};
    if (f.categoryId) liveCond.categoryId = f.categoryId;
    if (f.language) liveCond.language = f.language;
    if (f.instructorId) liveCond.hostId = f.instructorId;
    if (Object.keys(liveCond).length > 0) {
      conds.push({ liveSession: liveCond });
    }
    // Consultant-bound (via consultBooking.consultant)
    const consCond: Prisma.ConsultantWhereInput = {};
    if (f.categoryId) consCond.categoryId = f.categoryId;
    if (f.language) consCond.language = f.language;
    if (f.instructorId) consCond.userId = f.instructorId;
    if (Object.keys(consCond).length > 0) {
      conds.push({ consultBooking: { consultant: consCond } });
    }
    if (conds.length > 0) where.OR = conds;
  }

  return where;
}

export function toSearchParams(f: AnalyticsFilters): URLSearchParams {
  const sp = new URLSearchParams();
  if (f.period !== "thisMonth") sp.set("period", f.period);
  if (f.from) sp.set("from", f.from);
  if (f.to) sp.set("to", f.to);
  if (f.type !== "all") sp.set("type", f.type);
  if (f.categoryId) sp.set("categoryId", f.categoryId);
  if (f.language) sp.set("language", f.language);
  if (f.instructorId) sp.set("instructorId", f.instructorId);
  if (f.studentId) sp.set("studentId", f.studentId);
  return sp;
}
