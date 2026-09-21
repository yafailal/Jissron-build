import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function SuggestCourseCTA() {
  const t = await getTranslations("Courses");
  return (
    <section
      className="mt-8 rounded-2xl px-6 py-8 sm:px-10 sm:py-10 text-white"
      style={{ background: "linear-gradient(135deg, #064e3b 0%, #0b6b53 62%, #0e7a5a 100%)" }}
    >
      <div className="max-w-[640px]">
        <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.1em] text-primary-bright">
          {t("suggest.eyebrow")}
        </p>
        <h2 className="mb-3 text-[22px] font-extrabold leading-[1.15] tracking-[-0.02em] text-white sm:text-[26px]">
          {t("suggest.title1")} {t("suggest.title2")}
        </h2>
        <p className="mb-6 text-[15px] leading-relaxed text-white/85">{t("suggest.body")}</p>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/suggest"
            className="inline-flex h-11 items-center justify-center rounded-full bg-white px-6 font-bold text-primary transition-colors hover:bg-primary-soft"
          >
            {t("suggest.cta")}
          </Link>
          <Link
            href="/teach"
            className="inline-flex h-11 items-center justify-center rounded-full border-[1.5px] border-white/70 px-6 font-bold text-white transition-colors hover:bg-white hover:text-primary"
          >
            {t("suggest.teach")}
          </Link>
        </div>
      </div>
    </section>
  );
}
