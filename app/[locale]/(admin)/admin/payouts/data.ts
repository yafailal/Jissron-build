// Payout calculation module — resolves the instructor for each PAID order
// (course → instructor, live session → host, consult → consultant.user) and
// applies that instructor's User.platformCutPercent to split the amount.

import { db } from "@/lib/db";

export interface PayoutOrder {
  id: string;
  amountCents: number;
  currency: string;
  createdAt: Date;
  paidAt: Date | null;
  instructorPayoutAt: Date | null;
  source: "course" | "live" | "consult";
  sourceTitle: string;
  instructorShareCents: number;
  platformShareCents: number;
}

export interface InstructorPayoutRow {
  instructorId: string;
  name: string;
  email: string;
  platformCutPercent: number;
  // All-time across all PAID orders for this instructor:
  totals: {
    orders: number;
    revenueCents: number; // gross revenue paid by customers
    instructorEarnedCents: number;
    platformEarnedCents: number;
  };
  // Subset of orders where instructorPayoutAt is null (still owed):
  pending: {
    orders: number;
    revenueCents: number;
    instructorOwedCents: number; // amount we still need to transfer
    platformShareCents: number;
  };
  // Already paid out to instructor:
  paidOut: {
    orders: number;
    instructorPaidCents: number;
  };
}

export interface PayoutSummary {
  rows: InstructorPayoutRow[];
  totals: {
    pendingInstructorOwedCents: number;
    pendingOrders: number;
    lifetimePlatformEarnedCents: number;
    lifetimeInstructorEarnedCents: number;
    lifetimeRevenueCents: number;
    lifetimeOrders: number;
  };
}

/**
 * Splits one order's amount into instructor + platform shares.
 * Platform's cut comes off the top in cents; instructor gets the remainder.
 */
function split(amountCents: number, platformCutPercent: number) {
  const platform = Math.round((amountCents * platformCutPercent) / 100);
  const instructor = amountCents - platform;
  return { platform, instructor };
}

/**
 * Load every PAID order and aggregate per instructor.
 * MAD only — matches the analytics convention (no FX conversion).
 */
export async function loadPayouts(): Promise<PayoutSummary> {
  const orders = await db.order.findMany({
    where: {
      status: "PAID",
      currency: "MAD",
    },
    select: {
      id: true,
      amountCents: true,
      currency: true,
      createdAt: true,
      paidAt: true,
      instructorPayoutAt: true,
      course: {
        select: {
          id: true,
          title: true,
          instructor: { select: { id: true, name: true, email: true, platformCutPercent: true } },
        },
      },
      liveSession: {
        select: {
          id: true,
          title: true,
          host: { select: { id: true, name: true, email: true, platformCutPercent: true } },
        },
      },
      consultBooking: {
        select: {
          id: true,
          consultant: {
            select: {
              user: { select: { id: true, name: true, email: true, platformCutPercent: true } },
            },
          },
        },
      },
    },
    orderBy: { paidAt: "desc" },
  });

  const byInstructor = new Map<string, InstructorPayoutRow>();
  let lifetimePlatform = 0;
  let lifetimeInstructor = 0;
  let lifetimeRevenue = 0;
  let lifetimeOrders = 0;
  let pendingOwed = 0;
  let pendingOrdersCount = 0;

  for (const o of orders) {
    // Resolve instructor + source
    let instructor: { id: string; name: string | null; email: string; platformCutPercent: number } | null = null;
    let source: "course" | "live" | "consult" | null = null;
    if (o.course?.instructor) {
      instructor = o.course.instructor;
      source = "course";
    } else if (o.liveSession?.host) {
      instructor = o.liveSession.host;
      source = "live";
    } else if (o.consultBooking?.consultant.user) {
      instructor = o.consultBooking.consultant.user;
      source = "consult";
    }
    if (!instructor || !source) continue; // orphaned order — skip from payouts

    const { platform, instructor: insShare } = split(o.amountCents, instructor.platformCutPercent);
    const pendingThisOrder = o.instructorPayoutAt === null;

    lifetimePlatform += platform;
    lifetimeInstructor += insShare;
    lifetimeRevenue += o.amountCents;
    lifetimeOrders += 1;
    if (pendingThisOrder) {
      pendingOwed += insShare;
      pendingOrdersCount += 1;
    }

    const key = instructor.id;
    let row = byInstructor.get(key);
    if (!row) {
      row = {
        instructorId: instructor.id,
        name: instructor.name ?? instructor.email,
        email: instructor.email,
        platformCutPercent: instructor.platformCutPercent,
        totals: { orders: 0, revenueCents: 0, instructorEarnedCents: 0, platformEarnedCents: 0 },
        pending: { orders: 0, revenueCents: 0, instructorOwedCents: 0, platformShareCents: 0 },
        paidOut: { orders: 0, instructorPaidCents: 0 },
      };
      byInstructor.set(key, row);
    }

    row.totals.orders += 1;
    row.totals.revenueCents += o.amountCents;
    row.totals.instructorEarnedCents += insShare;
    row.totals.platformEarnedCents += platform;
    if (pendingThisOrder) {
      row.pending.orders += 1;
      row.pending.revenueCents += o.amountCents;
      row.pending.instructorOwedCents += insShare;
      row.pending.platformShareCents += platform;
    } else {
      row.paidOut.orders += 1;
      row.paidOut.instructorPaidCents += insShare;
    }
  }

  const rows = Array.from(byInstructor.values()).sort(
    (a, b) => b.pending.instructorOwedCents - a.pending.instructorOwedCents
  );

  return {
    rows,
    totals: {
      pendingInstructorOwedCents: pendingOwed,
      pendingOrders: pendingOrdersCount,
      lifetimePlatformEarnedCents: lifetimePlatform,
      lifetimeInstructorEarnedCents: lifetimeInstructor,
      lifetimeRevenueCents: lifetimeRevenue,
      lifetimeOrders,
    },
  };
}

