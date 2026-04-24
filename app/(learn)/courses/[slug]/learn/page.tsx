import { notFound, redirect } from "next/navigation";
import { Trophy } from "lucide-react";
import { auth } from "@/lib/auth";
import { requireEnrollment } from "@/lib/auth/access";
import { getCourseLearnData } from "@/lib/data/courses";
import { tryGenerateBunnyEmbedUrl } from "@/lib/bunny";
import { LearnTopBar } from "@/components/learn/LearnTopBar";
import { LearnShell } from "@/components/learn/LearnShell";
import { LessonNavBar } from "@/components/learn/LessonNavBar";
import { VideoLesson } from "@/components/learn/lesson-types/VideoLesson";
import { AudioLesson } from "@/components/learn/lesson-types/AudioLesson";
import { PdfLesson } from "@/components/learn/lesson-types/PdfLesson";
import { HtmlLesson } from "@/components/learn/lesson-types/HtmlLesson";
import { TextLesson } from "@/components/learn/lesson-types/TextLesson";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lessonId?: string }>;
}

const TYPE_BADGE: Record<string, string> = {
  VIDEO: "Video",
  AUDIO: "Audio",
  PDF: "PDF",
  HTML: "Article",
  TEXT: "Text",
  QUIZ: "Quiz",
  ASSIGNMENT: "Assignment",
};

function fmtDuration(secs: number) {
  if (!secs) return null;
  const m = Math.floor(secs / 60);
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const rm = m % 60;
    return `${h}h${rm > 0 ? ` ${rm}m` : ""}`;
  }
  return `${m} min`;
}

export default async function LearnPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { lessonId: requestedLessonId } = await searchParams;

  const session = await auth();
  if (!session) redirect(`/signin?callbackUrl=/courses/${slug}/learn`);

  const data = await getCourseLearnData(slug, session.user.id);
  if (!data) notFound();

  // requireEnrollment redirects to /courses/[slug] if not enrolled
  await requireEnrollment(slug, data.course.id);

  const allLessons = data.course.modules.flatMap((m) => m.lessons);

  // Resolve active lesson
  let activeLesson =
    requestedLessonId
      ? allLessons.find((l) => l.id === requestedLessonId) ?? null
      : null;

  if (!activeLesson) {
    const firstIncomplete = allLessons.find(
      (l) => !data.progressMap.get(l.id)?.completed
    );
    activeLesson = firstIncomplete ?? allLessons[0] ?? null;
  }

  if (!activeLesson) notFound();

  // Prev / next
  const activeLessonIndex = allLessons.findIndex((l) => l.id === activeLesson!.id);
  const prevLesson = activeLessonIndex > 0 ? allLessons[activeLessonIndex - 1] : null;
  const nextLesson = activeLessonIndex < allLessons.length - 1 ? allLessons[activeLessonIndex + 1] : null;

  const isCompleted = data.progressMap.get(activeLesson.id)?.completed ?? false;
  const watchedSecs = data.progressMap.get(activeLesson.id)?.watchedSecs ?? 0;
  const allComplete = data.completedCount === data.totalLessons && data.totalLessons > 0;

  // Build Bunny embed URL server-side (never exposes keys to client)
  const embedUrl = activeLesson.type === "VIDEO"
    ? tryGenerateBunnyEmbedUrl(activeLesson.videoGuid)
    : null;

  // Serialise progressMap for client (Map → plain object)
  const progressMapObj = Object.fromEntries(data.progressMap);

  const duration = fmtDuration(activeLesson.durationSeconds);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white">
      <LearnTopBar
        courseSlug={slug}
        courseTitle={data.course.title}
        progressPct={data.progressPct}
      />

      <LearnShell
        courseSlug={slug}
        modules={data.course.modules}
        progressMap={progressMapObj}
        activeLessonId={activeLesson.id}
        completedCount={data.completedCount}
        totalLessons={data.totalLessons}
      >
        {/* Congratulations banner when all lessons complete */}
        {allComplete && !requestedLessonId && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200 mb-6">
            <Trophy size={20} className="text-green-600 shrink-0" />
            <p className="text-[14px] font-700 text-green-800">
              Congratulations — you&apos;ve completed this course!
            </p>
          </div>
        )}

        {/* Lesson heading */}
        <div className="mb-6">
          <h1 className="text-2xl font-800 text-ink leading-snug mb-2">
            {activeLesson.title}
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-700 uppercase tracking-wide">
              {TYPE_BADGE[activeLesson.type] ?? activeLesson.type}
            </span>
            {duration && (
              <span className="text-[12px] text-muted font-500">· {duration}</span>
            )}
            {isCompleted && (
              <span className="inline-flex px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 text-[11px] font-700">
                ✓ Completed
              </span>
            )}
          </div>
        </div>

        {/* Lesson content */}
        {activeLesson.type === "VIDEO" && (
          <VideoLesson
            lessonId={activeLesson.id}
            videoGuid={activeLesson.videoGuid}
            videoUrl={activeLesson.videoUrl}
            embedUrl={embedUrl}
            durationSeconds={activeLesson.durationSeconds}
            initialWatchedSecs={watchedSecs}
          />
        )}
        {activeLesson.type === "AUDIO" && (
          <AudioLesson
            lessonId={activeLesson.id}
            audioUrl={activeLesson.audioUrl}
            durationSeconds={activeLesson.durationSeconds}
            initialWatchedSecs={watchedSecs}
          />
        )}
        {activeLesson.type === "PDF" && (
          <PdfLesson pdfUrl={activeLesson.pdfUrl} />
        )}
        {activeLesson.type === "HTML" && (
          <HtmlLesson htmlContent={activeLesson.htmlContent} />
        )}
        {activeLesson.type === "TEXT" && (
          <TextLesson textContent={activeLesson.textContent} />
        )}

        {/* Navigation bar */}
        <LessonNavBar
          courseSlug={slug}
          prevLessonId={prevLesson?.id ?? null}
          nextLessonId={nextLesson?.id ?? null}
          lessonId={activeLesson.id}
          isCompleted={isCompleted}
        />
      </LearnShell>
    </div>
  );
}
