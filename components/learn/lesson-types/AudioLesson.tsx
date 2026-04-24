"use client";

import { useRef, useCallback } from "react";
import { AlertCircle } from "lucide-react";
import { updateLessonProgress } from "@/lib/actions/progress";

interface AudioLessonProps {
  lessonId: string;
  audioUrl: string | null;
  durationSeconds: number;
  initialWatchedSecs: number;
}

const SAVE_INTERVAL_SECS = 10;

export function AudioLesson({ lessonId, audioUrl, durationSeconds, initialWatchedSecs }: AudioLessonProps) {
  const lastSavedAtRef = useRef<number>(0);

  const handleTimeUpdate = useCallback(
    async (e: React.SyntheticEvent<HTMLAudioElement>) => {
      const currentTime = e.currentTarget.currentTime;
      const now = Date.now();
      if (now - lastSavedAtRef.current < SAVE_INTERVAL_SECS * 1000) return;
      lastSavedAtRef.current = now;
      await updateLessonProgress(lessonId, Math.floor(currentTime));
    },
    [lessonId]
  );

  const handlePause = useCallback(
    async (e: React.SyntheticEvent<HTMLAudioElement>) => {
      lastSavedAtRef.current = 0;
      await updateLessonProgress(lessonId, Math.floor(e.currentTarget.currentTime));
      lastSavedAtRef.current = Date.now();
    },
    [lessonId]
  );

  if (!audioUrl) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <AlertCircle size={32} className="text-muted/40" />
        <p className="text-[14px] font-600 text-ink">Audio not yet available</p>
        <p className="text-[13px] text-muted font-500">Check back soon.</p>
      </div>
    );
  }

  return (
    <div className="py-8 flex flex-col items-center gap-6">
      <div className="w-24 h-24 rounded-full bg-primary/10 grid place-items-center">
        <svg viewBox="0 0 24 24" className="w-10 h-10 text-primary fill-current" aria-hidden="true">
          <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6Z" />
        </svg>
      </div>
      <audio
        controls
        src={audioUrl}
        className="w-full max-w-lg"
        onTimeUpdate={handleTimeUpdate}
        onPause={handlePause}
        onEnded={handlePause}
      />
    </div>
  );
}