/**
 * Detailed view: every PAID order for a single instructor, with payout status.
 * Used on the per-instructor drill-down (future). Available now if needed.
 */
export async function loadInstructorOrders(instructorId: string): Promise<PayoutOrder[]> {
  const orders = await db.order.findMany({
    where: {
      status: "PAID",
      currency: "MAD",
      OR: [
        { course: { instructorId } },
        { liveSession: { hostId: instructorId } },
        { consultBooking: { consultant: { userId: instructorId } } },
      ],
    },
    select: {
      id: true,
      amountCents: true,
      currency: true,
      createdAt: true,
      paidAt: true,
      instructorPayoutAt: true,
      course: { select: { title: true, instructor: { select: { platformCutPercent: true } } } },
      liveSession: { select: { title: true, host: { select: { platformCutPercent: true } } } },
      consultBooking: {
        select: {
          consultant: {
            select: { user: { select: { name: true, platformCutPercent: true } } },
          },
        },
      },
    },
    orderBy: { paidAt: "desc" },
  });

  return orders.map<PayoutOrder>((o) => {
    let source: PayoutOrder["source"] = "course";
    let sourceTitle = "—";
    let platformCutPercent = 30;
    if (o.course) {
      source = "course";
      sourceTitle = o.course.title;
      platformCutPercent = o.course.instructor?.platformCutPercent ?? 30;
    } else if (o.liveSession) {
      source = "live";
      sourceTitle = o.liveSession.title;
      platformCutPercent = o.liveSession.host?.platformCutPercent ?? 30;
    } else if (o.consultBooking) {
      source = "consult";
      sourceTitle = `Consult with ${o.consultBooking.consultant.user?.name ?? "—"}`;
      platformCutPercent = o.consultBooking.consultant.user?.platformCutPercent ?? 30;
    }
    const { platform, instructor } = split(o.amountCents, platformCutPercent);
    return {
      id: o.id,
      amountCents: o.amountCents,
      currency: o.currency,
      createdAt: o.createdAt,
      paidAt: o.paidAt,
      instructorPayoutAt: o.instructorPayoutAt,
      source,
      sourceTitle,
      instructorShareCents: instructor,
      platformShareCents: platform,
    };
  });
}
