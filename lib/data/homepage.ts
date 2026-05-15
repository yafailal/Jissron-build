import { db } from "@/lib/db";
import { cache } from "react";
import { unstable_cache } from "next/cache";

// These loaders return identical data for every visitor (no per-user or
// per-request input), so they're safe to cache across requests. We layer
// two caches:
//   - unstable_cache: cross-request persistent cache, 60s TTL. Eliminates
//     the repeated cross-region DB round-trips that dominate TTFB.
//   - react cache(): per-request dedup so a single render that needs the
//     same data twice only pays once.
// 60s staleness is acceptable for public marketing content; admin edits
// surface within a minute.

const REVALIDATE = 60;

export const getSiteSettings = cache(
  unstable_cache(
    async () => db.siteSettings.findUnique({ where: { id: "default" } }),
    ["site-settings"],
    { revalidate: REVALIDATE, tags: ["site-settings"] }
  )
);

export const getFeaturedCourses = cache(
  unstable_cache(
    async () =>
      db.course.findMany({
        where: { status: "PUBLISHED" },
        include: { instructor: true, category: true, modules: true, reviews: true },
        orderBy: [{ isFeatured: "desc" }, { isBestseller: "desc" }, { createdAt: "desc" }],
        take: 12,
      }),
    ["featured-courses"],
    { revalidate: REVALIDATE, tags: ["courses"] }
  )
);

export const getUpcomingLiveSessions = cache(
  unstable_cache(
    async () =>
      db.liveSession.findMany({
        where: { status: { in: ["SCHEDULED", "LIVE"] } },
        include: { host: true },
        orderBy: { startsAt: "asc" },
        take: 4,
      }),
    ["upcoming-live-sessions"],
    { revalidate: REVALIDATE, tags: ["live-sessions"] }
  )
);

export const getFeaturedConsultants = cache(
  unstable_cache(
    async () =>
      db.consultant.findMany({
        where: { acceptsNew: true },
        include: { user: true },
        orderBy: [{ isFeatured: "desc" }, { avgRating: "desc" }],
        take: 3,
      }),
    ["featured-consultants"],
    { revalidate: REVALIDATE, tags: ["consultants"] }
  )
);

export type SiteSettings = NonNullable<Awaited<ReturnType<typeof getSiteSettings>>>;
export type Course = Awaited<ReturnType<typeof getFeaturedCourses>>[number];
export type LiveSession = Awaited<ReturnType<typeof getUpcomingLiveSessions>>[number];
export type Consultant = Awaited<ReturnType<typeof getFeaturedConsultants>>[number];
