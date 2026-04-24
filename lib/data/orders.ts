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

// Finds all PENDING orders older than 7 days and marks them EXPIRED.
// Returns the list so callers can send expiry emails.
export async function findAndMarkExpiredOrders() {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const expiring = await db.order.findMany({
    where: {
      status: "PENDING",
      createdAt: { lt: cutoff },
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
