import { cache } from "react";
import { db } from "@/lib/db";

export const checkEnrollment = cache(
  async (userId: string, courseId: string): Promise<boolean> => {
    const enrollment = await db.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
      select: { status: true, expiresAt: true },
    });

    if (!enrollment || enrollment.status !== "ACTIVE") return false;
    if (enrollment.expiresAt && enrollment.expiresAt < new Date()) return false;
    return true;
  }
);

export const getUserEnrollments = cache(async (userId: string) => {
  return db.enrollment.findMany({
    where: {
      userId,
      status: "ACTIVE",
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnailUrl: true,
          instructor: { select: { name: true } },
        },
      },
    },
    orderBy: { enrolledAt: "desc" },
  });
});

export type UserEnrollment = Awaited<ReturnType<typeof getUserEnrollments>>[number];

export const getEnrollmentCount = cache(async (courseId: string): Promise<number> => {
  return db.enrollment.count({
    where: {
      courseId,
      status: "ACTIVE",
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  });
});
