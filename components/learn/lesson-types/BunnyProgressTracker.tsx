"use client";

import { useEffect, useRef, useCallback, type RefObject } from "react";
import { updateLessonProgress } from "@/lib/actions/progress";

// Bunny Stream player postMessage events — based on Embed.ly player.js v0.0.11
// Ref: https://docs.bunny.net/docs/stream-embedding-videos-player-events
//
// Subscription protocol (confirmed from player.js source):
//   After "ready", post JSON.stringify({ context, method: "addEventListener", value: eventName, listener: UUID })
//   to iframe.contentWindow. Bunny's Receiver stores the listener and emits events back.
//
// timeupdate payload: { context, event: "timeupdate", value: { seconds: number, duration: number } }
// pause/ended payload: { context, event: "pause"|"ended" }  — NO value field
//
// Phase 7: component was temporarily disabled in Phase 6.6 while diagnosing the subscription
// protocol. Re-enabled once root causes were confirmed from source.

interface BunnyPlayerEvent {
  context?: string;
  event?: string;
  value?: { seconds?: number; duration?: number } | number | Record<string, unknown>;
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

function makeListenerId() {
  return "listener-" + Math.random().toString(36).slice(2).padEnd(24, "0");
}

export function BunnyProgressTracker({
  lessonId,
  iframeRef,
  initialWatchedSecs,
  durationSeconds: _durationSeconds, // reserved for Phase 7 auto-complete threshold
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

      switch (eventName) {
        case "ready":
          // Subscribe to playback events — must send as JSON string with listener UUID
          // per player.js v0.0.11 protocol (confirmed from source)
          SUBSCRIBE_EVENTS.forEach((evt) => {
            iframeRef.current?.contentWindow?.postMessage(
              JSON.stringify({
                context: "player.js",
                method: "addEventListener",
                value: evt,
                listener: makeListenerId(),
              }),
              BUNNY_ORIGIN
            );
          });
          break;

        case "timeupdate": {
          // value is { seconds: number, duration: number } — NOT a plain number
          const v = payload.value;
          const timeupdateSecs =
            typeof v === "object" && v !== null && "seconds" in v && typeof v.seconds === "number"
              ? v.seconds
              : null;

          if (timeupdateSecs !== null) {
            currentTimeRef.current = timeupdateSecs;
            saveProgress(timeupdateSecs);
          }
          break;
        }

        case "pause":
        case "ended":
          // No value in payload for these events — use tracked currentTime
          saveNow(currentTimeRef.current);
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
