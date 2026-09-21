import { notFound, redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { AlertCircle, Clock } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { getOrder } from "@/lib/data/orders";
import { getSiteSettings } from "@/lib/data/homepage";
import { QRDisplay } from "./QRDisplay";
import { CopyButton } from "./CopyButton";
import { ReceiptUpload } from "./ReceiptUpload";

interface PageProps {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ error?: string; reason?: string }>;
}

type T = Awaited<ReturnType<typeof getTranslations>>;

const CMI_ERROR_KEYS = ["cmi_declined", "cmi_not_configured", "cmi_bad_signature", "missing_reference"] as const;

function getCmiErrorMessage(error: string | undefined, reason: string | undefined, t: T): string | null {
  if (!error) return null;
  const base = (CMI_ERROR_KEYS as readonly string[]).includes(error)
    ? t(`cmiErrors.${error}` as "cmiErrors.cmi_declined")
    : t("cmiErrors.default");
  return reason ? `${base} (${reason})` : base;
}

function formatMad(cents: number) {
  return (cents / 100).toLocaleString("fr-MA", { minimumFractionDigits: 0 }) + " MAD";
}

async function ExpiresIn({ createdAt }: { createdAt: Date }) {
  const t = await getTranslations("Checkout");
  const expiresAt = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000);
  const diff = expiresAt.getTime() - Date.now();
  if (diff <= 0) return <span className="text-red-500">{t("expired")}</span>;
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  return <span>{t("remaining", { days, hours })}</span>;
}

