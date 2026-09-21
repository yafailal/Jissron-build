import { notFound, redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { CheckCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { getOrder } from "@/lib/data/orders";

interface PageProps {
  params: Promise<{ orderId: string }>;
}

function formatMad(cents: number) {
  return (cents / 100).toLocaleString("fr-MA", { minimumFractionDigits: 0 }) + " MAD";
}

const STEP_KEYS = ["step1", "step2", "step3", "step4"] as const;

export default async function CheckoutConfirmationPage({ params }: PageProps) {
  const { orderId } = await params;
  const t = await getTranslations("Checkout");
  const tc = await getTranslations("Checkout.confirmation");

  const session = await auth();
  if (!session) redirect(`/signin?callbackUrl=/checkout/${orderId}/confirmation`);

  const order = await getOrder(orderId);
  if (!order) notFound();
  if (order.userId !== session.user.id) notFound();
  if (!order.course) notFound();

  const amountLabel = formatMad(order.amountCents);
  const steps = STEP_KEYS.map((k) => tc(k, { amount: String(Math.round(order.amountCents / 100)) }));

  return (
    <main id="main-content" className="min-h-screen bg-bg-soft">
      {/* Progress indicator */}
      <div className="border-b border-line bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3 text-sm">
          <span className="text-muted font-medium">{t("step1")}</span>
          <span className="text-line">—</span>
          <span className="text-muted font-medium">{t("step2")}</span>
          <span className="text-line">—</span>
          <span className="font-bold text-primary">{t("step3Confirmation")}</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 grid place-items-center">
            <CheckCircle size={32} className="text-primary" strokeWidth={1.75} />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-[22px] sm:text-[26px] font-extrabold tracking-[-0.02em] text-ink text-center mb-2">
          {tc("thanks")}
        </h1>
        <p className="text-[14px] text-muted font-medium text-center leading-relaxed mb-10">
          {tc("willEmail")}
        </p>

        {/* Order reference */}
        <div className="bg-white rounded-2xl border border-line p-6 mb-6 text-center">
          <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-primary-mid mb-2">{tc("yourReference")}</p>
          <p className="text-3xl sm:text-4xl font-extrabold text-primary tracking-widest mb-1">
            {order.orderReference}
          </p>
          <p className="text-[13px] text-muted font-medium">{order.course.title} · {amountLabel}</p>
        </div>

        {/* What happens next */}
        <div className="bg-white rounded-2xl border border-line p-6 mb-8">
          <h2 className="text-[12px] font-bold uppercase tracking-[0.1em] text-primary-mid mb-5">
            {tc("whatNext")}
          </h2>
          <ol className="space-y-4">
            {steps.map((step, i) => (
              <li key={i} className="flex items-start gap-4">
                <span className="w-7 h-7 rounded-full bg-primary-soft text-primary text-[12px] font-extrabold grid place-items-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-[14px] text-body-text font-medium leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center h-11 px-8 rounded-full bg-primary text-white font-bold text-[15px] hover:bg-primary-hover transition-colors"
          >
            {tc("goDashboard")}
          </Link>
          <p className="text-[13px] text-muted font-medium text-center">
            {tc("notYet")}{" "}
            <Link href={`/checkout/${orderId}`} className="text-primary font-semibold hover:underline">
              {tc("resume")}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
