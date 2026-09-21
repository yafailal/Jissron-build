import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { Star, Calendar, Sparkles } from "lucide-react";
import { PageBand } from "@/components/marketing/PageBand";
import { listPublicConsultants, parseAvailability } from "@/lib/data/consultants";
import { formatPrice } from "@/lib/currency";
import { getCurrentCurrency } from "@/lib/currency-server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Consultants.index" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function ConsultantsIndexPage() {
  const t = await getTranslations("Consultants.index");
  const [consultants, currency] = await Promise.all([
    listPublicConsultants(),
    getCurrentCurrency(),
  ]);

  return (
    <main className="bg-bg-soft min-h-screen pb-10">
      <PageBand eyebrow={t("eyebrow")} title={t("title")} description={t("intro")} />

      <section className="wrap py-8">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-[22px] font-extrabold tracking-[-0.02em] text-ink">{t("available")}</h2>
          <p className="text-[12px] text-muted">
            {t("expertCount", { count: consultants.length })}
          </p>
        </div>

        {consultants.length === 0 ? (
          <div className="bg-white border border-line rounded-2xl p-10 text-center">
            <p className="text-[14px] font-bold text-ink mb-1">{t("emptyTitle")}</p>
            <p className="text-[12.5px] text-muted">{t("emptyText")}</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {consultants.map((c) => {
              const avail = parseAvailability(c.availability);
              const totalRanges = avail.reduce((sum, d) => sum + d.slots.length, 0);
              const daysAvailable = avail.filter((d) => d.slots.length > 0).length;
              const rate = formatPrice(c.ratePerSessionMadCents, c.ratePerSessionUsdCents, currency);
              return (
                <Link
                  key={c.id}
                  href={`/consultants/${c.id}`}
                  className="group bg-white border border-line rounded-2xl p-5 hover:border-primary hover:shadow-card transition-all"
                >
                  <div className="flex items-start gap-3 mb-3">
                    {c.user.image ? (
                      <Image
                        src={c.user.image}
                        alt={c.user.name ?? t("fallbackName")}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-full shrink-0"
                        style={{
                          background: c.avatarGradient ?? "linear-gradient(135deg, #064e3b, #0e7a5a)",
                        }}
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <p className="text-[14px] font-bold text-ink truncate group-hover:text-primary transition-colors">
                          {c.user.name ?? t("fallbackName")}
                        </p>
                        {c.isFeatured && (
                          <Sparkles className="w-3 h-3 text-primary shrink-0" />
                        )}
                      </div>
                      {c.tagline && (
                        <p className="text-[11.5px] text-muted truncate mt-0.5">{c.tagline}</p>
                      )}
                    </div>
                  </div>

                  {c.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {c.skills.slice(0, 3).map((s) => (
                        <span
                          key={s}
                          className="inline-flex px-2 py-0.5 rounded-full bg-primary-softer border border-primary-soft text-[10.5px] font-semibold text-ink"
                        >
                          {s}
                        </span>
                      ))}
                      {c.skills.length > 3 && (
                        <span className="text-[10.5px] text-muted font-medium">
                          +{c.skills.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-line">
                    <div className="flex items-center gap-3 text-[11px] text-muted">
                      {c.avgRating > 0 && (
                        <span className="inline-flex items-center gap-0.5">
                          <Star className="w-3 h-3 text-primary fill-primary" />
                          {c.avgRating.toFixed(1)}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-0.5">
                        <Calendar className="w-3 h-3" />
                        {daysAvailable === 0
                          ? t("byRequest")
                          : t("daysPerWeek", { count: daysAvailable })}
                      </span>
                    </div>
                    <p className="text-[14px] font-extrabold text-primary">
                      {rate}
                      <span className="text-[10px] text-muted font-medium"> {t("perShort", { count: c.durationMins })}</span>
                    </p>
                  </div>
                  <p className="sr-only">{t("windows", { count: totalRanges })}</p>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
