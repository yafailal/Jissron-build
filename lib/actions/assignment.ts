"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { sendCourseCompleted } from "@/lib/emails/senders";
import { issueCertificate } from "@/lib/actions/certificates";

type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

export async function submitAssignment(
  assignmentId: string,
  fileUrl: string,
  fileName: string
): Promise<ActionResult<{ submissionId: string }>> {
  const session = await auth();
  if (!session) return { ok: false, error: "Unauthorized" };

  const assignment = await db.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      lesson: { include: { module: { include: { course: { select: { id: true, slug: true } } } } } },
    },
  });
  if (!assignment) return { ok: false, error: "Assignment not found" };
  if (!assignment.lesson) return { ok: false, error: "Assignment not attached to a lesson" };

  const courseId = assignment.lesson.module.course.id;
  const courseSlug = assignment.lesson.module.course.slug;

  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId } },
    select: { id: true },
  });
  if (!enrollment) return { ok: false, error: "Not enrolled" };

  // Mark lesson as "submitted" (use LessonProgress completed=false; the AssignmentSubmission
  // tracks the actual state). Final completed=true only once admin grades and student passes.
  const submission = await db.assignmentSubmission.create({
    data: {
      assignmentId,
      userId: session.user.id,
      fileUrl,
      fileName,
      status: "SUBMITTED",
    },
  });

  revalidatePath(`/courses/${courseSlug}/learn`);
  revalidatePath("/admin/grading");
  return { ok: true, data: { submissionId: submission.id } };
}

export async function gradeAssignmentSubmission(
  submissionId: string,
  grade: number,
  feedback: string
): Promise<ActionResult> {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") return { ok: false, error: "Unauthorized" };

  const submission = await db.assignmentSubmission.findUnique({
    where: { id: submissionId },
    include: {
      assignment: {
        include: {
          lesson: {
            include: { module: { include: { course: { select: { id: true, slug: true, title: true } } } } },
          },
        },
      },
      user: { select: { id: true, email: true, name: true } },
    },
  });
  if (!submission) return { ok: false, error: "Submission not found" };
  if (!submission.assignment.lesson) return { ok: false, error: "Assignment no longer attached to a lesson" };

  const passed = grade >= submission.assignment.passingGrade;
  const newStatus = passed ? "PASSED" : "FAILED";

  await db.assignmentSubmission.update({
    where: { id: submissionId },
    data: {
      grade,
      feedback,
      gradedAt: new Date(),
      gradedBy: session.user.id,
      status: newStatus,
    },
  });

  if (passed) {
    const courseId = submission.assignment.lesson.module.course.id;
    const lessonId = submission.assignment.lesson.id;
    const enrollment = await db.enrollment.findUnique({
      where: { userId_courseId: { userId: submission.userId, courseId } },
      select: { id: true, completedAt: true },
    });
    if (enrollment) {
      await db.lessonProgress.upsert({
        where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId } },
        create: { enrollmentId: enrollment.id, lessonId, completed: true },
        update: { completed: true },
      });

      if (!enrollment.completedAt) {
        const [totalLessons, completedLessons] = await Promise.all([
          db.lesson.count({ where: { module: { courseId } } }),
          db.lessonProgress.count({
            where: { enrollmentId: enrollment.id, completed: true },
          }),
        ]);
        if (totalLessons > 0 && completedLessons >= totalLessons) {
          const updated = await db.enrollment.updateMany({
            where: { id: enrollment.id, completedAt: null },
            data: { completedAt: new Date() },
          });
          if (updated.count > 0) {
            if (submission.user.email) {
              sendCourseCompleted({
                to: submission.user.email,
                userName: submission.user.name?.split(" ")[0] ?? "there",
                courseTitle: submission.assignment.lesson.module.course.title,
                courseSlug: submission.assignment.lesson.module.course.slug,
              }).catch((err) => console.error("[course-completed-email]", err));
            }
            issueCertificate({ userId: submission.userId, courseId }).catch(
              (err) => console.error("[issue-certificate]", err)
            );
          }
        }
      }
    }
  }

  revalidatePath("/admin/grading");
  return { ok: true };
}
