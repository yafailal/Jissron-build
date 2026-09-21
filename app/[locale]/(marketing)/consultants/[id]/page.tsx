import { notFound } from "next/navigation";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Star, Globe, Clock } from "lucide-react";
import { PageBand } from "@/components/marketing/PageBand";
import { auth } from "@/lib/auth";
import {
  getConsultantById,
  parseAvailability,
  generateBookableSlots,
} from "@/lib/data/consultants";
import { isStripeConfigured } from "@/lib/stripe";
import { isCmiConfiguredServer } from "@/lib/cmi";
import { formatPrice } from "@/lib/currency";
import { getCurrentCurrency } from "@/lib/currency-server";
import { ConsultBookingWidget } from "@/components/consultants/ConsultBookingWidget";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

function toIntlLocale(locale: string) {
  return locale === "en" ? "en-US" : locale === "ar" ? "ar-u-nu-latn" : locale;
}

export async function generateMetadata({ params }: PageProps) {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "Consultants.detail" });
  const c = await getConsultantById(id);
  if (!c) return { title: t("metaFallbackTitle") };
  return {
    title: t("metaTitle", { name: c.user.name ?? t("fallbackName") }),
    description: c.tagline ?? c.bio.slice(0, 160),
  };
}

export default async function ConsultantDetailPage({ params }: PageProps) {
  const { id } = await params;
  const t = await getTranslations("Consultants.detail");
  const locale = await getLocale();
  const [consultant, currency, stripeConfigured, cmiConfigured] = await Promise.all([
    getConsultantById(id),
    getCurrentCurrency(),
    isStripeConfigured(),
    isCmiConfiguredServer(),
  ]);
  if (!consultant) notFound();

  const session = await auth();
  const availability = parseAvailability(consultant.availability);
  const bookable = await generateBookableSlots({
    consultantId: consultant.id,
    durationMins: consultant.durationMins,
    availability,
  });

  const daySlots = bookable.map((d) => {
    const date = d.date;
    return {
      dateIso: date.toISOString().slice(0, 10),
      dayLabel: date.toLocaleDateString(toIntlLocale(locale), {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
      slotsIso: d.slots.map((s) => s.toISOString()),
    };
  });

  const rate = formatPrice(
    consultant.ratePerSessionMadCents,
    consultant.ratePerSessionUsdCents,
    currency
  );

  return (
    <main className="bg-bg-soft min-h-screen pb-10">
      <PageBand
        eyebrow={
          <span className="inline-flex items-center gap-2">
            <Link href="/consultants" className="hover:text-white transition-colors">
              {t("breadcrumb")}
            </Link>
            <span>/</span>
            <span className="text-white/70">{consultant.user.name ?? t("fallbackName")}</span>
          </span>
        }
        title={consultant.user.name ?? t("fallbackName")}
        description={consultant.tagline || undefined}
      />

      <section className="wrap py-8">
        <div className="grid lg:grid-cols-[1.6fr_1fr] gap-8 lg:gap-10">
            <div className="min-w-0">
              <div className="flex items-center gap-4">
                {consultant.user.image ? (
                  <Image
                    src={consultant.user.image}
                    alt={consultant.user.name ?? t("fallbackName")}
                    width={72}
                    height={72}
                    className="w-[72px] h-[72px] rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div
                    className="w-[72px] h-[72px] rounded-full shrink-0"
                    style={{
                      background: consultant.avatarGradient ?? "linear-gradient(135deg, #064e3b, #0e7a5a)",
                    }}
                  />
                )}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3 text-[12.5px] text-muted">
                    {consultant.avgRating > 0 && (
                      <span className="inline-flex items-center gap-0.5">
                        <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                        {t("ratingSessions", { rating: consultant.avgRating.toFixed(1), count: consultant.totalSessions })}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {t("sessionLength", { count: consultant.durationMins })}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      {consultant.language.toUpperCase()} · {consultant.timezone}
                    </span>
                  </div>
                </div>
              </div>

              {consultant.skills.length > 0 && (
                <div className="mt-6">
                  <p className="text-[10.5px] uppercase tracking-wider font-bold text-muted mb-2">
                    {t("expertise")}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {consultant.skills.map((s) => (
                      <span
                        key={s}
                        className="inline-flex px-2.5 py-1 rounded-full bg-primary-softer border border-primary-soft text-[12px] font-semibold text-ink"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <article className="mt-6">
                <h2 className="text-[22px] font-extrabold tracking-[-0.02em] text-ink mb-2">{t("about")}</h2>
                <p className="text-[15px] text-body-text leading-[1.75] whitespace-pre-line">
                  {consultant.bio}
                </p>
              </article>

              {availability.some((d) => d.slots.length > 0) && (
                <div className="mt-6">
                  <h2 className="text-[22px] font-extrabold tracking-[-0.02em] text-ink mb-2">{t("weekly")}</h2>
                  <ul className="space-y-1.5">
                    {availability
                      .filter((d) => d.slots.length > 0)
                      .map((d) => (
                        <li key={d.day} className="flex gap-2 text-[12.5px] text-ink">
                          <span className="font-bold w-24">{t.has(`days.${d.day}`) ? t(`days.${d.day}`) : d.day}</span>
                          <span className="text-muted">
                            {d.slots.map((s) => `${s.start}–${s.end}`).join(", ")}
                          </span>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Booking card */}
            <aside className="lg:sticky lg:top-24 self-start bg-white border border-line rounded-2xl p-5">
              <div className="mb-4">
                <p className="text-[10.5px] uppercase tracking-wider font-bold text-muted">{t("rate")}</p>
                <p className="text-[28px] font-extrabold tracking-[-0.02em] text-ink leading-none mt-1">
                  {rate}
                  <span className="text-[12px] text-muted font-medium ms-1">
                    {t("perShort", { count: consultant.durationMins })}
                  </span>
                </p>
              </div>

              <ConsultBookingWidget
                consultantId={consultant.id}
                durationMins={consultant.durationMins}
                rateMadCents={consultant.ratePerSessionMadCents}
                rateUsdCents={consultant.ratePerSessionUsdCents}
                daySlots={daySlots}
                cmiConfigured={cmiConfigured}
                stripeConfigured={stripeConfigured}
                isAuthenticated={!!session}
                signinHref={`/signin?callbackUrl=/consultants/${consultant.id}`}
              />
            </aside>
        </div>
      </section>
    </main>
  );
}
