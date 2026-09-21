import { MailCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Auth" });
  return { title: t("verifyTitle") };
}

export default async function VerifyRequestPage() {
  const t = await getTranslations("Auth");
  return (
    <main
      id="main-content"
      className="min-h-screen grid place-items-center bg-bg-soft px-4 py-16"
    >
      <div className="bg-white rounded-2xl border border-line w-full max-w-sm p-8 text-center">
        <div className="mx-auto mb-5 w-14 h-14 rounded-full bg-primary-soft grid place-items-center">
          <MailCheck className="text-primary" size={26} strokeWidth={2} />
        </div>

        <h1 className="text-[22px] font-extrabold text-ink leading-snug mb-2">
          {t("verifyTitle")}
        </h1>
        <p className="text-sm text-muted font-medium leading-relaxed mb-6">
          {t("verifyBody")}
        </p>

        <div className="text-start bg-primary-softer rounded-2xl p-4 mb-6 space-y-2">
          <p className="text-xs font-bold text-primary-hover uppercase tracking-wide mb-2">
            {t("verifyDidntGet")}
          </p>
          <ul className="text-xs text-body-text font-medium space-y-1 list-none">
            <li className="flex gap-2">
              <span className="text-primary shrink-0">·</span>
              {t("verifySpam")}
            </li>
            <li className="flex gap-2">
              <span className="text-primary shrink-0">·</span>
              {t("verifyAddress")}
            </li>
            <li className="flex gap-2">
              <span className="text-primary shrink-0">·</span>
              {t.rich("verifyLinksFrom", { strong: (c) => <strong>{c}</strong> })}
            </li>
          </ul>
        </div>

        <Link
          href="/signin"
          className="
            inline-flex items-center justify-center w-full h-11
            rounded-full border-[1.5px] border-primary text-primary
            font-semibold text-sm transition-all duration-200
            hover:bg-primary hover:text-white hover:-translate-y-px
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-bright focus-visible:ring-offset-2
          "
        >
          {t("verifyTryDifferent")}
        </Link>
      </div>
    </main>
  );
}
