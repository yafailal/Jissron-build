"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { CheckCircle, Monitor, Smartphone, Award, Infinity } from "lucide-react";
import { formatPrice, type Currency } from "@/lib/currency";
import { enrollInFreeCourse } from "@/lib/actions/enrollment";

interface CourseSidebarProps {
  course: {
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
}

const FEATURES = [
  { icon: Infinity, label: "Lifetime access" },
  { icon: Award, label: "Certificate of completion" },
  { icon: Monitor, label: "Access on desktop" },
  { icon: Smartphone, label: "Access on mobile" },
];

export function CourseSidebar({ course, currency, enrollmentStatus }: CourseSidebarProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const isFree = course.priceMadCents === 0 && course.priceUsdCents === 0;
  const price = formatPrice(course.priceMadCents, course.priceUsdCents, currency);
  const oldPrice =
    course.oldPriceMadCents || course.oldPriceUsdCents
      ? formatPrice(course.oldPriceMadCents ?? 0, course.oldPriceUsdCents ?? 0, currency)
      : null;

  async function handleFreeEnroll() {
    setPending(true);
    setError(null);
    const result = await enrollInFreeCourse(course.slug);
    // redirect() throws and unwinds — if we reach here there was an error
    if (result && !result.ok) {
      setError(result.error);
      setPending(false);
    }
  }

  function renderCta() {
    if (enrollmentStatus === "enrolled") {
      return (
        <Link
          href={`/learn/${course.slug}`}
          className="block w-full text-center h-12 leading-[3rem] rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-hover transition-colors"
        >
          Continue learning
        </Link>
      );
    }

    if (enrollmentStatus === "not-authed") {
      if (isFree) {
        return (
          <Link
            href={`/signup?callbackUrl=/courses/${course.slug}`}
            className="block w-full text-center h-12 leading-[3rem] rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-hover transition-colors"
          >
            Sign up to enroll free
          </Link>
        );
      }
      return (
        <Link
          href={`/signin?callbackUrl=/courses/${course.slug}`}
          className="block w-full text-center h-12 leading-[3rem] rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-hover transition-colors"
        >
          Sign in to purchase
        </Link>
      );
    }

    // Logged in, not enrolled
    if (isFree) {
      return (
        <button
          onClick={handleFreeEnroll}
          disabled={pending}
          className="w-full h-12 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {pending ? "Enrolling…" : "Enroll free"}
        </button>
      );
    }

    // Paid — checkout wired in Phase 6.4/6.5
    return (
      <button
        disabled
        className="w-full h-12 rounded-xl bg-primary text-white font-bold text-sm opacity-60 cursor-not-allowed"
        title="Payment coming soon"
      >
        Enroll now — {price}
      </button>
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
