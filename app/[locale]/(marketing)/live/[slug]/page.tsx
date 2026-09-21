import { notFound } from "next/navigation";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { format } from "date-fns";
import { getLocale, getTranslations } from "next-intl/server";
import {
  Calendar,
  Clock,
  Users,
  Video,
  PlayCircle,
  Languages,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { PageBand } from "@/components/marketing/PageBand";
import { auth } from "@/lib/auth";
import {
  getLiveSessionForPublic,
  deriveLiveSessionAccess,
} from "@/lib/data/live-sessions";
import { formatPrice } from "@/lib/currency";
import { getCurrentCurrency } from "@/lib/currency-server";
import { BookFreeSessionButton } from "@/components/live/BookFreeSessionButton";
import { PaidSessionCheckoutButton } from "@/components/live/PaidSessionCheckoutButton";
import { isStripeConfigured } from "@/lib/stripe";
import { isCmiConfiguredServer } from "@/lib/cmi";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

function toIntlLocale(locale: string) {
  return locale === "en" ? "en-US" : locale === "ar" ? "ar-u-nu-latn" : locale;
}


export async function generateMetadata({ params }: PageProps) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "Live.detail" });
  const data = await getLiveSessionForPublic(slug, null);
  if (!data) return { title: t("metaFallbackTitle") };
  return {
    title: t("metaTitle", { title: data.live.title }),
    description: data.live.description.slice(0, 160),
  };
}

