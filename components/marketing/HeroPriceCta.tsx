"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { formatPrice, type Currency } from "@/lib/currency";
import { enrollInFreeCourse } from "@/lib/actions/enrollment";
import { createBankTransferOrder } from "@/lib/actions/orders";
import { createLemonSqueezyCheckout } from "@/lib/actions/lemon-squeezy";
import { useSignInModal } from "@/context/sign-in-modal-context";

interface HeroPriceCtaProps {
  course: {
    id: string;
    slug: string;
    priceMadCents: number;
    priceUsdCents: number;
    oldPriceMadCents: number | null;
    oldPriceUsdCents: number | null;
    lemonSqueezyVariantId: string | null;
  };
  currency: Currency;
  enrollmentStatus: "enrolled" | "not-enrolled" | "not-authed";
  progressPct?: number;
  lsConfigured?: boolean;
}

export function HeroPriceCta({
  course,
  currency,
  enrollmentStatus,
  progressPct = 0,
  lsConfigured = false,
}: HeroPriceCtaProps) {
  const { open: openSignInModal } = useSignInModal();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [buyPending, startBuy] = useTransition();
  const [lsPending, startLs] = useTransition();

  const isFree = course.priceMadCents === 0 && course.priceUsdCents === 0;
  const price = formatPrice(course.priceMadCents, course.priceUsdCents, currency);
  const oldPrice =
    course.oldPriceMadCents || course.oldPriceUsdCents
      ? formatPrice(course.oldPriceMadCents ?? 0, course.oldPriceUsdCents ?? 0, currency)
      : null;
  const usdAvailable = lsConfigured && !!course.lemonSqueezyVariantId;

  async function handleFreeEnroll() {
    setPending(true);
    setError(null);
    const result = await enrollInFreeCourse(course.id);
    if (result && !result.ok) {
      setError(result.error);
      setPending(false);
    }
  }

  // ─── State E: enrolled ─────────────────────────────────────────────
  if (enrollmentStatus === "enrolled") {
    const ctaLabel =
      progressPct === 0 ? "Start learning" :
      progressPct < 100 ? "Resume learning" :
      "Continue learning";
    return (
      <Link
        href={`/courses/${course.slug}/learn`}
        className="inline-flex w-full items-center justify-center h-12 rounded-full bg-white text-primary font-bold text-sm hover:bg-white/90 transition-colors shadow-sm"
      >
        {ctaLabel}
      </Link>
    );
  }

  // Pill split: [ price ][ CTA ]
  function Pill({
    label,
    onClick,
    disabled,
    asLink,
  }: {
    label: string;
    onClick?: () => void;
    disabled?: boolean;
    asLink?: boolean;
  }) {
    const priceSlot = (
      <span className="px-4 h-12 inline-flex items-center bg-white/15 text-white font-bold text-sm shrink-0 border-r border-white/20">
        {isFree ? "Free" : price}
      </span>
    );
    const ctaSlot = (
      <span className="flex-1 px-5 h-12 inline-flex items-center justify-center text-primary bg-white font-bold text-sm">
        {label}
      </span>
    );
    const inner = (
      <span className="inline-flex items-stretch rounded-full overflow-hidden w-full bg-white/15 shadow-sm hover:shadow-md transition-shadow">
        {priceSlot}
        {ctaSlot}
      </span>
    );
    if (asLink) return inner;
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="w-full disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {inner}
      </button>
    );
  }

  // ─── State A/B: not authed ────────────────────────────────────────
  if (enrollmentStatus === "not-authed") {
    return (
      <div className="space-y-2">
        <Pill
          label={isFree ? "Sign in to enroll" : "Sign in to purchase"}
          onClick={openSignInModal}
        />
        {oldPrice && (
          <p className="text-center text-xs text-white/60 line-through">{oldPrice}</p>
        )}
      </div>
    );
  }

  // ─── State C: free, logged-in, not enrolled ───────────────────────
  if (isFree) {
    return (
      <div className="space-y-2">
        <Pill label={pending ? "Enrolling…" : "Enroll for free"} onClick={handleFreeEnroll} disabled={pending} />
        {error && <p className="text-xs text-red-300 text-center">{error}</p>}
      </div>
    );
  }

  // ─── State D: paid, logged-in, not enrolled ───────────────────────
  if (currency === "MAD") {
    return (
      <div className="space-y-2">
        <Pill
          label={buyPending ? "Preparing…" : "Buy now"}
          disabled={buyPending}
          onClick={() =>
            startBuy(async () => {
              const result = await createBankTransferOrder(course.id);
              if (result && !result.ok) setError(result.error);
            })
          }
        />
        {usdAvailable && (
          <button
            onClick={() =>
              startLs(async () => {
                setError(null);
                const result = await createLemonSqueezyCheckout(course.id);
                if (result.ok) {
                  window.location.href = result.checkoutUrl;
                } else {
                  setError(result.error);
                }
              })
            }
            disabled={lsPending}
            className="w-full h-10 rounded-full border border-white/40 text-white/90 font-bold text-xs hover:bg-white/10 transition-colors disabled:opacity-60"
          >
            {lsPending ? "Redirecting…" : "Pay in USD via card"}
          </button>
        )}
        {oldPrice && (
          <p className="text-center text-xs text-white/60 line-through">{oldPrice}</p>
        )}
        {error && <p className="text-xs text-red-300 text-center">{error}</p>}
      </div>
    );
  }

  if (usdAvailable) {
    return (
      <div className="space-y-2">
        <Pill
          label={lsPending ? "Redirecting…" : "Buy now"}
          disabled={lsPending}
          onClick={() =>
            startLs(async () => {
              setError(null);
              const result = await createLemonSqueezyCheckout(course.id);
              if (result.ok) {
                window.location.href = result.checkoutUrl;
              } else {
                setError(result.error);
              }
            })
          }
        />
        {oldPrice && (
          <p className="text-center text-xs text-white/60 line-through">{oldPrice}</p>
        )}
        {error && <p className="text-xs text-red-300 text-center">{error}</p>}
      </div>
    );
  }

  // Fallback: USD course, no LS config
  return (
    <div className="space-y-2">
      <Pill label="Buy now" disabled />
      <p className="text-center text-xs text-white/60">USD payments not yet available</p>
    </div>
  );
}
