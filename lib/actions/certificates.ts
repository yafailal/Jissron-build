"use server";

import { db } from "@/lib/db";

// Public-facing certificate IDs. Format: JISS-YYYY-XXXXXX
// (uppercase alphanumeric, no ambiguous chars — easy to read aloud / type)
const SERIAL_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/L/O/0/1

function generateSerialNumber(): string {
  const year = new Date().getUTCFullYear();
  let body = "";
  for (let i = 0; i < 6; i++) {
    body += SERIAL_ALPHABET[Math.floor(Math.random() * SERIAL_ALPHABET.length)];
  }
  return `JISS-${year}-${body}`;
}

interface IssueOpts {
  userId: string;
  courseId: string;
}

/**
 * Issue a certificate for a completed enrollment. Idempotent — if one already
 * exists for this (userId, courseId) pair we just return it. Snapshot the
 * student name, email, course title and instructor name at issue time so the
 * certificate stays semantically valid through later renames.
 *
 * Should be called only after `enrollment.completedAt` is set. The caller is
 * responsible for that check; we don't re-verify lesson counts here.
 */
export async function issueCertificate(
  opts: IssueOpts
): Promise<{ ok: true; serialNumber: string; issued: boolean } | { ok: false; error: string }> {
  try {
    // Idempotency check first — cheap, avoids a wasted findUnique on the user/course
    const existing = await db.certificate.findUnique({
      where: { userId_courseId: { userId: opts.userId, courseId: opts.courseId } },
      select: { serialNumber: true },
    });
    if (existing) {
      return { ok: true, serialNumber: existing.serialNumber, issued: false };
    }

    const [user, course] = await Promise.all([
      db.user.findUnique({
        where: { id: opts.userId },
        select: { name: true, email: true },
      }),
      db.course.findUnique({
        where: { id: opts.courseId },
        select: { title: true, instructor: { select: { name: true } } },
      }),
    ]);
    if (!user || !course) return { ok: false, error: "User or course not found" };

    // Retry up to 3 times in the very unlikely event of a serial collision
    for (let attempt = 0; attempt < 3; attempt++) {
      const serialNumber = generateSerialNumber();
      try {
        const created = await db.certificate.create({
          data: {
            serialNumber,
            userId: opts.userId,
            courseId: opts.courseId,
            studentName: user.name ?? user.email,
            studentEmail: user.email,
            courseTitle: course.title,
            instructorName: course.instructor.name ?? "JissrON",
          },
          select: { serialNumber: true },
        });
        return { ok: true, serialNumber: created.serialNumber, issued: true };
      } catch (err) {
        const errCode = (err as { code?: string })?.code;
        if (errCode === "P2002") {
          // Could be the serial collided, or the (userId, courseId) unique
          // fired because another concurrent call beat us. Try once more —
          // findUnique will catch the latter on next iteration.
          const reread = await db.certificate.findUnique({
            where: { userId_courseId: { userId: opts.userId, courseId: opts.courseId } },
            select: { serialNumber: true },
          });
          if (reread) return { ok: true, serialNumber: reread.serialNumber, issued: false };
          continue;
        }
        throw err;
      }
    }
    return { ok: false, error: "Failed to allocate a unique serial number" };
  } catch (err) {
    console.error("[issueCertificate]", err);
    return { ok: false, error: "Failed to issue certificate" };
  }
}
