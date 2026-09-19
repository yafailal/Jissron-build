import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Clock, Users, Video } from "lucide-react";
import { getLiveSessionBySlug } from "@/lib/data/live-sessions";
import { getCurrentCurrency } from "@/lib/currency-server";
import { formatPrice } from "@/lib/currency";

const KIND_LABEL: Record<string, string> = {
  AMA: "Free AMA",
  WORKSHOP: "Workshop",
  SEMINAR: "Seminar",
  COHORT: "Cohort",
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const session = await getLiveSessionBySlug(slug);
  return {
    title: session ? `${session.title} — AILearn` : "Live session — AILearn",
  };
}

export default async function LiveSessionDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const [session, currency] = await Promise.all([
    getLiveSessionBySlug(slug),
    getCurrentCurrency(),
  ]);

  if (!session) notFound();

  const date = new Date(session.startsAt);
  const dateLabel = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
  const timeLabel = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    hour12: false,
  });
  const isLive = session.status === "LIVE";
  const isEnded = session.status === "ENDED" || session.status === "CANCELLED";
  const seatsLeft = Math.max(0, session.seatsTotal - session._count.bookings);

  return (
    <main id="main-content" className="min-h-screen bg-white">
      <div className="bg-ink text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-white/60 mb-5 flex-wrap">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight size={12} />
            <Link href="/live" className="hover:text-white transition-colors">Live sessions</Link>
            <ChevronRight size={12} />
            <span className="text-white/40 line-clamp-1">{session.title}</span>
          </nav>

          {isLive ? (
            <span className="inline-flex items-center gap-1.5 bg-red-500 text-white text-[10.5px] font-extrabold uppercase tracking-[0.05em] px-2.5 py-1 rounded-[4px] mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse-dot" />
              Live now
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 bg-primary-bright text-primary text-[10.5px] font-extrabold uppercase tracking-[0.05em] px-2.5 py-1 rounded-[4px] mb-4">
              {KIND_LABEL[session.kind] ?? session.kind}
            </span>
          )}

          <h1 className="text-2xl sm:text-3xl font-800 leading-snug mb-4">{session.title}</h1>

          <div className="flex flex-wrap items-center gap-2 text-sm text-white/70">
            <div
              className="w-6 h-6 rounded-full shrink-0"
              style={{ background: "linear-gradient(135deg, #064e3b, #10b981)" }}
            />
            <span>
              Hosted by <span className="text-white font-600">{session.host.name}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="flex flex-col lg:flex-row gap-10 items-start">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-800 text-ink mb-3">About this session</h2>
            <p className="text-[15px] text-body-text leading-relaxed whitespace-pre-line">
              {session.description}
            </p>
          </div>

          {/* Sidebar card */}
          <div className="w-full lg:w-[340px] shrink-0 lg:sticky lg:top-24">
            <div className="border border-line rounded-2xl p-6 bg-white shadow-card">
              <div className="text-[26px] font-extrabold text-primary tracking-[-0.01em] mb-4">
                {session.isFree
                  ? "Free"
                  : formatPrice(session.priceMadCents, session.priceUsdCents, currency)}
              </div>

              <ul className="flex flex-col gap-3 text-[13.5px] text-body-text font-medium mb-5">
                <li className="flex items-center gap-2">
                  <Clock size={15} className="text-muted shrink-0" />
                  {dateLabel} · {timeLabel} UTC · {session.durationMins} min
                </li>
                <li className="flex items-center gap-2">
                  <Users size={15} className="text-muted shrink-0" />
                  {isEnded
                    ? "Session ended"
                    : `${seatsLeft} of ${session.seatsTotal} seats available`}
                </li>
                <li className="flex items-center gap-2">
                  <Video size={15} className="text-muted shrink-0" />
                  Online — link shared after reservation
                </li>
              </ul>

              {isEnded ? (
                <div className="text-center py-3.5 bg-bg-soft text-muted text-[13px] font-bold rounded-lg">
                  This session has ended
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    disabled
                    aria-disabled="true"
                    title="Online booking is launching soon"
                    className="w-full text-center py-3.5 bg-line text-muted text-[12.5px] font-extrabold uppercase tracking-[0.06em] rounded-lg cursor-not-allowed"
                  >
                    Booking opens soon
                  </button>
                  <p className="text-[12px] text-muted text-center mt-3">
                    Online reservations aren&apos;t open yet — check back soon.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
