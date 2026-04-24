"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { CheckCircle, Monitor, Smartphone, Award, Infinity } from "lucide-react";
import { formatPrice, type Currency } from "@/lib/currency";
import { enrollInFreeCourse } from "@/lib/actions/enrollment";
import { createBankTransferOrder } from "@/lib/actions/orders";

interface CourseSidebarProps {
  course: {
    id: string;
    slug: string;
    title: string;
    thumbnailUrl: string | null;
    priceMadCents: number;
    priceUsdCents: number;
    oldPriceMadCents: number | null;
    oldPriceUsdCents: number | null;
    badge: string | null;
  };
  currency: Currency;
  enrollmentStatus: "enrolled" | "not-enrolled" | "not-authed";
  enrolledAt?: Date | null;
  progressPct?: number;
}

const FEATURES = [
  { icon: Infinity, label: "Lifetime access" },
  { icon: Award, label: "Certificate of completion" },
  { icon: Monitor, label: "Access on desktop" },
  { icon: Smartphone, label: "Access on mobile" },
];

export function CourseSidebar({ course, currency, enrollmentStatus, enrolledAt, progressPct = 0 }: CourseSidebarProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [buyPending, startBuy] = useTransition();

  const isFree = course.priceMadCents === 0 && course.priceUsdCents === 0;
  const price = formatPrice(course.priceMadCents, course.priceUsdCents, currency);
  const oldPrice =
    course.oldPriceMadCents || course.oldPriceUsdCents
      ? formatPrice(course.oldPriceMadCents ?? 0, course.oldPriceUsdCents ?? 0, currency)
      : null;

  async function handleFreeEnroll() {
    setPending(true);
    setError(null);
    const result = await enrollInFreeCourse(course.id);
    // redirect() throws and unwinds — reaching here means an error was returned
    if (result && !result.ok) {
      setError(result.error);
      setPending(false);
    }
  }

  function renderCta() {
    // State E — logged in, already enrolled
    if (enrollmentStatus === "enrolled") {
      const ctaLabel =
        progressPct === 0 ? "Start learning" :
        progressPct < 100 ? "Resume learning" :
        "Continue learning";
      return (
        <div className="space-y-2">
          <Link
            href={`/courses/${course.slug}/learn`}
            className="block w-full text-center h-12 leading-[3rem] rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-hover transition-colors"
          >
            {ctaLabel}
          </Link>
          {enrolledAt && (
            <p className="text-xs text-muted text-center font-500">
              Enrolled on{" "}
              {enrolledAt.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          )}
        </div>
      );
    }

    // State A — not logged in, free course
    if (enrollmentStatus === "not-authed" && isFree) {
      return (
        <Link
          href={`/signin?callbackUrl=/courses/${course.slug}`}
          className="block w-full text-center h-12 leading-[3rem] rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-hover transition-colors"
        >
          Sign in to enroll
        </Link>
      );
    }

    // State B — not logged in, paid course
    if (enrollmentStatus === "not-authed" && !isFree) {
      return (
        <Link
          href={`/signin?callbackUrl=/courses/${course.slug}`}
          className="block w-full text-center h-12 leading-[3rem] rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-hover transition-colors"
        >
          Sign in to purchase
        </Link>
      );
    }

    // State C — logged in, not enrolled, free course
    if (isFree) {
      return (
        <button
          onClick={handleFreeEnroll}
          disabled={pending}
          className="w-full h-12 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {pending ? "Enrolling…" : "Enroll for free"}
        </button>
      );
    }

    // State D — logged in, not enrolled, paid course
    // MAD: enabled via bank transfer. USD: disabled until Phase 6.5.
    if (currency === "MAD") {
      return (
        <button
          onClick={() =>
            startBuy(async () => {
              const result = await createBankTransferOrder(course.id);
              if (result && !result.ok) setError(result.error);
            })
          }
          disabled={buyPending}
          className="w-full h-12 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {buyPending ? "Preparing order…" : `Buy for ${price}`}
        </button>
      );
    }

    return (
      <div className="space-y-2">
        <button
          disabled
          className="w-full h-12 rounded-xl bg-primary text-white font-bold text-sm opacity-60 cursor-not-allowed"
        >
          Buy for {price}
        </button>
        <p className="text-xs text-muted text-center font-500 leading-snug">
          USD payment coming in Phase 6.5
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-line rounded-2xl shadow-card overflow-hidden">
      {/* Thumbnail */}
      {course.thumbnailUrl ? (
        <div className="relative h-44 bg-bg-soft">
          <Image src={course.thumbnailUrl} alt={course.title} fill className="object-cover" />
        </div>
      ) : (
        <div className="h-44 bg-gradient-to-br from-primary to-primary-bright" />
      )}

      <div className="p-6 space-y-5">
        {/* Badge + Price */}
        <div>
          {course.badge && (
            <span className="inline-block mb-2 text-[11px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded bg-primary/10 text-primary">
              {course.badge}
            </span>
          )}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-800 text-ink">{price}</span>
            {oldPrice && (
              <span className="text-base text-muted line-through font-500">{oldPrice}</span>
            )}
          </div>
        </div>

        {/* CTA */}
        {renderCta()}

        {/* Error */}
        {error && (
          <p className="text-sm text-red-500 font-500 text-center">{error}</p>
        )}

        {/* Features */}
        <ul className="space-y-2.5 pt-1 border-t border-line">
          {FEATURES.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-2.5 text-sm text-muted font-500">
              <Icon size={15} className="text-primary shrink-0" strokeWidth={2} />
              {label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
