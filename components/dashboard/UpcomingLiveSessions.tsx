import Image from "next/image";
import Link from "next/link";
import { format, formatDistanceToNowStrict } from "date-fns";
import { Video, ArrowUpRight } from "lucide-react";

const KIND_LABEL: Record<string, string> = {
  AMA: "AMA",
  WORKSHOP: "Workshop",
  SEMINAR: "Seminar",
  COHORT: "Cohort",
};

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

export function UpcomingLiveSessions({ bookings }: Props) {
  if (bookings.length === 0) return null;

  return (
    <section className="bg-white border border-line rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[14px] font-700 text-ink flex items-center gap-1.5">
          <Video className="w-4 h-4 text-primary" />
          Your upcoming live sessions
        </h2>
        <Link
          href="/live"
          className="text-[12px] font-600 text-primary hover:underline inline-flex items-center gap-0.5"
        >
          Browse all <ArrowUpRight className="w-3 h-3" />
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
              className="flex items-center gap-3 px-2 py-2.5 rounded-md hover:bg-bg-soft transition-colors group"
            >
              {/* Date block */}
              <div className="w-12 text-center shrink-0">
                <p className="text-[10px] uppercase font-700 text-muted tracking-wide">
                  {format(s.startsAt, "MMM")}
                </p>
                <p className="text-[20px] font-800 text-primary leading-none">
                  {format(s.startsAt, "d")}
                </p>
                <p className="text-[10px] text-muted font-500 mt-0.5">
                  {format(s.startsAt, "HH:mm")}
                </p>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  {isLive ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500 text-white text-[9px] font-700 uppercase tracking-wider">
                      <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
                      Live
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-primary-soft text-primary text-[9px] font-700 uppercase tracking-wider">
                      {KIND_LABEL[s.kind] ?? s.kind}
                    </span>
                  )}
                  <span className="text-[10.5px] text-muted">
                    in {formatDistanceToNowStrict(s.startsAt)}
                  </span>
                </div>
                <p className="text-[13px] font-700 text-ink truncate mt-0.5 group-hover:text-primary transition-colors">
                  {s.title}
                </p>
                <p className="text-[11px] text-muted truncate">
                  with {s.host.name ?? "Instructor"}
                </p>
              </div>

              {inWindow && (
                <span className="shrink-0 inline-flex items-center gap-1 px-2.5 h-7 rounded-md bg-emerald-600 text-white text-[11px] font-700 group-hover:bg-emerald-700 transition-colors">
                  <Video className="w-3 h-3" />
                  Join
                </span>
              )}
            </Link>
          );
        })}
      </ul>
    </section>
  );
}
