"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { CheckCircle2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

// ── Inline useMediaQuery (no extra dependency) ────────────────────────────────

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

// ── Provider icons ────────────────────────────────────────────────────────────

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

// ── Shared modal content ──────────────────────────────────────────────────────

type Mode = "signin" | "signup" | "check-email";

interface ModalContentProps {
  onClose: () => void;
  title?: string;
  subtitle?: string;
  warning?: string;
}

function ModalContent({ onClose, title, subtitle, warning }: ModalContentProps) {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [googlePending, setGooglePending] = useState(false);
  const [linkedInPending, setLinkedInPending] = useState(false);
  const [emailPending, setEmailPending] = useState(false);

  const hasGoogle = typeof window !== "undefined"
    ? document.querySelector('meta[name="x-has-google"]')?.getAttribute("content") === "true"
    : false;

  // We always render OAuth buttons — NextAuth will handle missing provider gracefully.
  // Buttons are shown unconditionally; if provider isn't configured, signIn returns an error.

  async function handleGoogle() {
    setGooglePending(true);
    await signIn("google", { callbackUrl: window.location.href });
    // browser navigates away — no cleanup needed
  }

  async function handleLinkedIn() {
    setLinkedInPending(true);
    await signIn("linkedin", { callbackUrl: window.location.href });
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setEmailError(null);
    setEmailPending(true);
    try {
      const result = await signIn("resend", { email, redirect: false });
      if (result?.error) {
        setEmailError("Something went wrong. Please try again.");
      } else {
        setMode("check-email");
      }
    } catch {
      setEmailError("Something went wrong. Please try again.");
    } finally {
      setEmailPending(false);
    }
  }

  // ── Check-email state ─────────────────────────────────────────────────────

  if (mode === "check-email") {
    return (
      <div className="flex flex-col items-center text-center py-4 px-2">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-5">
          <CheckCircle2 size={28} className="text-primary" strokeWidth={1.75} />
        </div>
        <h2
          className="text-2xl font-700 text-ink mb-2"
          style={{ fontFamily: "var(--font-crimson), Georgia, serif", fontStyle: "italic" }}
        >
          Check your inbox.
        </h2>
        <p className="text-sm text-muted font-500 mb-1 max-w-xs">
          We sent a magic link to
        </p>
        <p className="text-sm font-700 text-ink mb-7 break-all">{email}</p>
        <p className="text-xs text-muted font-500 mb-6 max-w-xs">
          Click the link in the email to sign in. You can close this window.
        </p>
        <button
          onClick={onClose}
          className="h-10 px-6 rounded-lg border border-line text-sm font-600 text-ink hover:border-primary/40 hover:text-primary transition-colors"
        >
          Close
        </button>
      </div>
    );
  }

  // ── Sign in / Sign up state ───────────────────────────────────────────────

  return (
    <div>
      {/* Heading */}
      <h2
        className="text-2xl sm:text-3xl font-700 text-ink mb-1"
        style={{ fontFamily: "var(--font-crimson), Georgia, serif", fontStyle: "italic" }}
      >
        {title ?? (mode === "signin" ? "Welcome back." : "Join JissrON.")}
      </h2>
      <p className="text-sm text-muted font-500 mb-3">
        {subtitle ??
          (mode === "signin"
            ? "Sign in to your account to continue."
            : "Create an account to start learning.")}
      </p>
      {warning && (
        <p className="text-[12px] font-600 text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-4">
          {warning}
        </p>
      )}

      {/* OAuth buttons */}
      <div className="space-y-3 mb-1">
        <button
          onClick={handleGoogle}
          disabled={googlePending || linkedInPending || emailPending}
          className="w-full h-11 rounded-lg border-[1.5px] border-line-strong text-ink font-600 text-sm flex items-center justify-center gap-3 transition-all duration-200 hover:border-primary hover:text-primary hover:bg-primary/5 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {googlePending ? (
            <><Loader2 size={16} className="animate-spin" /> Redirecting…</>
          ) : (
            <><GoogleIcon /> Continue with Google</>
          )}
        </button>

        <button
          onClick={handleLinkedIn}
          disabled={googlePending || linkedInPending || emailPending}
          className="w-full h-11 rounded-lg border-[1.5px] border-line-strong text-ink font-600 text-sm flex items-center justify-center gap-3 transition-all duration-200 hover:border-primary hover:text-primary hover:bg-primary/5 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {linkedInPending ? (
            <><Loader2 size={16} className="animate-spin" /> Redirecting…</>
          ) : (
            <><LinkedInIcon /> Continue with LinkedIn</>
          )}
        </button>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-line" />
        <span className="text-xs font-500 text-muted">or continue with email</span>
        <div className="flex-1 h-px bg-line" />
      </div>

      {/* Magic link form */}
      <form onSubmit={handleMagicLink} className="space-y-3">
        <div>
          <label htmlFor="modal-email" className="sr-only">Email address</label>
          <input
            id="modal-email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setEmailError(null); }}
            disabled={emailPending}
            className="w-full h-11 px-4 rounded-full border-[1.5px] border-line-strong text-sm text-ink font-500 bg-bg-soft placeholder:text-muted transition-all duration-200 focus:outline-none focus:border-primary-bright focus:bg-white focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
          />
          {emailError && (
            <p className="mt-1.5 text-xs text-red-500 font-500">{emailError}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={emailPending || googlePending || linkedInPending}
          className="w-full h-11 rounded-lg bg-primary text-white font-700 text-sm flex items-center justify-center gap-2 transition-all duration-200 hover:bg-primary-hover disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {emailPending ? (
            <><Loader2 size={16} className="animate-spin" /> Sending link…</>
          ) : (
            "Send magic link"
          )}
        </button>
      </form>

      {/* Mode toggle */}
      <p className="mt-5 text-center text-[12px] text-muted">
        {mode === "signin" ? (
          <>Don&apos;t have an account?{" "}
            <button onClick={() => setMode("signup")} className="text-primary font-600 hover:underline">
              Sign up
            </button>
          </>
        ) : (
          <>Already have an account?{" "}
            <button onClick={() => setMode("signin")} className="text-primary font-600 hover:underline">
              Sign in
            </button>
          </>
        )}
      </p>

      <p className="mt-3 text-center text-[11px] text-muted leading-relaxed">
        By continuing, you agree to our{" "}
        <a href="/terms" className="text-primary font-600 hover:underline">Terms</a>{" "}
        and{" "}
        <a href="/privacy" className="text-primary font-600 hover:underline">Privacy Policy</a>.
      </p>
    </div>
  );
}

// ── Root export: Dialog on desktop, Drawer on mobile ─────────────────────────

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  warning?: string;
}

export function SignInModal({ isOpen, onClose, title, subtitle, warning }: SignInModalProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-md p-8" aria-label={title ?? "Sign in to JissrON"}>
          <DialogHeader className="mb-0 space-y-0">
            <DialogTitle className="sr-only">{title ?? "Sign in to JissrON"}</DialogTitle>
          </DialogHeader>
          <ModalContent onClose={onClose} title={title} subtitle={subtitle} warning={warning} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="px-6 pb-8 pt-2">
        <DrawerHeader className="mb-4 px-0">
          <DrawerTitle className="sr-only">{title ?? "Sign in to JissrON"}</DrawerTitle>
        </DrawerHeader>
        <ModalContent onClose={onClose} title={title} subtitle={subtitle} warning={warning} />
      </DrawerContent>
    </Drawer>
  );
}
