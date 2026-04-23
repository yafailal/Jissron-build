import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { checkEnrollment } from "@/lib/data/enrollments";

// Phase 6.6 will consume this — called before rendering the lesson viewer
export async function requireEnrollment(courseSlug: string, courseId: string): Promise<void> {
  const session = await auth();
  if (!session) {
    redirect(`/signin?callbackUrl=/courses/${courseSlug}/learn`);
  }

  const enrolled = await checkEnrollment(session.user.id, courseId);
  if (!enrolled) {
    redirect(`/courses/${courseSlug}`);
  }
}
