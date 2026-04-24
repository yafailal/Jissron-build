import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { AlertCircle, Clock } from "lucide-react";
import { auth } from "@/lib/auth";
import { getOrder } from "@/lib/data/orders";
import { getSiteSettings } from "@/lib/data/homepage";
import { QRDisplay } from "./QRDisplay";
import { CopyButton } from "./CopyButton";
import { ReceiptUpload } from "./ReceiptUpload";

interface PageProps {
  params: Promise<{ orderId: string }>;
}

function formatMad(cents: number) {
  return (cents / 100).toLocaleString("fr-MA", { minimumFractionDigits: 0 }) + " MAD";
}

function ExpiresIn({ createdAt }: { createdAt: Date }) {
  const expiresAt = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000);
  const diff = expiresAt.getTime() - Date.now();
  if (diff <= 0) return <span className="text-red-500">Expired</span>;
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  return <span>{days}d {hours}h remaining</span>;
}

export default async function CheckoutPage({ params }: PageProps) {
  const { orderId } = await params;

  const session = await auth();
  if (!session) redirect(`/signin?callbackUrl=/checkout/${orderId}`);

  const [order, settings] = await Promise.all([
    getOrder(orderId),
    getSiteSettings(),
  ]);

  if (!order) notFound();
  if (order.userId !== session.user.id) notFound();

  // Redirect away from completed/cancelled/expired orders
  if (order.status === "PAID") redirect("/dashboard");
  if (order.status === "CANCELLED" || order.status === "EXPIRED") {
    redirect(`/courses/${order.course.slug}`);
  }

  // Check whether bank transfer is configured
  const bankReady =
    settings?.bankName &&
    settings?.bankAccountName &&
    settings?.bankIBAN &&
    settings?.bankRIB;

  const qrValue = bankReady
    ? `IBAN: ${settings!.bankIBAN}\nAmount: ${Math.round(order.amountCents / 100)} MAD\nRef: ${order.orderReference ?? ""}`
    : "";

  return (
    <main id="main-content" className="min-h-screen bg-bg-soft">
      {/* Progress indicator */}
      <div className="border-b border-line bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3 text-sm">
          <span className="text-muted font-500">Step 1</span>
          <span className="text-line">—</span>
          <span className="font-700 text-primary">Step 2 — Payment</span>
          <span className="text-line">—</span>
          <span className="text-muted font-500">Step 3 — Confirmation</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {!bankReady ? (
          /* ── Empty-state error ── */
          <div className="max-w-md mx-auto text-center py-20">
            <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 grid place-items-center mx-auto mb-5">
              <AlertCircle size={24} className="text-red-500" />
            </div>
            <h1 className="text-xl font-800 text-ink mb-2">Bank transfer unavailable</h1>
            <p className="text-[14px] text-muted font-500 leading-relaxed mb-6">
              Bank transfer is currently unavailable. Please try card payment or contact support.
            </p>
            <Link
              href={`/courses/${order.course.slug}`}
              className="inline-flex items-center justify-center h-10 px-6 rounded-lg border border-line text-sm font-700 text-ink hover:bg-bg-soft transition-colors"
            >
              Back to course
            </Link>
          </div>
        ) : (
          <div className="lg:flex lg:gap-8">
            {/* ── LEFT — main content ── */}
            <div className="flex-1 min-w-0 space-y-6">
              <h1 className="text-2xl font-800 text-ink">
                Transfer {formatMad(order.amountCents)} to complete your order
              </h1>

              {/* ── Subcard 1: Bank details ── */}
              <div className="bg-white rounded-2xl border border-line p-6 space-y-4">
                <h2 className="text-[13px] font-700 uppercase tracking-[.08em] text-muted">
                  Bank details
                </h2>
                <BankRow label="Bank" value={settings!.bankName!} />
                <BankRow label="Account holder" value={settings!.bankAccountName!} />
                <BankRow label="IBAN" value={settings!.bankIBAN!} mono copyable />
                <BankRow label="RIB" value={settings!.bankRIB!} mono copyable />
                {settings?.bankSwift && (
                  <BankRow label="SWIFT" value={settings.bankSwift} />
                )}
                {settings?.bankInstructions && (
                  <div className="pt-3 border-t border-line">
                    <p className="text-[12px] text-muted font-600 uppercase tracking-[.06em] mb-1.5">Instructions</p>
                    <p className="text-[13px] text-body-text leading-relaxed whitespace-pre-line">
                      {settings.bankInstructions}
                    </p>
                  </div>
                )}
              </div>

              {/* ── Subcard 2: QR code ── */}
              <div className="bg-white rounded-2xl border border-line p-6">
                <h2 className="text-[13px] font-700 uppercase tracking-[.08em] text-muted mb-5">
                  QR code
                </h2>
                <QRDisplay value={qrValue} />
              </div>

              {/* ── Subcard 3: Order reference ── */}
              <div className="bg-white rounded-2xl border border-line p-6">
                <h2 className="text-[13px] font-700 uppercase tracking-[.08em] text-muted mb-3">
                  Order reference
                </h2>
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="text-4xl font-800 text-ink tracking-widest">
                    {order.orderReference}
                  </span>
                  <CopyButton value={order.orderReference ?? ""} label="reference" />
                </div>
                <p className="text-[13px] text-muted font-500 mt-3 leading-relaxed">
                  Include this reference in your transfer description so we can match your payment.
                </p>
              </div>

              {/* ── Receipt upload ── */}
              <div className="bg-white rounded-2xl border border-line p-6">
                <ReceiptUpload orderId={order.id} existingUrl={order.receiptUrl} />
              </div>

              {/* ── Primary CTA ── */}
              <Link
                href={`/checkout/${order.id}/confirmation`}
                className="flex items-center justify-center h-12 w-full rounded-xl bg-primary text-white font-700 text-[15px] hover:bg-primary-hover transition-colors"
              >
                I&apos;m done, notify me →
              </Link>
            </div>

            {/* ── RIGHT — order summary sidebar ── */}
            <aside className="lg:w-72 xl:w-80 shrink-0 mt-6 lg:mt-0">
              <div className="bg-white rounded-2xl border border-line overflow-hidden sticky top-6">
                {/* Course thumbnail */}
                {order.course.thumbnailUrl ? (
                  <div className="relative h-36 bg-bg-soft">
                    <Image
                      src={order.course.thumbnailUrl}
                      alt={order.course.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-36 bg-gradient-to-br from-primary to-primary-bright" />
                )}

                <div className="p-5 space-y-4">
                  <div>
                    <p className="text-[13px] text-muted font-500 mb-1">Enrolling in</p>
                    <p className="text-[15px] font-700 text-ink leading-snug">{order.course.title}</p>
                  </div>

                  <div className="border-t border-line pt-4 space-y-3">
                    <SidebarRow label="Amount" value={formatMad(order.amountCents)} bold />
                    <SidebarRow label="Status" value="Waiting for payment" />
                    <SidebarRow
                      label="Order created"
                      value={order.createdAt.toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    />
                    <div className="flex items-center justify-between gap-2 text-[13px]">
                      <span className="text-muted font-500 flex items-center gap-1.5">
                        <Clock size={12} className="text-muted" />
                        Expires in
                      </span>
                      <span className="font-600 text-ink">
                        <ExpiresIn createdAt={order.createdAt} />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}

function BankRow({
  label,
  value,
  mono = false,
  copyable = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  copyable?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-line/50 last:border-0">
      <span className="text-[12px] font-600 text-muted uppercase tracking-[.06em] shrink-0 pt-0.5 min-w-[100px]">
        {label}
      </span>
      <div className="flex items-center gap-2 min-w-0">
        <span className={`text-[13px] font-600 text-ink break-all ${mono ? "font-mono" : ""}`}>
          {value}
        </span>
        {copyable && <CopyButton value={value} />}
      </div>
    </div>
  );
}

function SidebarRow({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 text-[13px]">
      <span className="text-muted font-500">{label}</span>
      <span className={bold ? "font-700 text-ink" : "font-600 text-ink"}>{value}</span>
    </div>
  );
}
