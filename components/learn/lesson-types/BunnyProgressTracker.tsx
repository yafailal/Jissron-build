"use client";

import { useEffect, useRef, useCallback } from "react";
import { updateLessonProgress } from "@/lib/actions/progress";

// Bunny Stream player postMessage events
// Ref: https://docs.bunny.net/docs/stream-embedding-videos-player-events
interface BunnyPlayerEvent {
  event?: string;
  currentTime?: number;
  duration?: number;
  // Bunny sends events nested under a "data" key in some versions
  data?: {
    event?: string;
    currentTime?: number;
    duration?: number;
  };
}

interface BunnyProgressTrackerProps {
  lessonId: string;
  initialWatchedSecs: number;
  durationSeconds: number;
}

const SAVE_INTERVAL_SECS = 10;

export function BunnyProgressTracker({
  lessonId,
  initialWatchedSecs,
  durationSeconds,
}: BunnyProgressTrackerProps) {
  const lastSavedAtRef = useRef<number>(0);
  const currentTimeRef = useRef<number>(initialWatchedSecs);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveProgress = useCallback(
    async (secs: number) => {
      const now = Date.now();
      if (now - lastSavedAtRef.current < SAVE_INTERVAL_SECS * 1000) return;
      lastSavedAtRef.current = now;
      await updateLessonProgress(lessonId, Math.floor(secs));
    },
    [lessonId]
  );

  const saveNow = useCallback(
    async (secs: number) => {
      lastSavedAtRef.current = 0; // force save regardless of debounce
      await updateLessonProgress(lessonId, Math.floor(secs));
      lastSavedAtRef.current = Date.now();
    },
    [lessonId]
  );

  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      // Accept messages from any iframe origin (Bunny CDN varies by library)
      let payload: BunnyPlayerEvent | null = null;
      try {
        if (typeof e.data === "string") {
          payload = JSON.parse(e.data) as BunnyPlayerEvent;
        } else if (typeof e.data === "object") {
          payload = e.data as BunnyPlayerEvent;
        }
      } catch {
        return;
      }

      if (!payload) return;

      // Normalise — Bunny wraps events in a "data" key in newer player versions
      const event = payload.event ?? payload.data?.event;
      const currentTime = payload.currentTime ?? payload.data?.currentTime;

      if (currentTime !== undefined) {
        currentTimeRef.current = currentTime;
      }

      switch (event) {
        case "timeupdate":
          if (currentTime !== undefined) {
            saveProgress(currentTime);
          }
          break;
        case "pause":
        case "ended":
          if (currentTime !== undefined) {
            saveNow(currentTime);
          }
          break;
      }
    }

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
      // Save on unmount (lesson change / page close)
      if (currentTimeRef.current > 0) {
        updateLessonProgress(lessonId, Math.floor(currentTimeRef.current));
      }
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [lessonId, saveProgress, saveNow]);

  // This component renders nothing — it's a side-effect-only tracker
  return null;
}
