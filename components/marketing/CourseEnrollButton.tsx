"use client";

import { Link } from "@/i18n/navigation";
import { useRouter } from "@/i18n/navigation";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("CourseDetail");
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
      ? "inline-flex items-center justify-center gap-2 h-11 px-6 rounded-full bg-white text-primary font-bold text-[13px] hover:bg-primary-soft transition-colors w-full"
      : "inline-flex items-center justify-center gap-2 h-11 px-6 rounded-full bg-primary text-white font-bold text-[13px] hover:bg-primary-hover transition-colors";

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
      return progressPct === 0 ? t("enroll.start") :
        progressPct < 100 ? t("enroll.resume") :
        t("enroll.continue");
    }
    if (enrollmentStatus === "not-authed") return t("enroll.signIn");
    if (isFree) return t("enroll.free");
    if (variant === "dark") return t("enroll.forPrice", { price });
    return t("enroll.label");
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
    setError(t("enroll.paymentsNotConfigured"));
  }

  const busy = pending || buyPending || stripePending || cmiPending;

  // Enrolled → direct link, no action needed
  if (enrollmentStatus === "enrolled") {
    return (
      <>
        <Link href={`/courses/${course.slug}/learn`} className={cn(baseClass)}>
          {label()}
          <ArrowRight size={14} className="rtl:rotate-180" />
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
        {busy ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} className="rtl:rotate-180" />}
        {busy ? t("enroll.working") : label()}
      </button>
      {error && <p className={cn("text-xs mt-1.5 text-center", variant === "dark" ? "text-red-300" : "text-red-500")}>{error}</p>}
    </>
  );
}
