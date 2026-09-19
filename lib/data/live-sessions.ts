import { db } from "@/lib/db";
import { cache } from "react";

export const getAllUpcomingLiveSessions = cache(async () => {
  return db.liveSession.findMany({
    where: { status: { in: ["SCHEDULED", "LIVE"] } },
    include: { host: true },
    orderBy: { startsAt: "asc" },
  });
});

export const getLiveSessionBySlug = cache(async (slug: string) => {
  return db.liveSession.findUnique({
    where: { slug },
    include: { host: true, _count: { select: { bookings: true } } },
  });
});
