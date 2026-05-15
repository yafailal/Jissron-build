import { db } from "@/lib/db";
import { unstable_cache } from "next/cache";

/**
 * Window in which the meeting URL is revealed to bookees: from 15 minutes
 * before `startsAt` through `startsAt + durationMins`. Outside that window
 * we show a placeholder ("opens 15 min before start" or "session ended").
 */
const JOIN_WINDOW_PRE_MS = 15 * 60 * 1000;

export interface LiveSessionAccessView {
  canJoin: boolean;
  joinOpensAt: Date;
  joinClosesAt: Date;
  meetingUrl: string | null;
  recordingUrl: string | null;
}

export function deriveLiveSessionAccess(opts: {
  startsAt: Date;
  durationMins: number;
  status: string;
  meetingUrl: string | null;
  recordingUrl: string | null;
  hasBooking: boolean;
  isHost: boolean;
  isAdmin: boolean;
  now?: Date;
}): LiveSessionAccessView {
  const now = (opts.now ?? new Date()).getTime();
  const start = opts.startsAt.getTime();
  const end = start + opts.durationMins * 60 * 1000;
  const joinOpensAt = new Date(start - JOIN_WINDOW_PRE_MS);
  const joinClosesAt = new Date(end);

  // Host + admin can always join (to test, run the session, etc.)
  const privileged = opts.isHost || opts.isAdmin;
  const inWindow = now >= start - JOIN_WINDOW_PRE_MS && now <= end;

  const canJoin =
    (privileged || (opts.hasBooking && inWindow)) &&
    opts.status !== "CANCELLED" &&
    !!opts.meetingUrl;

  // Recording is shown to anyone who attended (had a booking) once status is ENDED.
  const showRecording =
    opts.recordingUrl &&
    (privileged || opts.hasBooking) &&
    opts.status === "ENDED";

  return {
    canJoin,
    joinOpensAt,
    joinClosesAt,
    meetingUrl: canJoin ? opts.meetingUrl : null,
    recordingUrl: showRecording ? opts.recordingUrl : null,
  };
}

export async function getLiveSessionForPublic(slug: string, viewerUserId: string | null) {
  const live = await db.liveSession.findUnique({
    where: { slug },
    include: {
      host: { select: { id: true, name: true, image: true, bio: true } },
      category: { select: { id: true, name: true, slug: true } },
      _count: { select: { bookings: { where: { status: "CONFIRMED" } } } },
    },
  });
  if (!live) return null;

  const viewerBooking =
    viewerUserId
      ? await db.booking.findUnique({
          where: {
            userId_liveSessionId: { userId: viewerUserId, liveSessionId: live.id },
          },
          select: { id: true, status: true },
        })
      : null;

  const seatsTaken = live._count.bookings;
  const seatsLeft = Math.max(0, live.seatsTotal - seatsTaken);

  return {
    live,
    viewerBooking,
    seatsTaken,
    seatsLeft,
  };
}

// 60s cross-request cache. The "now - 4h" boundary drifts by at most 60s
// while cached, which is immaterial for an upcoming-sessions list.
export const listPublicLiveSessions = unstable_cache(
  async () => {
    const now = new Date();
    const [upcoming, past] = await Promise.all([
      db.liveSession.findMany({
        where: {
          status: { in: ["SCHEDULED", "LIVE"] },
          startsAt: { gte: new Date(now.getTime() - 4 * 60 * 60 * 1000) }, // include sessions started in last 4h
        },
        include: {
          host: { select: { id: true, name: true, image: true } },
          category: { select: { id: true, name: true, slug: true } },
          _count: { select: { bookings: { where: { status: "CONFIRMED" } } } },
        },
        orderBy: { startsAt: "asc" },
      }),
      db.liveSession.findMany({
        where: { status: "ENDED" },
        include: {
          host: { select: { id: true, name: true, image: true } },
          category: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { startsAt: "desc" },
        take: 8,
      }),
    ]);
    return { upcoming, past };
  },
  ["public-live-sessions"],
  { revalidate: 60, tags: ["live-sessions"] }
);
