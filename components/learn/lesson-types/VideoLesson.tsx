import { AlertCircle } from "lucide-react";
import { BunnyProgressTracker } from "./BunnyProgressTracker";

interface VideoLessonProps {
  lessonId: string;
  videoGuid: string | null;
  videoUrl: string | null;       // legacy fallback
  embedUrl: string | null;       // pre-generated server-side (null if no videoGuid)
  durationSeconds: number;
  initialWatchedSecs: number;
}

export function VideoLesson({
  lessonId,
  videoGuid,
  videoUrl,
  embedUrl,
  durationSeconds,
  initialWatchedSecs,
}: VideoLessonProps) {
  // Prefer signed embed URL (videoGuid path), fall back to raw videoUrl
  const src = embedUrl ?? videoUrl;

  if (!src) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <AlertCircle size={32} className="text-muted/40" />
        <p className="text-[14px] font-600 text-ink">Video not yet available</p>
        <p className="text-[13px] text-muted font-500">Check back soon — the instructor is still uploading this lesson.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 16:9 iframe wrapper */}
      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        <iframe
          src={src}
          className="absolute inset-0 w-full h-full rounded-xl overflow-hidden"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          loading="lazy"
          title="Video lesson"
        />
      </div>

      {/* Progress tracking — postMessage listener, saves every 10s */}
      {videoGuid && (
        <BunnyProgressTracker
          lessonId={lessonId}
          initialWatchedSecs={initialWatchedSecs}
          durationSeconds={durationSeconds}
        />
      )}
    </div>
  );
}
