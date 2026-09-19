"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { type Currency, formatPrice } from "@/lib/currency";
import { enrollInFreeCourse } from "@/lib/actions/enrollment";
import { createBankTransferOrder } from "@/lib/actions/orders";
import { createCmiOrder } from "@/lib/actions/cmi";
import { createStripeCheckout } from "@/lib/actions/stripe";
import { useSignInModal } from "@/context/sign-in-modal-context";
import { cn } from "@/lib/utils";

interface Props {
  course: {
    id: string;
    slug: string;
    priceMadCents: number;
    priceUsdCents: number;
    stripePriceId: string | null;
  };
  currency: Currency;
  enrollmentStatus: "enrolled" | "not-enrolled" | "not-authed";
  progressPct?: number;
  stripeConfigured?: boolean;
  cmiConfigured?: boolean;
  /** "light" (default) = dark pill on light bg. "dark" = light pill on dark bg. */
  variant?: "light" | "dark";
}

export function CourseEnrollButton({
  course,
  currency,
  enrollmentStatus,
  progressPct = 0,
  stripeConfigured = false,
  cmiConfigured = false,
  variant = "light",
}: Props) {
  const router = useRouter();
  const { open: openSignInModal } = useSignInModal();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [buyPending, startBuy] = useTransition();
  const [stripePending, startStripe] = useTransition();
  const [cmiPending, startCmi] = useTransition();

  const isFree = course.priceMadCents === 0 && course.priceUsdCents === 0;
  const price = formatPrice(course.priceMadCents, course.priceUsdCents, currency);
  const usdAvailable = stripeConfigured && !!course.stripePriceId;

  const baseClass =
    variant === "dark"
      ? "inline-flex items-center justify-center gap-2 h-12 px-7 rounded-full bg-white text-ink font-700 text-[12px] tracking-wider uppercase hover:bg-white/90 transition-colors w-full"
      : "inline-flex items-center justify-center gap-2 h-11 px-6 rounded-full bg-ink text-white font-700 text-[12px] tracking-wider uppercase hover:bg-ink/90 transition-colors";

  async function handleFreeEnroll() {
    setPending(true);
    setError(null);
    const result = await enrollInFreeCourse(course.id);
    if (result && !result.ok) {
      setError(result.error);
      setPending(false);
    }
  }

  function label() {
    if (enrollmentStatus === "enrolled") {
      return progressPct === 0 ? "Start learning" :
        progressPct < 100 ? "Resume learning" :
        "Continue learning";
    }
    if (enrollmentStatus === "not-authed") return "Sign in to enroll";
    if (isFree) return "Enroll for free";
    if (variant === "dark") return `Enroll for ${price}`;
    return "Enroll";
  }

  function onClick() {
    if (enrollmentStatus === "not-authed") {
      openSignInModal();
      return;
    }
    if (isFree) {
      handleFreeEnroll();
      return;
    }
    if (currency === "MAD") {
      // Prefer CMI (instant card payment) when configured. Bank-transfer fallback
      // is still available via /checkout/[orderId] for the same order if needed.
      if (cmiConfigured) {
        startCmi(async () => {
          setError(null);
          const result = await createCmiOrder(course.id);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          router.push(`/checkout/cmi/${result.orderId}`);
        });
        return;
      }
      startBuy(async () => {
        const result = await createBankTransferOrder(course.id);
        if (result && !result.ok) setError(result.error);
      });
      return;
    }
    if (usdAvailable) {
      startStripe(async () => {
        setError(null);
        const result = await createStripeCheckout(course.id);
        if (result.ok) {
          window.location.href = result.checkoutUrl;
        } else {
          setError(result.error);
        }
      });
      return;
    }
    setError("Payments not yet configured for this currency");
  }

  const busy = pending || buyPending || stripePending || cmiPending;

  // Enrolled → direct link, no action needed
  if (enrollmentStatus === "enrolled") {
    return (
      <>
        <Link href={`/courses/${course.slug}/learn`} className={cn(baseClass)}>
          {label()}
          <ArrowRight size={14} />
        </Link>
        {error && <p className={cn("text-xs mt-1.5", variant === "dark" ? "text-red-300" : "text-red-500")}>{error}</p>}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        className={cn(baseClass, busy && "opacity-60 cursor-not-allowed")}
      >
        {busy ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
        {busy ? "Working…" : label()}
      </button>
      {error && <p className={cn("text-xs mt-1.5 text-center", variant === "dark" ? "text-red-300" : "text-red-500")}>{error}</p>}
    </>
  );
}
