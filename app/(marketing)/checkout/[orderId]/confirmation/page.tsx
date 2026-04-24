import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { auth } from "@/lib/auth";
import { getOrder } from "@/lib/data/orders";

interface PageProps {
  params: Promise<{ orderId: string }>;
}

function formatMad(cents: number) {
  return (cents / 100).toLocaleString("fr-MA", { minimumFractionDigits: 0 }) + " MAD";
}

const STEPS = [
  "You transfer [amount] MAD to our bank account",
  "We verify the transfer in your bank feed",
  "You receive an enrollment confirmation email",
  "You access the course from your dashboard",
];

export default async function CheckoutConfirmationPage({ params }: PageProps) {
  const { orderId } = await params;

  const session = await auth();
  if (!session) redirect(`/signin?callbackUrl=/checkout/${orderId}/confirmation`);

  const order = await getOrder(orderId);
  if (!order) notFound();
  if (order.userId !== session.user.id) notFound();

  const amountLabel = formatMad(order.amountCents);
  const steps = STEPS.map((s) => s.replace("[amount]", String(Math.round(order.amountCents / 100))));

  return (
    <main id="main-content" className="min-h-screen bg-bg-soft">
      {/* Progress indicator */}
      <div className="border-b border-line bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3 text-sm">
          <span className="text-muted font-500">Step 1</span>
          <span className="text-line">—</span>
          <span className="text-muted font-500">Step 2</span>
          <span className="text-line">—</span>
          <span className="font-700 text-primary">Step 3 — Confirmation</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 grid place-items-center">
            <CheckCircle size={32} className="text-primary" strokeWidth={1.75} />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-800 text-ink text-center mb-2">
          Thanks! We&apos;re reviewing your payment.
        </h1>
        <p className="text-[14px] text-muted font-500 text-center leading-relaxed mb-10">
          We&apos;ll send you an email as soon as your enrollment is confirmed. Usually within 1-2 business days.
        </p>

        {/* Order reference */}
        <div className="bg-white rounded-2xl border border-line p-6 mb-6 text-center">
          <p className="text-[12px] font-700 uppercase tracking-[.08em] text-muted mb-2">Your order reference</p>
          <p className="text-4xl font-800 text-ink tracking-widest mb-1">
            {order.orderReference}
          </p>
          <p className="text-[13px] text-muted font-500">{order.course.title} · {amountLabel}</p>
        </div>

        {/* What happens next */}
        <div className="bg-white rounded-2xl border border-line p-6 mb-8">
          <h2 className="text-[13px] font-700 uppercase tracking-[.08em] text-muted mb-5">
            What happens next
          </h2>
          <ol className="space-y-4">
            {steps.map((step, i) => (
              <li key={i} className="flex items-start gap-4">
                <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-[12px] font-800 grid place-items-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-[14px] text-body-text font-500 leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center h-12 px-10 rounded-xl bg-primary text-white font-700 text-[15px] hover:bg-primary-hover transition-colors"
          >
            Go to my dashboard
          </Link>
          <p className="text-[13px] text-muted font-500 text-center">
            Didn&apos;t complete the transfer yet?{" "}
            <Link href={`/checkout/${orderId}`} className="text-primary font-600 hover:underline">
              Resume your order →
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
