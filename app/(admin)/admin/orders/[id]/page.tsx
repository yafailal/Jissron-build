import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ExternalLink } from "lucide-react";
import { getOrder } from "@/lib/data/orders";
import { OrderActions } from "./OrderActions";

interface PageProps {
  params: Promise<{ id: string }>;
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  PENDING:   { label: "Pending",   cls: "bg-amber-50 text-amber-700 border border-amber-200" },
  PAID:      { label: "Paid",      cls: "bg-green-50 text-green-700 border border-green-200" },
  CANCELLED: { label: "Cancelled", cls: "bg-gray-100 text-gray-600 border border-gray-200" },
  EXPIRED:   { label: "Expired",   cls: "bg-red-50 text-red-600 border border-red-200" },
  REFUNDED:  { label: "Refunded",  cls: "bg-purple-50 text-purple-700 border border-purple-200" },
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-line/50 last:border-0 text-[13px]">
      <span className="font-600 text-muted shrink-0 min-w-[140px]">{label}</span>
      <span className="font-500 text-ink text-right">{value}</span>
    </div>
  );
}

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  const badge = STATUS_BADGE[order.status];
  const isPending = order.status === "PENDING";

  const isImage =
    order.receiptUrl
      ? /\.(jpe?g|png|webp|gif|avif)(\?.*)?$/i.test(order.receiptUrl)
      : false;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Back nav */}
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1.5 text-[13px] font-600 text-muted hover:text-ink mb-6 transition-colors"
      >
        <ChevronLeft size={14} />
        Back to orders
      </Link>

      <div className="flex items-center gap-4 mb-8">
        <h1 className="text-2xl font-800 text-ink font-mono">{order.orderReference ?? order.id}</h1>
        {badge && (
          <span className={`inline-flex px-3 py-1 rounded-full text-[12px] font-700 ${badge.cls}`}>
            {badge.label}
          </span>
        )}
      </div>

      <div className="lg:flex lg:gap-8">
        {/* LEFT — metadata */}
        <div className="flex-1 min-w-0 space-y-6">

          {/* Order info */}
          <div className="bg-white rounded-2xl border border-line p-6">
            <h2 className="text-[13px] font-700 uppercase tracking-[.08em] text-muted mb-4">Order details</h2>
            <Row label="Reference" value={<span className="font-mono font-700">{order.orderReference ?? "—"}</span>} />
            <Row label="Status" value={
              badge ? (
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-700 ${badge.cls}`}>
                  {badge.label}
                </span>
              ) : order.status
            } />
            <Row label="Amount" value={`${Math.round(order.amountCents / 100).toLocaleString("fr-MA")} ${order.currency}`} />
            <Row label="Payment method" value={order.paymentMethod} />
            <Row label="Created" value={order.createdAt.toLocaleString("en-GB")} />
            {order.paidAt && <Row label="Paid at" value={order.paidAt.toLocaleString("en-GB")} />}
            {order.expiredAt && <Row label="Expired at" value={order.expiredAt.toLocaleString("en-GB")} />}
          </div>

          {/* Customer info */}
          <div className="bg-white rounded-2xl border border-line p-6">
            <h2 className="text-[13px] font-700 uppercase tracking-[.08em] text-muted mb-4">Customer</h2>
            <div className="flex items-center gap-3 mb-4">
              {order.user.image ? (
                <Image
                  src={order.user.image}
                  alt={order.user.name ?? ""}
                  width={40}
                  height={40}
                  className="rounded-full shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/10 grid place-items-center shrink-0">
                  <span className="text-sm font-700 text-primary">{(order.user.name ?? "?"[0])}</span>
                </div>
              )}
              <div>
                <p className="font-700 text-ink text-[14px]">{order.user.name ?? "—"}</p>
                <p className="text-muted text-[12px]">{order.user.email}</p>
              </div>
            </div>
          </div>

          {/* Course info */}
          {order.course && (
            <div className="bg-white rounded-2xl border border-line p-6">
              <h2 className="text-[13px] font-700 uppercase tracking-[.08em] text-muted mb-4">Course</h2>
              <div className="flex items-center gap-3">
                {order.course.thumbnailUrl ? (
                  <div className="relative w-20 h-14 rounded-lg overflow-hidden shrink-0 bg-bg-soft">
                    <Image src={order.course.thumbnailUrl} alt={order.course.title} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="w-20 h-14 rounded-lg bg-gradient-to-br from-primary to-primary-bright shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="font-700 text-ink text-[14px] truncate">{order.course.title}</p>
                  <Link
                    href={`/courses/${order.course.slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-[12px] text-primary font-600 hover:underline mt-0.5"
                  >
                    View course <ExternalLink size={10} />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Receipt */}
          <div className="bg-white rounded-2xl border border-line p-6">
            <h2 className="text-[13px] font-700 uppercase tracking-[.08em] text-muted mb-4">Receipt</h2>
            {order.receiptUrl ? (
              isImage ? (
                <div className="rounded-xl overflow-hidden border border-line max-w-sm">
                  <Image
                    src={order.receiptUrl}
                    alt="Receipt"
                    width={480}
                    height={320}
                    className="w-full h-auto object-contain"
                  />
                </div>
              ) : (
                <a
                  href={order.receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-line text-[13px] font-700 text-ink hover:bg-bg-soft transition-colors"
                >
                  Open PDF receipt <ExternalLink size={13} />
                </a>
              )
            ) : (
              <p className="text-muted font-500 text-[13px]">No receipt uploaded.</p>
            )}
          </div>

          {/* CMI gateway info — only shown for CMI payments */}
          {order.paymentMethod === "CMI" && (
            <div className="bg-white rounded-2xl border border-line p-6">
              <h2 className="text-[13px] font-700 uppercase tracking-[.08em] text-muted mb-4">CMI gateway</h2>
              <Row label="Transaction ID" value={order.cmiTransactionId ?? "—"} />
              <Row label="Order reference (oid)" value={order.orderReference ?? "—"} />
              {order.cmiResponseRaw ? (
                <details className="mt-3">
                  <summary className="text-[12px] font-700 text-primary cursor-pointer hover:underline">
                    View raw callback response
                  </summary>
                  <pre className="mt-2 text-[10.5px] font-mono bg-bg-soft border border-line rounded-lg p-3 overflow-x-auto whitespace-pre-wrap max-h-80">
                    {JSON.stringify(order.cmiResponseRaw, null, 2)}
                  </pre>
                </details>
              ) : (
                <p className="text-muted text-[12px] mt-2">No callback received yet.</p>
              )}
            </div>
          )}
        </div>

        {/* RIGHT — actions (only for PENDING orders) */}
        {isPending && (
          <div className="lg:w-80 shrink-0 mt-6 lg:mt-0">
            <OrderActions orderId={order.id} initialNote={order.adminNote} />
          </div>
        )}

        {/* RIGHT — read-only note for non-pending orders */}
        {!isPending && order.adminNote && (
          <div className="lg:w-80 shrink-0 mt-6 lg:mt-0">
            <div className="bg-white rounded-2xl border border-line p-6">
              <h2 className="text-[13px] font-700 uppercase tracking-[.08em] text-muted mb-3">Admin note</h2>
              <p className="text-[13px] text-ink font-500 whitespace-pre-wrap">{order.adminNote}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
