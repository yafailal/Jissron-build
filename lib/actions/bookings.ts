"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type BookResult =
  | { ok: true; bookingId: string }
  | { ok: false; error: string };

/**
 * Books a seat in a free live session.
 *
 * Seat enforcement uses an interactive transaction with `Serializable`
 * isolation so concurrent bookings can't oversell. We count current
 * CONFIRMED bookings inside the txn and insert only if seats are left.
 * The model's @@unique([userId, liveSessionId]) handles duplicate clicks
 * from the same user.
 *
 * Paid sessions are handled by the Stripe/CMI checkout flow which creates
 * the Booking on webhook confirmation — this action only does free.
 */
export async function bookFreeLiveSession(sessionId: string): Promise<BookResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sign in to book a seat" };

  const live = await db.liveSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      slug: true,
      isFree: true,
      seatsTotal: true,
      status: true,
      startsAt: true,
    },
  });
  if (!live) return { ok: false, error: "Session not found" };
  if (!live.isFree) return { ok: false, error: "This is a paid session — use checkout instead" };
  if (live.status === "CANCELLED") return { ok: false, error: "This session was cancelled" };
  if (live.status === "ENDED") return { ok: false, error: "This session has already ended" };

  try {
    const booking = await db.$transaction(
      async (tx) => {
        const taken = await tx.booking.count({
          where: { liveSessionId: sessionId, status: "CONFIRMED" },
        });
        if (taken >= live.seatsTotal) {
          throw new Error("SEATS_FULL");
        }
        return tx.booking.create({
          data: {
            userId: session.user.id,
            liveSessionId: sessionId,
            status: "CONFIRMED",
          },
          select: { id: true },
        });
      },
      { isolationLevel: "Serializable" }
    );

    revalidatePath(`/live/${live.slug}`);
    revalidatePath("/live");
    revalidatePath("/dashboard");

    return { ok: true, bookingId: booking.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message === "SEATS_FULL") {
      return { ok: false, error: "Sorry — all seats for this session are taken" };
    }
    // Prisma P2002 from the @@unique constraint = user already booked
    if (message.includes("Unique constraint")) {
      return { ok: false, error: "You're already booked for this session" };
    }
    return { ok: false, error: "Couldn't book the seat — please try again" };
  }
}

/**
 * Cancel a user's own booking. Frees up the seat.
 * Only allowed before the session starts.
 */
export async function cancelLiveSessionBooking(bookingId: string): Promise<{ ok: boolean; error?: string }> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sign in first" };

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { liveSession: { select: { slug: true, startsAt: true, status: true } } },
  });
  if (!booking) return { ok: false, error: "Booking not found" };
  if (booking.userId !== session.user.id) return { ok: false, error: "Not your booking" };
  if (booking.liveSession.status === "LIVE" || booking.liveSession.status === "ENDED") {
    return { ok: false, error: "Session is already live or ended" };
  }
  if (booking.liveSession.startsAt.getTime() <= Date.now()) {
    return { ok: false, error: "Can't cancel after the session has started" };
  }

  await db.booking.delete({ where: { id: bookingId } });
  revalidatePath(`/live/${booking.liveSession.slug}`);
  revalidatePath("/live");
  revalidatePath("/dashboard");
  return { ok: true };
}
