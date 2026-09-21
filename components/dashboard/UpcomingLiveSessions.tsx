import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { format, formatDistanceToNowStrict } from "date-fns";
import { enUS, fr, ar, es } from "date-fns/locale";
import { getLocale, getTranslations } from "next-intl/server";
import { Video, ArrowUpRight } from "lucide-react";

const DATE_LOCALES = { en: enUS, fr, ar, es } as const;
const KIND_KEYS = ["AMA", "WORKSHOP", "SEMINAR", "COHORT"] as const;

interface BookingItem {
  id: string;
  liveSession: {
    id: string;
    slug: string;
    title: string;
    startsAt: Date;
    durationMins: number;
    status: string;
    kind: string;
    host: { name: string | null; image: string | null };
  };
}

interface Props {
  bookings: BookingItem[];
}

export async function UpcomingLiveSessions({ bookings }: Props) {
  if (bookings.length === 0) return null;
  const t = await getTranslations("Dashboard.live");
  const locale = await getLocale();
  const dfLocale = DATE_LOCALES[locale as keyof typeof DATE_LOCALES] ?? enUS;

  return (
    <section className="bg-white border border-line rounded-2xl p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[14px] font-bold text-ink flex items-center gap-1.5">
          <Video className="w-4 h-4 text-primary" />
          {t("heading")}
        </h2>
        <Link
          href="/live"
          className="text-[12px] font-semibold text-primary hover:underline inline-flex items-center gap-0.5"
        >
          {t("browseAll")} <ArrowUpRight className="w-3 h-3 rtl:-scale-x-100" />
        </Link>
      </div>

      <ul className="space-y-1">
        {bookings.map((b) => {
          const s = b.liveSession;
          const isLive = s.status === "LIVE";
          const startsMs = s.startsAt.getTime();
          const inWindow = startsMs - Date.now() < 15 * 60 * 1000 && startsMs + s.durationMins * 60_000 > Date.now();
          return (
            <Link
              key={b.id}
              href={`/live/${s.slug}`}
              className="flex items-center gap-3 px-2 py-2.5 rounded-2xl hover:bg-bg-soft transition-colors group"
            >
              {/* Date block */}
              <div className="w-12 text-center shrink-0">
                <p className="text-[10px] uppercase font-bold text-muted tracking-wide">
                  {format(s.startsAt, "MMM", { locale: dfLocale })}
                </p>
                <p className="text-[20px] font-extrabold text-primary leading-none">
                  {format(s.startsAt, "d", { locale: dfLocale })}
                </p>
                <p className="text-[10px] text-muted font-medium mt-0.5">
                  {format(s.startsAt, "HH:mm", { locale: dfLocale })}
                </p>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  {isLive ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500 text-white text-[9px] font-bold uppercase tracking-wider">
                      <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
                      {t("live")}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-primary-soft text-primary text-[9px] font-bold uppercase tracking-wider">
                      {(KIND_KEYS as readonly string[]).includes(s.kind) ? t(`kind.${s.kind}` as "kind.AMA") : s.kind}
                    </span>
                  )}
                  <span className="text-[10.5px] text-muted">
                    {t("startsIn", { distance: formatDistanceToNowStrict(s.startsAt, { locale: dfLocale }) })}
                  </span>
                </div>
                <p className="text-[13px] font-bold text-ink truncate mt-0.5 group-hover:text-primary transition-colors">
                  {s.title}
                </p>
                <p className="text-[11px] text-muted truncate">
                  {t("with", { name: s.host.name ?? t("instructor") })}
                </p>
              </div>

              {inWindow && (
                <span className="shrink-0 inline-flex items-center gap-1 px-2.5 h-7 rounded-full bg-primary text-white text-[11px] font-bold group-hover:bg-primary-hover transition-colors">
                  <Video className="w-3 h-3" />
                  {t("join")}
                </span>
              )}
            </Link>
          );
        })}
      </ul>
    </section>
  );
}
