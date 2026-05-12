"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Two mechanisms to keep auth state in sync across tabs:
// 1. Tab-focus listener — when the user comes back to a tab, refresh.
// 2. BroadcastChannel — when ANY tab signs in/out, all others refresh immediately.
//
// Calls router.refresh(), which re-runs React Server Components on the current
// route (cheap, no full reload).

const CHANNEL_NAME = "jissron-auth";

export function TabFocusRefresh() {
  const router = useRouter();

  useEffect(() => {
    const refresh = () => router.refresh();

    // 1. Focus-based refresh
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    // 2. Cross-tab broadcast
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.addEventListener("message", refresh);
    } catch {
      // BroadcastChannel not supported — fall back to storage events
    }

    // 3. Fallback storage event (older browsers / odd contexts)
    const onStorage = (e: StorageEvent) => {
      if (e.key === "jissron-auth-bump") refresh();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      window.removeEventListener("storage", onStorage);
      channel?.close();
    };
  }, [router]);

  return null;
}

// Call this after a sign-in or sign-out completes anywhere in the app to
// notify all other tabs immediately.
export function broadcastAuthChange() {
  try {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage({ type: "auth-changed", at: Date.now() });
    channel.close();
  } catch {
    // Fall back to localStorage to fire a 'storage' event in other tabs
    try {
      localStorage.setItem("jissron-auth-bump", String(Date.now()));
    } catch {
      // give up silently
    }
  }
}
