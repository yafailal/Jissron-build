"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, CreditCard } from "lucide-react";
import { createPaidLiveSessionCheckout } from "@/lib/actions/bookings";

interface Props {
  sessionId: string;
  priceMadCents: number;
  priceUsdCents: number;
  cmiConfigured: boolean;
  stripeConfigured: boolean;
  isAuthenticated: boolean;
  signinHref: string;
}

export function PaidSessionCheckoutButton({
  sessionId,
  priceMadCents,
  priceUsdCents,
  cmiConfigured,
  stripeConfigured,
  isAuthenticated,
  signinHref,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [method, setMethod] = useState<"CMI" | "STRIPE">(
    cmiConfigured && priceMadCents > 0 ? "CMI" : "STRIPE"
  );

  if (!isAuthenticated) {
    return (
      <a
        href={signinHref}
        className="block w-full text-center h-11 leading-[44px] rounded-md bg-primary text-white text-[13px] font-700 hover:bg-primary-hover transition-colors"
      >
        Sign in to book
      </a>
    );
  }

  const cmiAvailable = cmiConfigured && priceMadCents > 0;
  const stripeAvailable = stripeConfigured && priceUsdCents > 0;

  if (!cmiAvailable && !stripeAvailable) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-[12px] text-amber-800">
        Card payments aren&apos;t configured for this session yet. Contact us to book.
      </div>
    );
  }

  const priceLabel =
    method === "CMI"
      ? `${Math.round(priceMadCents / 100).toLocaleString("fr-MA")} MAD`
      : `$${(priceUsdCents / 100).toFixed(2)}`;

  return (
    <div className="space-y-2">
      {cmiAvailable && stripeAvailable && (
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => setMethod("CMI")}
            className={`h-9 px-2 rounded-md border text-[11.5px] font-700 transition-colors ${
              method === "CMI"
                ? "bg-primary-soft text-primary border-primary/40"
                : "bg-white border-line text-ink hover:border-primary/40"
            }`}
          >
            MAD card
          </button>
          <button
            type="button"
            onClick={() => setMethod("STRIPE")}
            className={`h-9 px-2 rounded-md border text-[11.5px] font-700 transition-colors ${
              method === "STRIPE"
                ? "bg-primary-soft text-primary border-primary/40"
                : "bg-white border-line text-ink hover:border-primary/40"
            }`}
          >
            USD card
          </button>
        </div>
      )}

      <button
        type="button"
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            const r = await createPaidLiveSessionCheckout({
              sessionId,
              paymentMethod: method,
            });
            if (r.ok) {
              router.push(r.checkoutUrl);
            } else {
              toast.error(r.error);
            }
          });
        }}
        className="inline-flex w-full items-center justify-center gap-1.5 h-11 rounded-md bg-primary text-white text-[13px] font-700 hover:bg-primary-hover transition-colors disabled:opacity-60"
      >
        {pending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Redirecting…
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4" />
            Book seat — {priceLabel}
          </>
        )}
      </button>
    </div>
  );
}
