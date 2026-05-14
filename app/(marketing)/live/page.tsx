import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { Calendar, Clock, Users, PlayCircle } from "lucide-react";
import { listPublicLiveSessions } from "@/lib/data/live-sessions";
import { formatPrice } from "@/lib/currency";
import { getCurrentCurrency } from "@/lib/currency-server";

export const metadata = {
  title: "Live sessions — JissrON",
  description: "Live AMAs, workshops and cohort sessions hosted by JissrON experts.",
};

const KIND_LABEL: Record<string, string> = {
  AMA: "Free AMA",
  WORKSHOP: "Workshop",
  SEMINAR: "Seminar",
  COHORT: "Cohort",
};

export default async function LiveSessionsIndexPage() {
  const [{ upcoming, past }, currency] = await Promise.all([
    listPublicLiveSessions(),
    getCurrentCurrency(),
  ]);

  return (
    <main className="bg-bg-soft min-h-screen pb-16">
      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/[0.08] via-primary/[0.04] to-transparent border-b border-line">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <p className="text-[10.5px] uppercase tracking-wider font-700 text-primary mb-2">
            Jissr Live
          </p>
          <h1 className="text-[28px] sm:text-[36px] font-800 text-ink tracking-tight leading-[1.1] max-w-2xl">
            Real time with real experts.
          </h1>
          <p className="text-[14px] text-muted font-500 mt-3 max-w-xl">
            Hop into live AMAs, workshops and cohort sessions. Ask questions, get feedback, learn alongside others.
          </p>
        </div>
      </section>

      {/* Upcoming */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-[18px] font-800 text-ink">Upcoming</h2>
          <p className="text-[12px] text-muted">
            {upcoming.length} session{upcoming.length !== 1 ? "s" : ""}
          </p>
        </div>

        {upcoming.length === 0 ? (
          <div className="bg-white border border-line rounded-xl p-10 text-center">
            <p className="text-[14px] font-700 text-ink mb-1">No live sessions scheduled.</p>
            <p className="text-[12.5px] text-muted">Check back soon — new sessions land every few weeks.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcoming.map((s) => {
              const seatsTaken = s._count.bookings;
              const seatsLeft = Math.max(0, s.seatsTotal - seatsTaken);
              const isLive = s.status === "LIVE";
              return (
                <Link
                  key={s.id}
                  href={`/live/${s.slug}`}
                  className="group bg-white border border-line rounded-xl p-4 hover:border-primary/40 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-1.5 mb-3">
                    {isLive ? (
                      <span className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-red-500 text-white text-[9.5px] font-700 uppercase tracking-wider">
                        <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
                        Live now
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-primary-soft text-primary text-[9.5px] font-700 uppercase tracking-wider">
                        {KIND_LABEL[s.kind] ?? s.kind}
                      </span>
                    )}
                    {s.category && (
                      <span className="text-[10px] text-muted font-600 truncate">{s.category.name}</span>
                    )}
                  </div>

                  <h3 className="text-[14.5px] font-700 text-ink leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {s.title}
                  </h3>

                  <div className="flex items-center gap-2 mt-3">
                    {s.host.image ? (
                      <Image
                        src={s.host.image}
                        alt={s.host.name ?? "Host"}
                        width={22}
                        height={22}
                        className="w-[22px] h-[22px] rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-[22px] h-[22px] rounded-full bg-gradient-to-br from-primary to-primary-bright text-white grid place-items-center text-[10px] font-700">
                        {(s.host.name ?? "?")[0]?.toUpperCase()}
                      </div>
                    )}
                    <span className="text-[12px] text-muted font-500 truncate">
                      with {s.host.name ?? "Instructor"}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-line">
                    <Cell icon={Calendar} value={format(s.startsAt, "MMM d")} />
                    <Cell icon={Clock} value={format(s.startsAt, "HH:mm")} />
                    <Cell
                      icon={Users}
                      value={seatsLeft === 0 ? "Full" : `${seatsLeft} left`}
                      tone={seatsLeft === 0 ? "muted" : seatsLeft < 10 ? "warn" : "ok"}
                    />
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <span className="text-[15px] font-800 text-primary">
                      {s.isFree
                        ? "Free"
                        : formatPrice(s.priceMadCents, s.priceUsdCents, currency)}
                    </span>
                    <span className="text-[11px] font-600 text-muted group-hover:text-primary">
                      View →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Past — only when there's something */}
      {past.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-[18px] font-800 text-ink flex items-center gap-1.5">
              <PlayCircle className="w-4 h-4 text-primary" />
              Recent sessions
            </h2>
            <p className="text-[12px] text-muted">Recordings available to attendees</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {past.map((s) => (
              <Link
                key={s.id}
                href={`/live/${s.slug}`}
                className="group bg-white border border-line rounded-xl p-3 hover:border-primary/30 transition-all"
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-muted text-[9.5px] font-700 uppercase tracking-wider">
                    {KIND_LABEL[s.kind] ?? s.kind}
                  </span>
                  <span className="text-[10px] text-muted font-500">
                    {format(s.startsAt, "MMM d, yyyy")}
                  </span>
                </div>
                <h3 className="text-[13px] font-700 text-ink leading-snug line-clamp-2 group-hover:text-primary">
                  {s.title}
                </h3>
                <p className="text-[11px] text-muted mt-1">with {s.host.name ?? "Instructor"}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function Cell({
  icon: Icon,
  value,
  tone = "ok",
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  value: string;
  tone?: "ok" | "warn" | "muted";
}) {
  const cls =
    tone === "warn" ? "text-amber-700" : tone === "muted" ? "text-muted" : "text-ink";
  return (
    <div className="flex items-center gap-1 min-w-0">
      <Icon size={11} className="text-muted shrink-0" />
      <span className={`text-[11px] font-600 truncate ${cls}`}>{value}</span>
    </div>
  );
}
