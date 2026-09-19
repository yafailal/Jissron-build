"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { nextOrderReference } from "@/lib/utils/counter";
import {
  sendOrderReceived,
  sendPaymentConfirmed,
  sendOrderExpired,
} from "@/lib/emails/senders";
import { findAndMarkExpiredOrders } from "@/lib/data/orders";

// ── Create a bank transfer order and redirect to checkout ─────────────────────

export async function createBankTransferOrder(courseId: string) {
  const session = await auth();
  if (!session) redirect("/signin");

  const course = await db.course.findUnique({
    where: { id: courseId, status: "PUBLISHED" },
    select: {
      id: true,
      slug: true,
      title: true,
      priceMadCents: true,
    },
  });

  if (!course) return { ok: false as const, error: "Course not found." };
  if (course.priceMadCents === 0)
    return { ok: false as const, error: "Use the free enrollment flow for free courses." };

  const existing = await db.enrollment.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId } },
    select: { id: true },
  });
  if (existing) redirect("/dashboard");

  // Check for an existing PENDING order for the same course+user
  const pendingOrder = await db.order.findFirst({
    where: { userId: session.user.id, courseId, status: "PENDING" },
    select: { id: true },
  });
  if (pendingOrder) redirect(`/checkout/${pendingOrder.id}`);

  const orderReference = await nextOrderReference();

  const order = await db.order.create({
    data: {
      userId: session.user.id,
      courseId,
      status: "PENDING",
      paymentMethod: "BANK_TRANSFER",
      amountCents: course.priceMadCents,
      currency: "MAD",
      orderReference,
    },
    include: {
      user: { select: { name: true, email: true } },
      course: { select: { title: true } },
    },
  });

  // Non-fatal — order is already created if email fails
  try {
    await sendOrderReceived({
      to: order.user.email!,
      name: order.user.name ?? "Student",
      orderReference,
      courseTitle: order.course?.title ?? "Course",
      amountMad: Math.round(course.priceMadCents / 100),
      orderId: order.id,
    });
  } catch (err) {
    console.error("sendOrderReceived failed:", err);
  }

  redirect(`/checkout/${order.id}`);
}

// ── Admin: confirm payment ─────────────────────────────────────────────────────

export async function confirmPayment(
  orderId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return { ok: false, error: "Unauthorized" };
  }

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { name: true, email: true } },
      course: { select: { id: true, slug: true, title: true } },
    },
  });

  if (!order) return { ok: false, error: "Order not found." };
  if (!order.courseId || !order.course) {
    return { ok: false, error: "Bank-transfer confirmation only supported for course orders." };
  }

  // Idempotency: only act on PENDING orders
  if (order.status !== "PENDING") {
    return { ok: false, error: `Order is already ${order.status.toLowerCase()}.` };
  }

  const courseId = order.courseId;
  const course = order.course;

  await db.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: { status: "PAID", paidAt: new Date() },
    });

    await tx.enrollment.upsert({
      where: { userId_courseId: { userId: order.userId, courseId } },
      create: {
        userId: order.userId,
        courseId,
        orderId: order.id,
        status: "ACTIVE",
        method: "BANK_TRANSFER",
      },
      update: { status: "ACTIVE", orderId: order.id },
    });
  });

  try {
    await sendPaymentConfirmed({
      to: order.user.email!,
      name: order.user.name ?? "Student",
      orderReference: order.orderReference ?? orderId,
      courseTitle: course.title,
      courseSlug: course.slug,
    });
  } catch (err) {
    console.error("sendPaymentConfirmed failed:", err);
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}

// ── Admin: cancel order ───────────────────────────────────────────────────────

export async function cancelOrder(
  orderId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return { ok: false, error: "Unauthorized" };
  }

  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true },
  });

  if (!order) return { ok: false, error: "Order not found." };
  if (order.status !== "PENDING") {
    return { ok: false, error: `Cannot cancel an order with status ${order.status.toLowerCase()}.` };
  }

  await db.order.update({
    where: { id: orderId },
    data: { status: "CANCELLED" },
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}

// ── On-read auto-expire (called from admin/orders page and dashboard) ─────────

export async function autoExpireOrders(): Promise<void> {
  const expired = await findAndMarkExpiredOrders();

  for (const order of expired) {
    if (!order.course) continue; // expiration email is course-only
    try {
      await sendOrderExpired({
        to: order.user.email!,
        name: order.user.name ?? "Student",
        orderReference: order.orderReference ?? order.id,
        courseTitle: order.course.title,
        courseSlug: order.course.slug,
      });
    } catch (err) {
      console.error(`sendOrderExpired failed for order ${order.id}:`, err);
    }
  }
}

// ── Admin: save admin note ────────────────────────────────────────────────────

export async function saveAdminNote(
  orderId: string,
  note: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return { ok: false, error: "Unauthorized" };
  }

  await db.order.update({
    where: { id: orderId },
    data: { adminNote: note },
  });

  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}

// ── Student: update receipt URL after UploadThing upload ─────────────────────

export async function saveReceiptUrl(
  orderId: string,
  receiptUrl: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await auth();
  if (!session) return { ok: false, error: "Unauthorized" };

  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { userId: true, status: true },
  });

  if (!order) return { ok: false, error: "Order not found." };
  if (order.userId !== session.user.id) return { ok: false, error: "Unauthorized" };
  if (order.status !== "PENDING") return { ok: false, error: "Order is no longer pending." };

  await db.order.update({
    where: { id: orderId },
    data: { receiptUrl },
  });

  revalidatePath(`/checkout/${orderId}`);
  return { ok: true };
}