export default async function LiveSessionDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const t = await getTranslations("Live.detail");
  const tk = await getTranslations("Live.kind");
  const locale = await getLocale();
  const kindLabel = (k: string) => (tk.has(k) ? tk(k) : k);
  const session = await auth();
  const currency = await getCurrentCurrency();

  const [data, stripeConfigured, cmiConfigured] = await Promise.all([
    getLiveSessionForPublic(slug, session?.user.id ?? null),
    isStripeConfigured(),
    isCmiConfiguredServer(),
  ]);
  if (!data) notFound();

  const { live, viewerBooking, seatsTaken, seatsLeft } = data;

  const isHost = session?.user.id === live.hostId;
  const isAdmin = session?.user.role === "ADMIN";

  const access = deriveLiveSessionAccess({
    startsAt: live.startsAt,
    durationMins: live.durationMins,
    status: live.status,
    meetingUrl: live.meetingUrl,
    recordingUrl: live.recordingUrl,
    hasBooking: !!viewerBooking,
    isHost,
    isAdmin,
  });

  const now = Date.now();
  const startsMs = live.startsAt.getTime();
  const endsMs = startsMs + live.durationMins * 60 * 1000;
  const isUpcoming = startsMs > now && live.status !== "CANCELLED" && live.status !== "ENDED";
  const isOngoing = now >= startsMs && now <= endsMs && live.status !== "CANCELLED" && live.status !== "ENDED";

  const startDateLabel = new Intl.DateTimeFormat(toIntlLocale(locale), {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(live.startsAt);
  const startTimeLabel = format(live.startsAt, "HH:mm");
  const endTimeLabel = format(new Date(endsMs), "HH:mm");

  return (
    <main className="bg-bg-soft min-h-screen pb-10">
      <PageBand
        eyebrow={
          <span className="inline-flex items-center gap-2">
            <Link href="/live" className="hover:text-white transition-colors">
              {t("breadcrumb")}
            </Link>
            <span>/</span>
            <span className="text-white/70">{kindLabel(live.kind)}</span>
          </span>
        }
        title={live.title}
      >
              <div className="inline-flex items-center gap-1.5">
                {live.status === "LIVE" ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500 text-white text-[10.5px] font-bold uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    {t("liveNow")}
                  </span>
                ) : live.status === "CANCELLED" ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/15 text-white text-[10.5px] font-bold uppercase tracking-wider">
                    {t("cancelled")}
                  </span>
                ) : live.status === "ENDED" ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/15 text-white text-[10.5px] font-bold uppercase tracking-wider">
                    {t("ended")}
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white text-primary text-[10.5px] font-bold uppercase tracking-wider">
                    {kindLabel(live.kind)}
                  </span>
                )}
                {live.category && (
                  <Link
                    href={`/courses?category=${live.category.slug}`}
                    className="inline-flex items-center px-2 py-0.5 rounded-full border border-white/40 text-white/85 hover:text-white text-[10.5px] font-semibold"
                  >
                    {live.category.name}
                  </Link>
                )}
              </div>
      </PageBand>

      <section className="wrap py-8">
        <div className="grid lg:grid-cols-[1.6fr_1fr] gap-8 lg:gap-10">
          <div className="min-w-0">
              <div className="flex items-center gap-3 ">
                {live.host.image ? (
                  <Image
                    src={live.host.image}
                    alt={live.host.name ?? t("hostAlt")}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-mid text-white grid place-items-center text-[14px] font-bold">
                    {(live.host.name ?? "?")[0]?.toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-[10.5px] uppercase tracking-wider font-bold text-muted">{t("hostedBy")}</p>
                  <p className="text-[14px] font-bold text-ink">{live.host.name ?? t("instructor")}</p>
                </div>
              </div>

              {/* Meta strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                <MetaCell icon={Calendar} label={t("date")} value={startDateLabel} />
                <MetaCell
                  icon={Clock}
                  label={t("time")}
                  value={`${startTimeLabel}–${endTimeLabel}`}
                  hint={t("minutes", { count: live.durationMins })}
                />
                <MetaCell
                  icon={Users}
                  label={t("seats")}
                  value={`${seatsTaken}/${live.seatsTotal}`}
                  hint={
                    seatsLeft === 0
                      ? t("soldOut")
                      : seatsLeft < 10
                      ? t("left", { count: seatsLeft })
                      : t("open")
                  }
                />
                <MetaCell icon={Languages} label={t("language")} value={live.language.toUpperCase()} />
              </div>

            <article className="mt-8">
              <h2 className="text-[22px] font-extrabold tracking-[-0.02em] text-ink mb-3">{t("about")}</h2>
              <div
                className="text-[15px] leading-[1.75] text-body-text break-words [&_h2]:text-[19px] [&_h2]:font-extrabold [&_h2]:text-ink [&_h2]:mt-6 [&_h2]:mb-2 [&_h3]:text-[16px] [&_h3]:font-bold [&_h3]:text-ink [&_h3]:mt-5 [&_h3]:mb-2 [&_p]:my-3 [&_strong]:font-bold [&_strong]:text-ink [&_a]:text-primary-mid [&_a]:underline [&_ul]:list-disc [&_ul]:ps-6 [&_ul]:my-3 [&_ol]:list-decimal [&_ol]:ps-6 [&_ol]:my-3 [&_li]:my-1 [&_img]:max-w-full [&_img]:h-auto"
                dangerouslySetInnerHTML={{ __html: live.description }}
              />
            </article>
          </div>

          <aside className="lg:sticky lg:top-24 self-start space-y-4 min-w-0">
            <div className="bg-white border border-line rounded-2xl p-5">
              <div className="mb-4">
                <p className="text-[10.5px] uppercase tracking-wider font-bold text-muted">{t("price")}</p>
                <p className="text-[28px] font-extrabold tracking-[-0.02em] text-ink leading-none mt-1">
                  {live.isFree
                    ? t("free")
                    : formatPrice(live.priceMadCents, live.priceUsdCents, currency)}
                </p>
                {!live.isFree && (
                  <p className="text-[11px] text-muted mt-1">{t("singleSession")}</p>
                )}
              </div>

              {/* Already-attendee state: show join controls */}
              {viewerBooking || isHost || isAdmin ? (
                <div className="space-y-3">
                  <JoinPanel
                    isOngoing={isOngoing}
                    canJoin={access.canJoin}
                    meetingUrl={access.meetingUrl}
                    recordingUrl={access.recordingUrl}
                    joinOpensAt={access.joinOpensAt}
                    startsAt={live.startsAt}
                    status={live.status}
                  />
                  {viewerBooking && !isHost && !isAdmin && isUpcoming && (
                    <BookFreeSessionButton
                      sessionId={live.id}
                      bookingId={viewerBooking.id}
                      seatsLeft={seatsLeft}
                      isAuthenticated
                      signinHref={`/signin?callbackUrl=/live/${slug}`}
                      cancellable={startsMs > now}
                    />
                  )}
                </div>
              ) : live.status === "ENDED" ? (
                <button
                  type="button"
                  disabled
                  className="block w-full text-center h-11 leading-[44px] rounded-full bg-bg-soft border border-line text-muted text-[13px] font-bold cursor-not-allowed"
                >
                  {t("sessionEnded")}
                </button>
              ) : live.status === "CANCELLED" ? (
                <button
                  type="button"
                  disabled
                  className="block w-full text-center h-11 leading-[44px] rounded-full bg-bg-soft border border-line text-muted text-[13px] font-bold cursor-not-allowed"
                >
                  {t("cancelled")}
                </button>
              ) : live.isFree ? (
                <BookFreeSessionButton
                  sessionId={live.id}
                  bookingId={null}
                  seatsLeft={seatsLeft}
                  isAuthenticated={!!session}
                  signinHref={`/signin?callbackUrl=/live/${slug}`}
                  cancellable
                />
              ) : (
                <PaidSessionCheckoutButton
                  sessionId={live.id}
                  priceMadCents={live.priceMadCents}
                  priceUsdCents={live.priceUsdCents}
                  cmiConfigured={cmiConfigured}
                  stripeConfigured={stripeConfigured}
                  isAuthenticated={!!session}
                  signinHref={`/signin?callbackUrl=/live/${slug}`}
                />
              )}

              <ul className="mt-5 space-y-2 text-[12px] text-ink/80">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary-bright shrink-0 mt-0.5" />
                  {t("perk1")}
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary-bright shrink-0 mt-0.5" />
                  {t("perk2")}
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary-bright shrink-0 mt-0.5" />
                  {t("perk3")}
                </li>
              </ul>
            </div>

            <div className="bg-white border border-line rounded-2xl p-5">
              <h3 className="text-[12px] font-bold uppercase tracking-[0.1em] text-primary-mid mb-3">{t("yourHost")}</h3>
              <div className="flex items-start gap-3">
                {live.host.image ? (
                  <Image
                    src={live.host.image}
                    alt={live.host.name ?? t("hostAlt")}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-mid text-white grid place-items-center text-[16px] font-bold shrink-0">
                    {(live.host.name ?? "?")[0]?.toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-[14px] font-bold text-ink">{live.host.name ?? t("instructor")}</p>
                  {live.host.bio && (
                    <p className="text-[12px] text-muted mt-1 line-clamp-4">{live.host.bio}</p>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function MetaCell({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="bg-white border border-line rounded-2xl p-3">
      <div className="flex items-center gap-1.5 text-muted">
        <Icon size={13} />
        <span className="text-[10px] uppercase tracking-wider font-bold">{label}</span>
      </div>
      <p className="text-[13.5px] font-bold text-ink mt-1 leading-snug">{value}</p>
      {hint && <p className="text-[11px] text-muted mt-0.5">{hint}</p>}
    </div>
  );
}

async function JoinPanel({
  isOngoing,
  canJoin,
  meetingUrl,
  recordingUrl,
  joinOpensAt,
  startsAt,
  status,
}: {
  isOngoing: boolean;
  canJoin: boolean;
  meetingUrl: string | null;
  recordingUrl: string | null;
  joinOpensAt: Date;
  startsAt: Date;
  status: string;
}) {
  const t = await getTranslations("Live.detail.join");
  const locale = await getLocale();
  if (status === "CANCELLED") {
    return (
      <div className="flex items-start gap-2 p-3 rounded-2xl bg-primary-softer border border-primary-soft">
        <AlertCircle className="w-4 h-4 text-muted shrink-0 mt-0.5" />
        <p className="text-[12px] text-muted">
          {t("cancelledNote")}
        </p>
      </div>
    );
  }

  if (status === "ENDED") {
    if (recordingUrl) {
      return (
        <a
          href={recordingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center gap-1.5 h-11 rounded-full bg-primary text-white text-[13px] font-bold hover:bg-primary-hover transition-colors"
        >
          <PlayCircle className="w-4 h-4" />
          {t("watchRecording")}
        </a>
      );
    }
    return (
      <div className="flex items-start gap-2 p-3 rounded-2xl bg-primary-softer border border-primary-soft">
        <AlertCircle className="w-4 h-4 text-muted shrink-0 mt-0.5" />
        <p className="text-[12px] text-muted">
          {t("endedNote")}
        </p>
      </div>
    );
  }

  if (canJoin && meetingUrl) {
    return (
      <a
        href={meetingUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex w-full items-center justify-center gap-1.5 h-11 rounded-full bg-primary text-white text-[13px] font-bold hover:bg-primary-hover transition-colors"
      >
        <Video className="w-4 h-4" />
        {isOngoing ? t("joinNow") : t("openRoom")}
      </a>
    );
  }

  // Has booking but join window hasn't opened
  const minsUntilOpen = Math.max(0, Math.round((joinOpensAt.getTime() - Date.now()) / 60000));
  return (
    <div className="flex items-start gap-2 p-3 rounded-2xl bg-primary-soft border border-primary/20">
      <Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
      <div className="text-[12px] text-ink/85">
        <p className="font-bold text-ink">{t("linkOpens")}</p>
        <p className="text-muted mt-0.5">
          {t("startsIn", {
            date: new Intl.DateTimeFormat(toIntlLocale(locale), { month: "short", day: "numeric" }).format(startsAt),
            time: format(startsAt, "HH:mm"),
            eta:
              minsUntilOpen > 60
                ? t("hours", { count: Math.round(minsUntilOpen / 60) })
                : t("minutes", { count: minsUntilOpen }),
          })}
        </p>
      </div>
    </div>
  );
}
