import { Link } from "@/i18n/navigation";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { autoExpireOrders } from "@/lib/actions/orders";
import { getPendingOrdersForUser } from "@/lib/data/orders";
import { PageBand } from "@/components/marketing/PageBand";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Dashboard" });
  return { title: t("ordersMetaTitle") };
}

export default async function DashboardOrdersPage() {
  const session = await auth();
  if (!session) redirect("/signin?callbackUrl=/dashboard/orders");

  const t = await getTranslations("Dashboard.orders");
  await autoExpireOrders();

  const orders = await getPendingOrdersForUser(session.user.id);

  return (
    <div className="min-h-screen bg-bg-soft">
    <PageBand
      title={t("title")}
      description={t("subtitle")}
      actions={
        <Link
          href="/dashboard"
          className="inline-flex items-center h-9 px-4 rounded-full border-[1.5px] border-white/70 text-white text-[13px] font-bold hover:bg-white hover:text-primary transition-colors"
        >
          {t("back")}
        </Link>
      }
    />
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

      {orders.length === 0 ? (
        <div className="bg-white border border-line rounded-2xl p-10 flex flex-col items-center text-center">
          <p className="text-[15px] font-bold text-ink mb-1.5">{t("noPending")}</p>
          <p className="text-sm text-muted font-medium mb-6">
            {t("upToDate")}
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center h-11 px-6 rounded-full bg-primary text-white text-sm font-bold hover:bg-primary-hover transition-colors"
          >
            {t("backButton")}
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-line rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap"
            >
              <div className="min-w-0">
                <p className="text-[15px] font-bold text-ink mb-0.5 truncate">
                  {order.course?.title ?? "—"}
                </p>
                {order.orderReference && (
                  <p className="text-[12px] font-semibold text-muted font-mono">
                    {order.orderReference}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <span className="text-sm font-bold text-ink">
                  {Math.round(order.amountCents / 100).toLocaleString("fr-MA")}{" "}
                  {order.currency}
                </span>
                <Link
                  href={`/checkout/${order.id}`}
                  className="inline-flex items-center h-9 px-4 rounded-full bg-primary text-white text-[13px] font-bold hover:bg-primary-hover transition-colors"
                >
                  {t("completePayment")}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </div>
  );
}
