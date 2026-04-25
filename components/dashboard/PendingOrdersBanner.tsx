import Link from "next/link";
import { AlertCircle } from "lucide-react";
import type { PendingOrderData } from "@/lib/data/dashboard";

interface PendingOrdersBannerProps {
  orders: PendingOrderData[];
}

export function PendingOrdersBanner({ orders }: PendingOrdersBannerProps) {
  if (orders.length === 0) return null;

  const single = orders.length === 1;

  return (
    <div className="mb-8 flex items-start gap-4 bg-primary-soft border border-primary/20 rounded-2xl p-5">
      <AlertCircle className="text-primary shrink-0 mt-0.5" size={20} strokeWidth={2} />
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-700 text-ink leading-snug mb-0.5">
          {single
            ? "Your bank transfer is being awaited."
            : `You have ${orders.length} orders waiting for payment.`}
        </p>
        <p className="text-sm text-muted font-500">
          {single
            ? `Complete the payment for "${orders[0].courseTitle}" to start learning.`
            : "Complete your bank transfers to access these courses."}
        </p>
      </div>
      <Link
        href={single ? `/checkout/${orders[0].id}` : "/dashboard/orders"}
        className="shrink-0 inline-flex items-center h-9 px-4 rounded-lg bg-primary text-white text-sm font-700 hover:bg-primary-hover transition-colors whitespace-nowrap"
      >
        {single ? "View order" : "Review orders"}
      </Link>
    </div>
  );
}
