"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";
import { refundOrder } from "@/lib/actions/refunds";

interface Props {
  orderId: string;
  paymentMethod: string;
  amountLabel: string;
}

export function RefundButton({ orderId, paymentMethod, amountLabel }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  const isStripe = paymentMethod === "STRIPE";

  return (
    <div className="bg-white rounded-2xl border border-purple-100 p-6">
      <h2 className="text-[13px] font-700 uppercase tracking-[.08em] text-muted mb-2">Refund</h2>
      <p className="text-[13px] text-muted font-500 mb-4 leading-relaxed">
        {isStripe
          ? `Refunds ${amountLabel} via the Stripe API and revokes the student's access.`
          : `Marks the order as refunded and revokes the student's access. You'll need to send the actual ${
              paymentMethod === "CMI" ? "CMI" : "bank"
            } refund yourself.`}
      </p>

      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="inline-flex items-center gap-1.5 h-10 px-5 rounded-lg border border-purple-300 text-purple-700 text-[13px] font-700 hover:bg-purple-50 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Refund order
        </button>
      ) : (
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[13px] font-600 text-purple-700">
            Refund {amountLabel}?
          </span>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                const r = await refundOrder(orderId);
                if (r.ok) {
                  toast.success(r.message);
                  router.refresh();
                  setConfirming(false);
                } else {
                  toast.error(r.error);
                }
              });
            }}
            className="h-9 px-4 rounded-lg bg-purple-600 text-white text-[12px] font-700 hover:bg-purple-700 disabled:opacity-60 transition-colors"
          >
            {pending ? "Refunding…" : "Yes, refund"}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => setConfirming(false)}
            className="h-9 px-4 rounded-lg border border-line text-[12px] font-600 text-muted hover:text-ink transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
