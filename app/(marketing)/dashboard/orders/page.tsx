import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { autoExpireOrders } from "@/lib/actions/orders";
import { getPendingOrdersForUser } from "@/lib/data/orders";

export const metadata = { title: "My Orders" };

export default async function DashboardOrdersPage() {
  const session = await auth();
  if (!session) redirect("/signin?callbackUrl=/dashboard/orders");

  await autoExpireOrders();

  const orders = await getPendingOrdersForUser(session.user.id);

  return (
    <div className="min-h-screen bg-bg-soft">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="text-[13px] font-600 text-muted hover:text-ink transition-colors mb-4 inline-flex items-center gap-1"
        >
          ← Back to dashboard
        </Link>
        <h1 className="text-2xl font-800 text-ink mt-3 mb-1">Your orders</h1>
        <p className="text-sm text-muted font-500">
          Complete your bank transfers to activate course access.
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white border border-line rounded-2xl p-10 flex flex-col items-center text-center">
          <p className="text-[15px] font-700 text-ink mb-1.5">No pending orders</p>
          <p className="text-sm text-muted font-500 mb-6">
            All your payments are up to date.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center h-9 px-5 rounded-lg bg-primary text-white text-sm font-700 hover:bg-primary-hover transition-colors"
          >
            Back to dashboard
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
                <p className="text-[15px] font-700 text-ink mb-0.5 truncate">
                  {order.course?.title ?? "—"}
                </p>
                {order.orderReference && (
                  <p className="text-[12px] font-600 text-muted font-mono">
                    {order.orderReference}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <span className="text-sm font-700 text-ink">
                  {Math.round(order.amountCents / 100).toLocaleString("fr-MA")}{" "}
                  {order.currency}
                </span>
                <Link
                  href={`/checkout/${order.id}`}
                  className="inline-flex items-center h-9 px-4 rounded-lg bg-primary text-white text-sm font-700 hover:bg-primary-hover transition-colors"
                >
                  Complete payment →
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
