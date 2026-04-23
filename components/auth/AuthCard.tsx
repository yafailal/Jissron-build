"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";

// ─── Loading-aware submit buttons ────────────────────────────────────────────

function EmailSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="
        w-full h-11 rounded-lg bg-primary text-white font-bold text-sm
        tracking-wide transition-all duration-200
        hover:bg-primary-hover hover:-translate-y-px hover:shadow-btn
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-bright focus-visible:ring-offset-2
        disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none
      "
    >
      {pending ? "Sending link…" : "Send magic link"}
    </button>
  );
}

function OAuthSubmitButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="
        w-full h-11 rounded-lg border-[1.5px] border-line-strong text-ink font-semibold text-sm
        flex items-center justify-center gap-3 transition-all duration-200
        hover:border-primary hover:text-primary hover:bg-primary/5 hover:-translate-y-px
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-bright focus-visible:ring-offset-2
        disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none
      "
    >
      {pending ? "Redirecting…" : <>{icon}{label}</>}
    </button>
  );
}

// ─── Provider icons ───────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
      <rect width="24" height="24" rx="4" fill="#0A66C2"/>
      <path d="M8 10H6v8h2v-8zm-1-3a1.25 1.25 0 110 2.5A1.25 1.25 0 017 7zm4 3h-2v8h2v-4c0-1.1.9-2 2-2s2 .9 2 2v4h2v-4.5c0-1.93-1.57-3.5-3.5-3.5-.72 0-1.39.22-1.95.6L13 10z" fill="#fff"/>
    </svg>
  );
}

// ─── Divider ─────────────────────────────────────────────────────────────────

function Divider() {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="flex-1 h-px bg-line" />
      <span className="text-xs font-500 text-muted">or</span>
      <div className="flex-1 h-px bg-line" />
    </div>
  );
}

// ─── JissrON wordmark ─────────────────────────────────────────────────────────

function Wordmark() {
  return (
    <div className="flex items-center gap-2 mb-7">
      <svg width="32" height="32" viewBox="0 0 36 36" aria-hidden="true" className="shrink-0">
        <path
          d="M 7 9 Q 7 7 9 7 L 13 7 Q 22 7 22 16 L 22 28 L 16 28 L 16 16 Q 16 13 13 13 L 9 13 L 9 28 L 7 28 Z"
          fill="#003d80"
        />
        <circle cx="26" cy="26" r="3" fill="#0058b8" />
      </svg>
      <span className="text-2xl font-700 tracking-tight leading-none">
        <span className="text-primary">J</span>
        <span className="text-primary-bright">issrO</span>
        <span className="text-primary">N</span>
      </span>
    </div>
  );
}

// ─── Main card ───────────────────────────────────────────────────────────────

interface AuthCardProps {
  heading: string;
  subheading: string;
  emailAction?: (formData: FormData) => Promise<void>;
  googleAction?: () => Promise<void>;
  linkedInAction?: () => Promise<void>;
  switchText: string;
  switchHref: string;
  switchLabel: string;
}

export function AuthCard({
  heading,
  subheading,
  emailAction,
  googleAction,
  linkedInAction,
  switchText,
  switchHref,
  switchLabel,
}: AuthCardProps) {
  const hasOAuth = googleAction || linkedInAction;

  return (
    <div className="bg-white rounded-2xl border border-line shadow-card w-full max-w-sm p-8">
      <Wordmark />

      <h1 className="text-[22px] font-800 text-ink leading-snug mb-1">{heading}</h1>
      <p className="text-sm text-muted mb-6 font-500">{subheading}</p>

      {/* OAuth providers */}
      {googleAction && (
        <form action={googleAction} className="mb-3">
          <OAuthSubmitButton icon={<GoogleIcon />} label="Continue with Google" />
        </form>
      )}
      {linkedInAction && (
        <form action={linkedInAction} className="mb-3">
          <OAuthSubmitButton icon={<LinkedInIcon />} label="Continue with LinkedIn" />
        </form>
      )}

      {/* Divider between OAuth and email */}
      {hasOAuth && emailAction && <Divider />}

      {/* Email magic-link */}
      {emailAction && (
        <form action={emailAction} className="space-y-3">
          <div>
            <label htmlFor="email" className="sr-only">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="
                w-full h-11 px-4 rounded-full border-[1.5px] border-line-strong
                text-sm text-ink font-500 bg-bg-soft
                placeholder:text-muted
                transition-all duration-200
                focus:outline-none focus:border-primary-bright focus:bg-white
                focus:ring-3 focus:ring-[rgba(0,88,184,0.18)]
              "
            />
          </div>
          <EmailSubmitButton />
        </form>
      )}

      {/* Sign-in / Sign-up switch */}
      <p className="mt-5 text-center text-[12px] text-muted">
        {switchText}{" "}
        <Link href={switchHref} className="text-primary font-600 hover:underline">
          {switchLabel}
        </Link>
      </p>

      <p className="mt-3 text-center text-[11px] text-muted leading-relaxed">
        By continuing, you agree to our{" "}
        <a href="/terms" className="text-primary hover:underline font-600">Terms</a>{" "}
        and{" "}
        <a href="/privacy" className="text-primary hover:underline font-600">Privacy Policy</a>.
      </p>
    </div>
  );
}
