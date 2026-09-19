import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendLiveSessionReminder } from "@/lib/emails/senders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Fires reminder emails ~1 hour before each upcoming live session.
 *
 * Designed for a Vercel Cron schedule like "every 5 minutes". Hits the
 * Booking table for every confirmed booking with no `reminderSentAt`
 * yet whose linked session starts within the next 60 minutes, sends the
 * email, then stamps `reminderSentAt`. Stamping is the idempotency guard,
 * so reruns are safe.
 *
 * Caller must include `Authorization: Bearer ${CRON_SECRET}`. Without the
 * secret env var the endpoint will refuse anonymous traffic, which keeps
 * Vercel preview deployments from triggering bursts of emails.
 */
export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "CRON_SECRET not configured" },
      { status: 503 }
    );
  }
  const header = req.headers.get("authorization") ?? "";
  if (header !== `Bearer ${expected}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const horizon = new Date(now.getTime() + 60 * 60 * 1000);

  // Pull bookings whose session is starting within ~60 minutes and we haven't
  // reminded yet. We pull a small page (50) per run so a stuck Resend doesn't
  // hold the cron open; the next tick picks up the rest.
  const due = await db.booking.findMany({
    where: {
      status: "CONFIRMED",
      reminderSentAt: null,
      liveSession: {
        status: { in: ["SCHEDULED", "LIVE"] },
        startsAt: { gt: now, lte: horizon },
      },
    },
    include: {
      user: { select: { name: true, email: true } },
      liveSession: {
        select: {
          title: true,
          slug: true,
          startsAt: true,
          durationMins: true,
          host: { select: { name: true } },
        },
      },
    },
    take: 50,
  });

  let sent = 0;
  let failed = 0;

  for (const booking of due) {
    try {
      await sendLiveSessionReminder({
        to: booking.user.email,
        userName: booking.user.name ?? booking.user.email.split("@")[0],
        sessionTitle: booking.liveSession.title,
        sessionSlug: booking.liveSession.slug,
        hostName: booking.liveSession.host.name ?? "your host",
        startsAt: booking.liveSession.startsAt,
        durationMins: booking.liveSession.durationMins,
      });
      await db.booking.update({
        where: { id: booking.id },
        data: { reminderSentAt: new Date() },
      });
      sent++;
    } catch (err) {
      failed++;
      console.error("[cron] live-session-reminder failed", booking.id, err);
    }
  }

  return NextResponse.json({
    ok: true,
    scanned: due.length,
    sent,
    failed,
    horizon: horizon.toISOString(),
  });
}