export default async function CheckoutPage({ params, searchParams }: PageProps) {
  const { orderId } = await params;
  const { error, reason } = await searchParams;
  const t = await getTranslations("Checkout");
  const locale = await getLocale();
  const dateLocale = locale === "en" ? "en-GB" : locale === "ar" ? "ar-u-nu-latn" : locale;
  const cmiErrorMessage = getCmiErrorMessage(error, reason, t);

  const session = await auth();
  if (!session) redirect(`/signin?callbackUrl=/checkout/${orderId}`);

  const [order, settings] = await Promise.all([
    getOrder(orderId),
    getSiteSettings(),
  ]);

  if (!order) notFound();
  if (order.userId !== session.user.id) notFound();
  // This checkout page is course-only; redirect for non-course orders.
  if (!order.course) notFound();

  // Redirect away from completed/cancelled/expired orders — unless we have a
  // CMI error to show. In that case keep the user here so they can see what
  // happened and retry without losing context.
  if (order.status === "PAID") redirect("/dashboard");
  if ((order.status === "CANCELLED" || order.status === "EXPIRED") && !cmiErrorMessage) {
    redirect(`/courses/${order.course.slug}`);
  }

  // Dedicated CMI failure view: declined / signature error / config error
  if (cmiErrorMessage) {
    return (
      <main id="main-content" className="min-h-screen bg-bg-soft">
        <div className="max-w-md mx-auto px-4 py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 grid place-items-center mx-auto mb-5">
            <AlertCircle size={24} className="text-red-500" />
          </div>
          <h1 className="text-xl font-extrabold tracking-[-0.02em] text-ink mb-2">{t("failedTitle")}</h1>
          <p className="text-[14px] text-muted font-medium leading-relaxed mb-2">
            {cmiErrorMessage}
          </p>
          <p className="text-[12px] text-muted font-medium mb-6">
            {t.rich("orderReferenceLabel", {
              reference: order.orderReference ?? order.id,
              ref: (chunks) => <span className="font-mono">{chunks}</span>,
            })}
          </p>
          <div className="flex flex-col gap-2">
            <Link
              href={`/courses/${order.course.slug}`}
              className="inline-flex items-center justify-center h-11 px-6 rounded-full bg-primary text-white text-sm font-bold hover:bg-primary-hover transition-colors"
            >
              {t("tryAgain")}
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center h-11 px-6 rounded-full border-[1.5px] border-primary text-sm font-bold text-primary hover:bg-primary hover:text-white transition-colors"
            >
              {t("backToDashboard")}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Check whether bank transfer is configured
  const bankReady =
    settings?.bankName &&
    settings?.bankAccountName &&
    settings?.bankIBAN &&
    settings?.bankRIB;

  const siteUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const qrValue = bankReady ? `${siteUrl}/checkout/${order.id}` : "";

  return (
    <main id="main-content" className="min-h-screen bg-bg-soft">
      {/* Progress indicator */}
      <div className="border-b border-line bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3 text-sm">
          <span className="text-muted font-medium">{t("step1")}</span>
          <span className="text-line">—</span>
          <span className="font-bold text-primary">{t("step2Payment")}</span>
          <span className="text-line">—</span>
          <span className="text-muted font-medium">{t("step3Confirmation")}</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {!bankReady ? (
          /* ── Empty-state error ── */
          <div className="max-w-md mx-auto text-center py-20">
            <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 grid place-items-center mx-auto mb-5">
              <AlertCircle size={24} className="text-red-500" />
            </div>
            <h1 className="text-xl font-extrabold tracking-[-0.02em] text-ink mb-2">{t("unavailableTitle")}</h1>
            <p className="text-[14px] text-muted font-medium leading-relaxed mb-6">
              {t("unavailableBody")}
            </p>
            <Link
              href={`/courses/${order.course.slug}`}
              className="inline-flex items-center justify-center h-11 px-6 rounded-full border-[1.5px] border-primary text-sm font-bold text-primary hover:bg-primary hover:text-white transition-colors"
            >
              {t("backToCourse")}
            </Link>
          </div>
        ) : (
          <div className="lg:flex lg:gap-8">
            {/* ── LEFT — main content ── */}
            <div className="flex-1 min-w-0 space-y-6">
              <h1 className="text-[22px] sm:text-[26px] font-extrabold tracking-[-0.02em] text-ink">
                {t("transferTitle", { amount: formatMad(order.amountCents) })}
              </h1>

              {/* ── Subcard 1: Bank details ── */}
              <div className="bg-white rounded-2xl border border-line p-6 space-y-4">
                <h2 className="text-[12px] font-bold uppercase tracking-[0.1em] text-primary-mid">
                  {t("bankDetails")}
                </h2>
                <BankRow label={t("bank")} value={settings!.bankName!} />
                <BankRow label={t("accountHolder")} value={settings!.bankAccountName!} />
                <BankRow label={t("iban")} value={settings!.bankIBAN!} mono copyable />
                <BankRow label={t("rib")} value={settings!.bankRIB!} mono copyable />
                {settings?.bankSwift && (
                  <BankRow label={t("swift")} value={settings.bankSwift} />
                )}
                {settings?.bankInstructions && (
                  <div className="pt-3 border-t border-line">
                    <p className="text-[12px] text-muted font-semibold uppercase tracking-[.06em] mb-1.5">{t("instructions")}</p>
                    <p className="text-[13px] text-body-text leading-relaxed whitespace-pre-line">
                      {settings.bankInstructions}
                    </p>
                  </div>
                )}
              </div>

              {/* ── Subcard 2: QR code ── */}
              <div className="bg-white rounded-2xl border border-line p-6">
                <h2 className="text-[12px] font-bold uppercase tracking-[0.1em] text-primary-mid mb-5">
                  {t("qrCode")}
                </h2>
                <QRDisplay value={qrValue} />
              </div>

              {/* ── Subcard 3: Order reference ── */}
              <div className="bg-white rounded-2xl border border-line p-6">
                <h2 className="text-[12px] font-bold uppercase tracking-[0.1em] text-primary-mid mb-3">
                  {t("orderReference")}
                </h2>
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="text-3xl sm:text-4xl font-extrabold text-primary tracking-widest">
                    {order.orderReference}
                  </span>
                  <CopyButton value={order.orderReference ?? ""} label={t("referenceLabel")} />
                </div>
                <p className="text-[13px] text-muted font-medium mt-3 leading-relaxed">
                  {t("includeReference")}
                </p>
              </div>

              {/* ── Receipt upload ── */}
              <div className="bg-white rounded-2xl border border-line p-6">
                <ReceiptUpload orderId={order.id} existingUrl={order.receiptUrl} />
              </div>

              {/* ── Primary CTA ── */}
              <Link
                href={`/checkout/${order.id}/confirmation`}
                className="flex items-center justify-center h-11 w-full rounded-full bg-primary text-white font-bold text-[15px] hover:bg-primary-hover transition-colors"
              >
                {t("done")}
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
                    <p className="text-[13px] text-muted font-medium mb-1">{t("enrollingIn")}</p>
                    <p className="text-[15px] font-bold text-ink leading-snug">{order.course.title}</p>
                  </div>

                  <div className="border-t border-line pt-4 space-y-3">
                    <SidebarRow label={t("amount")} value={formatMad(order.amountCents)} bold />
                    <SidebarRow label={t("status")} value={t("waitingForPayment")} />
                    <SidebarRow
                      label={t("orderCreated")}
                      value={order.createdAt.toLocaleDateString(dateLocale, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    />
                    <div className="flex items-center justify-between gap-2 text-[13px]">
                      <span className="text-muted font-medium flex items-center gap-1.5">
                        <Clock size={12} className="text-muted" />
                        {t("expiresIn")}
                      </span>
                      <span className="font-semibold text-ink">
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
      <span className="text-[12px] font-semibold text-muted uppercase tracking-[.06em] shrink-0 pt-0.5 min-w-[100px]">
        {label}
      </span>
      <div className="flex items-center gap-2 min-w-0">
        <span className={`text-[13px] font-semibold text-ink break-all ${mono ? "font-mono" : ""}`}>
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
      <span className="text-muted font-medium">{label}</span>
      <span className={bold ? "font-bold text-ink" : "font-semibold text-ink"}>{value}</span>
    </div>
  );
}
