import { db } from "@/lib/db";
import { cache } from "react";

export const getSiteSettings = cache(async () => {
  return db.siteSettings.findUnique({ where: { id: "default" } });
});

export const getFeaturedCourses = cache(async () => {
  return db.course.findMany({
    where: { status: "PUBLISHED" },
    include: { instructor: true, category: true, modules: true, reviews: true },
    orderBy: [{ isFeatured: "desc" }, { isBestseller: "desc" }, { createdAt: "desc" }],
    take: 12,
  });
});

export const getUpcomingLiveSessions = cache(async () => {
  return db.liveSession.findMany({
    where: { status: { in: ["SCHEDULED", "LIVE"] } },
    include: { host: true },
    orderBy: { startsAt: "asc" },
    take: 4,
  });
});

export const getFeaturedConsultants = cache(async () => {
  return db.consultant.findMany({
    where: { acceptsNew: true },
    include: { user: true },
    orderBy: [{ isFeatured: "desc" }, { avgRating: "desc" }],
    take: 3,
  });
});

export type SiteSettings = NonNullable<Awaited<ReturnType<typeof getSiteSettings>>>;
export type Course = Awaited<ReturnType<typeof getFeaturedCourses>>[number];
export type LiveSession = Awaited<ReturnType<typeof getUpcomingLiveSessions>>[number];
export type Consultant = Awaited<ReturnType<typeof getFeaturedConsultants>>[number];
