import { Link } from "@/i18n/navigation";
import { AlertCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { PendingOrderData } from "@/lib/data/dashboard";

interface PendingOrdersBannerProps {
  orders: PendingOrderData[];
}

export async function PendingOrdersBanner({ orders }: PendingOrdersBannerProps) {
  if (orders.length === 0) return null;
  const t = await getTranslations("Dashboard.banner");

  const single = orders.length === 1;

  return (
    <div className="mb-8 flex items-start gap-4 bg-primary-soft border border-primary/20 rounded-2xl p-5">
      <AlertCircle className="text-primary shrink-0 mt-0.5" size={20} strokeWidth={2} />
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-700 text-ink leading-snug mb-0.5">
          {single
            ? t("singleTitle")
            : t("multiTitle", { count: orders.length })}
        </p>
        <p className="text-sm text-muted font-500">
          {single
            ? t("singleBody", { title: orders[0].courseTitle })
            : t("multiBody")}
        </p>
      </div>
      <Link
        href={single ? `/checkout/${orders[0].id}` : "/dashboard/orders"}
        className="shrink-0 inline-flex items-center h-9 px-4 rounded-full bg-primary text-white text-sm font-700 hover:bg-primary-hover transition-colors whitespace-nowrap"
      >
        {single ? t("viewOrder") : t("reviewOrders")}
      </Link>
    </div>
  );
}
