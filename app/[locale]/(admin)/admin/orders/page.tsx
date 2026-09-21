import { Link } from "@/i18n/navigation";
import { getAllOrders } from "@/lib/data/orders";
import { autoExpireOrders } from "@/lib/actions/orders";
import { getTranslations, getLocale } from "next-intl/server";
import { PageHeader } from "@/components/admin/PageHeader";

const STATUS_TABS = ["ALL", "PENDING", "PAID", "CANCELLED", "EXPIRED"] as const;

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  PENDING:   { label: "Pending",   cls: "bg-amber-50 text-amber-700 border border-amber-200" },
  PAID:      { label: "Paid",      cls: "bg-green-50 text-green-700 border border-green-200" },
  CANCELLED: { label: "Cancelled", cls: "bg-gray-100 text-gray-600 border border-gray-200" },
  EXPIRED:   { label: "Expired",   cls: "bg-red-50 text-red-600 border border-red-200" },
  REFUNDED:  { label: "Refunded",  cls: "bg-purple-50 text-purple-700 border border-purple-200" },
};

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  // On-read auto-expire: runs silently, non-blocking
  await autoExpireOrders();
  const t = await getTranslations("AdminOrders");
  const locale = await getLocale();
  const dateLocale = locale === "en" ? "en-GB" : locale === "ar" ? "ar-u-nu-latn" : locale;
  const statusLabel = (s: string) => (STATUS_BADGE[s] ? t(`status.${s}`) : s);

  const { status = "ALL" } = await searchParams;
  const activeTab = STATUS_TABS.includes(status as (typeof STATUS_TABS)[number])
    ? (status as (typeof STATUS_TABS)[number])
    : "ALL";

  const orders = await getAllOrders(activeTab === "ALL" ? undefined : activeTab);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader
        title={t("title")}
        description={t("description")}
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-line">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab}
            href={`/admin/orders?status=${tab}`}
            className={`px-4 py-2.5 text-[13px] font-600 border-b-2 -mb-px transition-colors ${
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {tab === "ALL" ? t("tabAll") : statusLabel(tab)}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20 text-muted font-500">
          {activeTab !== "ALL" ? t("emptyWithStatus", { status: statusLabel(activeTab).toLowerCase() }) : t("empty")}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-line overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-line bg-bg-soft text-left">
                <th className="px-4 py-3 font-700 text-muted uppercase tracking-[.06em] text-[11px]">{t("colReference")}</th>
                <th className="px-4 py-3 font-700 text-muted uppercase tracking-[.06em] text-[11px]">{t("colCustomer")}</th>
                <th className="px-4 py-3 font-700 text-muted uppercase tracking-[.06em] text-[11px]">{t("colCourse")}</th>
                <th className="px-4 py-3 font-700 text-muted uppercase tracking-[.06em] text-[11px]">{t("colAmount")}</th>
                <th className="px-4 py-3 font-700 text-muted uppercase tracking-[.06em] text-[11px]">{t("colStatus")}</th>
                <th className="px-4 py-3 font-700 text-muted uppercase tracking-[.06em] text-[11px]">{t("colReceipt")}</th>
                <th className="px-4 py-3 font-700 text-muted uppercase tracking-[.06em] text-[11px]">{t("colDate")}</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {orders.map((order) => {
                const badge = STATUS_BADGE[order.status];
                const amountMad = Math.round(order.amountCents / 100).toLocaleString("fr-MA");
                return (
                  <tr key={order.id} className="hover:bg-bg-soft/50 transition-colors">
                    <td className="px-4 py-3 font-mono font-600 text-ink text-[12px]">
                      <Link href={`/admin/orders/${order.id}`} className="hover:text-primary transition-colors">
                        {order.orderReference ?? "—"}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/orders/${order.id}`} className="block group">
                        <p className="font-600 text-ink group-hover:text-primary transition-colors">{order.user.name ?? "—"}</p>
                        <p className="text-muted text-[12px]">{order.user.email}</p>
                      </Link>
                    </td>
                    <td className="px-4 py-3 max-w-[180px]">
                      {order.course ? (
                        <Link
                          href={`/courses/${order.course.slug}`}
                          target="_blank"
                          className="font-500 text-ink hover:text-primary line-clamp-2"
                        >
                          {order.course.title}
                        </Link>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-700 text-ink whitespace-nowrap">
                      {amountMad} {order.currency}
                    </td>
                    <td className="px-4 py-3">
                      {badge && (
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-700 ${badge.cls}`}>
                          {t(`status.${order.status}`)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {order.receiptUrl ? (
                        <span className="text-green-600 font-600">{t("receiptUploaded")}</span>
                      ) : (
                        t("receiptNone")
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted whitespace-nowrap">
                      {order.createdAt.toLocaleDateString(dateLocale, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="inline-flex h-8 items-center px-3 rounded-lg border border-line text-[12px] font-700 text-ink hover:bg-bg-soft hover:border-primary/30 transition-colors"
                      >
                        {t("view")}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
