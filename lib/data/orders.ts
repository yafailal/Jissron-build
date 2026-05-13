import { db } from "@/lib/db";

export async function getOrder(id: string) {
  return db.order.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      course: {
        select: {
          id: true,
          slug: true,
          title: true,
          thumbnailUrl: true,
          priceMadCents: true,
          priceUsdCents: true,
        },
      },
    },
  });
}

export async function getPendingOrdersForUser(userId: string) {
  return db.order.findMany({
    where: { userId, status: "PENDING" },
    include: {
      course: {
        select: { id: true, slug: true, title: true, thumbnailUrl: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAllOrders(statusFilter?: string) {
  const where =
    statusFilter && statusFilter !== "ALL"
      ? { status: statusFilter as import("@prisma/client").OrderStatus }
      : {};

  return db.order.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true } },
      course: { select: { id: true, slug: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

// Expiry windows differ by payment method:
//   - BANK_TRANSFER: 7 days (student needs time to make the offline transfer).
//   - CMI: 1 hour. CMI hosted-page sessions are ~30min; if no callback arrives
//     by then the student either abandoned or the gateway lost contact, and
//     letting the order sit PENDING for days blocks them from re-trying.
//   - STRIPE: 24 hours as a sensible default.
// Returns the list of newly-expired orders so the caller can send emails.
const EXPIRY_HOURS = {
  BANK_TRANSFER: 7 * 24, // 7 days
  CMI: 1,
  STRIPE: 24,
};

export async function findAndMarkExpiredOrders() {
  const now = Date.now();

  const expiring = await db.order.findMany({
    where: {
      status: "PENDING",
      OR: [
        {
          paymentMethod: "BANK_TRANSFER",
          createdAt: { lt: new Date(now - EXPIRY_HOURS.BANK_TRANSFER * 60 * 60 * 1000) },
        },
        {
          paymentMethod: "CMI",
          createdAt: { lt: new Date(now - EXPIRY_HOURS.CMI * 60 * 60 * 1000) },
        },
        {
          paymentMethod: "STRIPE",
          createdAt: { lt: new Date(now - EXPIRY_HOURS.STRIPE * 60 * 60 * 1000) },
        },
      ],
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      course: { select: { id: true, slug: true, title: true } },
    },
  });

  if (expiring.length === 0) return [];

  await db.order.updateMany({
    where: { id: { in: expiring.map((o) => o.id) } },
    data: { status: "EXPIRED", expiredAt: new Date() },
  });

  return expiring;
}
