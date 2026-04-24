"use client";

import { useEffect, useRef, useCallback, type RefObject } from "react";
import { updateLessonProgress } from "@/lib/actions/progress";

// Phase 7: This component is not currently rendered — auto-progress tracking was
// deferred after confirming Bunny's subscription protocol (postMessage back to
// iframe.contentWindow after "ready") but needing further validation against
// the actual player.js source. The subscription logic is preserved here.
// See docs/07-style-notes.md for full context.

// Bunny Stream player postMessage events
// Ref: https://docs.bunny.net/docs/stream-embedding-videos-player-events
// Actual shape observed: { context: "player.js", version: "...", event: string, value: number | object }
// For "timeupdate": value is currentTime in seconds (number)
// For "ready": value is { src, events, methods } — fire subscriptions here
interface BunnyPlayerEvent {
  context?: string;
  event?: string;
  value?: number | Record<string, unknown>;
}

interface BunnyProgressTrackerProps {
  lessonId: string;
  iframeRef: RefObject<HTMLIFrameElement | null>;
  initialWatchedSecs: number;
  durationSeconds: number;
}

const SAVE_INTERVAL_SECS = 10;
const BUNNY_ORIGIN = "https://iframe.mediadelivery.net";
const SUBSCRIBE_EVENTS = ["timeupdate", "pause", "ended", "seeked"] as const;

export function BunnyProgressTracker({
  lessonId,
  iframeRef,
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

      if (!payload || payload.context !== "player.js") return;

      const eventName = payload.event;
      const value = typeof payload.value === "number" && payload.value >= 0
        ? payload.value
        : null;

      if (value !== null) {
        currentTimeRef.current = value;
      }

      switch (eventName) {
        case "ready":
          // Subscribe to playback events after player signals it's ready
          SUBSCRIBE_EVENTS.forEach((evt) => {
            iframeRef.current?.contentWindow?.postMessage(
              { context: "player.js", method: "addEventListener", value: evt },
              BUNNY_ORIGIN
            );
          });
          break;
        case "timeupdate":
          if (value !== null) {
            saveProgress(value);
          }
          break;
        case "pause":
        case "ended":
          if (value !== null) {
            saveNow(value);
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
  }, [lessonId, iframeRef, saveProgress, saveNow]);

  // Side-effect-only — renders nothing
  return null;
}
