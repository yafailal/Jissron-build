import { db } from "@/lib/db";

export async function getMyUpcomingBookings(userId: string) {
  const now = new Date();
  return db.booking.findMany({
    where: {
      userId,
      status: "CONFIRMED",
      liveSession: {
        // Show currently-ongoing too: cutoff = startsAt + a generous slack
        startsAt: { gte: new Date(now.getTime() - 4 * 60 * 60 * 1000) },
        status: { in: ["SCHEDULED", "LIVE"] },
      },
    },
    include: {
      liveSession: {
        select: {
          id: true,
          slug: true,
          title: true,
          startsAt: true,
          durationMins: true,
          status: true,
          kind: true,
          host: { select: { name: true, image: true } },
        },
      },
    },
    orderBy: { liveSession: { startsAt: "asc" } },
    take: 6,
  });
}
