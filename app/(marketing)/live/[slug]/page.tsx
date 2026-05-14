import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
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
import { auth } from "@/lib/auth";
import {
  getLiveSessionForPublic,
  deriveLiveSessionAccess,
} from "@/lib/data/live-sessions";
import { formatPrice } from "@/lib/currency";
import { getCurrentCurrency } from "@/lib/currency-server";
import { BookFreeSessionButton } from "@/components/live/BookFreeSessionButton";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const KIND_LABEL: Record<string, string> = {
  AMA: "Free AMA",
  WORKSHOP: "Workshop",
  SEMINAR: "Seminar",
  COHORT: "Cohort",
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const data = await getLiveSessionForPublic(slug, null);
  if (!data) return { title: "Live session — JissrON" };
  return {
    title: `${data.live.title} — JissrON Live`,
    description: data.live.description.slice(0, 160),
  };
}

export default async function LiveSessionDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const session = await auth();
  const currency = await getCurrentCurrency();

  const data = await getLiveSessionForPublic(slug, session?.user.id ?? null);
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

  const startDateLabel = format(live.startsAt, "EEEE, MMM d, yyyy");
  const startTimeLabel = format(live.startsAt, "HH:mm");
  const endTimeLabel = format(new Date(endsMs), "HH:mm");

  return (
    <main className="bg-bg-soft min-h-screen pb-16">
      {/* Header band — same Atlas Blue treatment as course detail hero */}
      <section className="bg-gradient-to-b from-primary/[0.08] via-primary/[0.04] to-transparent border-b border-line">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="flex items-center gap-2 mb-4 text-[12px] font-600 text-muted">
            <Link href="/live" className="hover:text-primary transition-colors">
              Live sessions
            </Link>
            <span>/</span>
            <span className="text-ink/60">{KIND_LABEL[live.kind] ?? live.kind}</span>
          </div>

          <div className="grid lg:grid-cols-[1.6fr_1fr] gap-8 lg:gap-12">
            {/* LEFT — title + meta */}
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 mb-3">
                {live.status === "LIVE" ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-500 text-white text-[10.5px] font-700 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    Live now
                  </span>
                ) : live.status === "CANCELLED" ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10.5px] font-700 uppercase tracking-wider">
                    Cancelled
                  </span>
                ) : live.status === "ENDED" ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10.5px] font-700 uppercase tracking-wider">
                    Ended
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary-soft text-primary text-[10.5px] font-700 uppercase tracking-wider">
                    {KIND_LABEL[live.kind] ?? live.kind}
                  </span>
                )}
                {live.category && (
                  <Link
                    href={`/courses?category=${live.category.slug}`}
                    className="inline-flex items-center px-2 py-0.5 rounded-md border border-line text-muted hover:text-ink text-[10.5px] font-600"
                  >
                    {live.category.name}
                  </Link>
                )}
              </div>
              <h1 className="text-[26px] sm:text-[32px] font-800 text-ink leading-[1.15] tracking-tight">
                {live.title}
              </h1>

              {/* Host row */}
              <div className="flex items-center gap-3 mt-5">
                {live.host.image ? (
                  <Image
                    src={live.host.image}
                    alt={live.host.name ?? "Host"}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-bright text-white grid place-items-center text-[14px] font-700">
                    {(live.host.name ?? "?")[0]?.toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-[10.5px] uppercase tracking-wider font-700 text-muted">Hosted by</p>
                  <p className="text-[14px] font-700 text-ink">{live.host.name ?? "Instructor"}</p>
                </div>
              </div>

              {/* Meta strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                <MetaCell icon={Calendar} label="Date" value={startDateLabel} />
                <MetaCell
                  icon={Clock}
                  label="Time"
                  value={`${startTimeLabel}–${endTimeLabel}`}
                  hint={`${live.durationMins} min`}
                />
                <MetaCell
                  icon={Users}
                  label="Seats"
                  value={`${seatsTaken}/${live.seatsTotal}`}
                  hint={
                    seatsLeft === 0
                      ? "Sold out"
                      : seatsLeft < 10
                      ? `${seatsLeft} left`
                      : "Open"
                  }
                />
                <MetaCell icon={Languages} label="Language" value={live.language.toUpperCase()} />
              </div>
            </div>

            {/* RIGHT — booking card */}
            <aside className="lg:sticky lg:top-24 self-start bg-white border border-line rounded-xl p-5 shadow-sm">
              <div className="mb-4">
                <p className="text-[10.5px] uppercase tracking-wider font-700 text-muted">Price</p>
                <p className="text-[28px] font-800 text-ink leading-none mt-1">
                  {live.isFree
                    ? "Free"
                    : formatPrice(live.priceMadCents, live.priceUsdCents, currency)}
                </p>
                {!live.isFree && (
                  <p className="text-[11px] text-muted mt-1">single session · one-time payment</p>
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
                  className="block w-full text-center h-11 leading-[44px] rounded-md bg-bg-soft border border-line text-muted text-[13px] font-700 cursor-not-allowed"
                >
                  Session ended
                </button>
              ) : live.status === "CANCELLED" ? (
                <button
                  type="button"
                  disabled
                  className="block w-full text-center h-11 leading-[44px] rounded-md bg-bg-soft border border-line text-muted text-[13px] font-700 cursor-not-allowed"
                >
                  Cancelled
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
                <div className="space-y-2">
                  <button
                    type="button"
                    disabled
                    title="Paid live sessions coming soon"
                    className="block w-full text-center h-11 rounded-md bg-bg-soft border border-line text-muted text-[13px] font-700 cursor-not-allowed"
                  >
                    Booking coming soon
                  </button>
                  <p className="text-[11px] text-muted text-center">
                    Paid live sessions open soon. Get notified by enrolling in a course.
                  </p>
                </div>
              )}

              <ul className="mt-5 space-y-2 text-[12px] text-ink/80">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  Live Zoom/Meet link — opens 15 min before start
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  Reminder email 1 hour before
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  Recording afterwards (if recorded)
                </li>
              </ul>
            </aside>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid lg:grid-cols-[1.6fr_1fr] gap-8">
          <article className="min-w-0">
            <h2 className="text-[18px] font-800 text-ink mb-3">About this session</h2>
            <div
              className="prose prose-sm max-w-none text-ink/85"
              dangerouslySetInnerHTML={{ __html: live.description }}
            />
          </article>

          <aside className="lg:pt-10">
            <div className="bg-white border border-line rounded-xl p-5">
              <h3 className="text-[13px] font-700 text-ink mb-3">Your host</h3>
              <div className="flex items-start gap-3">
                {live.host.image ? (
                  <Image
                    src={live.host.image}
                    alt={live.host.name ?? "Host"}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-bright text-white grid place-items-center text-[16px] font-700 shrink-0">
                    {(live.host.name ?? "?")[0]?.toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-[14px] font-700 text-ink">{live.host.name ?? "Instructor"}</p>
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
    <div className="bg-white border border-line rounded-lg p-3">
      <div className="flex items-center gap-1.5 text-muted">
        <Icon size={13} />
        <span className="text-[10px] uppercase tracking-wider font-700">{label}</span>
      </div>
      <p className="text-[13.5px] font-700 text-ink mt-1 leading-snug">{value}</p>
      {hint && <p className="text-[11px] text-muted mt-0.5">{hint}</p>}
    </div>
  );
}

function JoinPanel({
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
  if (status === "CANCELLED") {
    return (
      <div className="flex items-start gap-2 p-3 rounded-md bg-slate-50 border border-line">
        <AlertCircle className="w-4 h-4 text-muted shrink-0 mt-0.5" />
        <p className="text-[12px] text-muted">
          This session was cancelled. We&apos;ll refund your booking shortly if it was paid.
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
          className="inline-flex w-full items-center justify-center gap-1.5 h-11 rounded-md bg-primary text-white text-[13px] font-700 hover:bg-primary-hover transition-colors"
        >
          <PlayCircle className="w-4 h-4" />
          Watch the recording
        </a>
      );
    }
    return (
      <div className="flex items-start gap-2 p-3 rounded-md bg-slate-50 border border-line">
        <AlertCircle className="w-4 h-4 text-muted shrink-0 mt-0.5" />
        <p className="text-[12px] text-muted">
          Session ended. The recording will be posted here when it&apos;s ready.
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
        className="inline-flex w-full items-center justify-center gap-1.5 h-11 rounded-md bg-emerald-600 text-white text-[13px] font-700 hover:bg-emerald-700 transition-colors"
      >
        <Video className="w-4 h-4" />
        {isOngoing ? "Join the session now" : "Open meeting room"}
      </a>
    );
  }

  // Has booking but join window hasn't opened
  const minsUntilOpen = Math.max(0, Math.round((joinOpensAt.getTime() - Date.now()) / 60000));
  return (
    <div className="flex items-start gap-2 p-3 rounded-md bg-primary-soft border border-primary/20">
      <Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
      <div className="text-[12px] text-ink/85">
        <p className="font-700 text-ink">Meeting link opens 15 min before start</p>
        <p className="text-muted mt-0.5">
          Starts {format(startsAt, "MMM d 'at' HH:mm")} · in roughly {minsUntilOpen > 60 ? `${Math.round(minsUntilOpen / 60)}h` : `${minsUntilOpen} min`}
        </p>
      </div>
    </div>
  );
}
