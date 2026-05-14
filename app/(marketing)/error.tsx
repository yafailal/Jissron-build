"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Error boundary for the marketing/public segment. Prevents a single bad
 * data row from 500ing the whole site — instead we render a clean page
 * and offer the user a path forward.
 *
 * Server-side errors that bubble to here still get logged to Vercel by
 * Next.js; the `digest` is shown so we can match against the runtime log.
 */
export default function MarketingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Console too — handy in dev. Vercel still captures the server stack.
    console.error("[marketing error]", error);
  }, [error]);

  return (
    <main className="min-h-[60vh] grid place-items-center px-4 py-16 bg-bg-soft">
      <div className="max-w-md w-full bg-white border border-line rounded-xl p-8 text-center">
        <div className="w-12 h-12 mx-auto rounded-full bg-amber-50 border border-amber-200 grid place-items-center mb-4">
          <span className="text-amber-600 text-[20px]">!</span>
        </div>
        <h1 className="text-[18px] font-800 text-ink mb-2">Something went wrong</h1>
        <p className="text-[13px] text-muted leading-relaxed mb-5">
          We hit an unexpected error loading this page. Our team has been
          notified. Try again in a moment, or head back to safety.
        </p>
        <div className="flex gap-2 justify-center">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center h-9 px-4 rounded-md bg-primary text-white text-[12.5px] font-700 hover:bg-primary-hover transition-colors"
          >
            Try again
          </button>
          <Link
            href="/courses"
            className="inline-flex items-center h-9 px-4 rounded-md border border-line text-ink text-[12.5px] font-700 hover:bg-bg-soft transition-colors"
          >
            Browse courses
          </Link>
        </div>
        {error.digest && (
          <p className="text-[10.5px] text-muted/70 mt-5 font-mono">
            ref: {error.digest}
          </p>
        )}
      </div>
    </main>
  );
}
