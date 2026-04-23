import { MailCheck } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Check your email" };

export default function VerifyRequestPage() {
  return (
    <main
      id="main-content"
      className="min-h-screen grid place-items-center bg-bg-soft px-4 py-16"
    >
      <div className="bg-white rounded-2xl border border-line shadow-card w-full max-w-sm p-8 text-center">
        <div className="mx-auto mb-5 w-14 h-14 rounded-full bg-primary-soft grid place-items-center">
          <MailCheck className="text-primary" size={26} strokeWidth={2} />
        </div>

        <h1 className="text-[22px] font-800 text-ink leading-snug mb-2">
          Check your email
        </h1>
        <p className="text-sm text-muted font-500 leading-relaxed mb-6">
          We sent a sign-in link to your email address. Click it to finish
          signing in — it expires in 15 minutes.
        </p>

        <div className="text-left bg-primary-softer rounded-xl p-4 mb-6 space-y-2">
          <p className="text-xs font-700 text-primary-hover uppercase tracking-wide mb-2">
            Didn&apos;t get the email?
          </p>
          <ul className="text-xs text-body-text font-500 space-y-1 list-none">
            <li className="flex gap-2">
              <span className="text-primary shrink-0">·</span>
              Check your spam or junk folder
            </li>
            <li className="flex gap-2">
              <span className="text-primary shrink-0">·</span>
              Make sure you entered the right address
            </li>
            <li className="flex gap-2">
              <span className="text-primary shrink-0">·</span>
              Links come from <strong>onboarding@resend.dev</strong> — add to
              safe senders if blocked
            </li>
          </ul>
        </div>

        <Link
          href="/signin"
          className="
            inline-flex items-center justify-center w-full h-11
            rounded-lg border-[1.5px] border-primary text-primary
            font-semibold text-sm transition-all duration-200
            hover:bg-primary hover:text-white hover:-translate-y-px
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-bright focus-visible:ring-offset-2
          "
        >
          ← Try a different email
        </Link>
      </div>
    </main>
  );
}
