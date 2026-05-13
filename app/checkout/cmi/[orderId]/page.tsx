import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  buildCmiFormData,
  cmiPaymentUrl,
  isCmiConfigured,
} from "@/lib/cmi";

interface PageProps {
  params: Promise<{ orderId: string }>;
}

export const metadata = { title: "Redirecting to secure payment…" };

/**
 * Auto-submits a signed CMI form to the hosted payment page.
 *
 * Why a dedicated page (vs. server action):
 *   - We need a real <form action="https://payment.cmi.co.ma/..." method="POST">
 *     submission by the browser, so the user lands on CMI's domain.
 *   - Server actions can't issue cross-origin POST redirects.
 *   - Signing happens server-side so the StoreKey never reaches the client.
 */
export default async function CmiCheckoutPage({ params }: PageProps) {
  const { orderId } = await params;

  const session = await auth();
  if (!session) redirect(`/signin?callbackUrl=/checkout/cmi/${orderId}`);

  const [order, settings] = await Promise.all([
    db.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        userId: true,
        status: true,
        paymentMethod: true,
        amountCents: true,
        orderReference: true,
        user: { select: { email: true, name: true } },
      },
    }),
    db.siteSettings.findUnique({
      where: { id: "default" },
      select: {
        cmiEnabled: true,
        cmiTestMode: true,
        cmiMerchantId: true,
        cmiStoreKey: true,
      },
    }),
  ]);

  if (!order) notFound();
  if (order.userId !== session.user.id) notFound();
  if (order.status !== "PENDING" || order.paymentMethod !== "CMI") {
    redirect(`/checkout/${orderId}/confirmation`);
  }
  if (!settings || !isCmiConfigured(settings)) {
    redirect(`/checkout/${orderId}?error=cmi_not_configured`);
  }
  if (!order.orderReference) {
    redirect(`/checkout/${orderId}?error=missing_reference`);
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  const formData = buildCmiFormData({
    merchantId: settings.cmiMerchantId!,
    storeKey: settings.cmiStoreKey!,
    orderRef: order.orderReference,
    amountCents: order.amountCents,
    okUrl: `${baseUrl}/api/cmi/callback`,
    failUrl: `${baseUrl}/api/cmi/callback`,
    email: order.user.email ?? undefined,
    billName: order.user.name ?? undefined,
    lang: "fr",
  });

  const actionUrl = cmiPaymentUrl(settings.cmiTestMode);

  return (
    <main className="min-h-screen grid place-items-center bg-bg-soft px-4">
      <div className="bg-white border border-line rounded-2xl shadow-card p-8 max-w-md w-full text-center">
        <div className="w-12 h-12 mx-auto mb-4 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <h1 className="text-lg font-700 text-ink mb-1">Redirecting to secure payment…</h1>
        <p className="text-sm text-muted">
          You&apos;ll be sent to CMI&apos;s secure card-payment page. If nothing happens, click the button below.
        </p>

        {/* Auto-submitted on load. The button is the no-JS fallback. */}
        <form id="cmi-form" method="POST" action={actionUrl} className="mt-5">
          {Object.entries(formData).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}
          <button
            type="submit"
            className="inline-flex items-center justify-center h-11 px-6 rounded-md bg-primary text-white font-700 text-sm hover:bg-primary-hover transition-colors"
          >
            Continue to payment
          </button>
        </form>

        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.getElementById('cmi-form').submit();`,
          }}
        />
      </div>
    </main>
  );
}
