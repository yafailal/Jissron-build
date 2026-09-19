import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Clock, Star } from "lucide-react";
import { getConsultantByUserId } from "@/lib/data/consultants";
import { getCurrentCurrency } from "@/lib/currency-server";
import { formatPrice } from "@/lib/currency";

interface PageProps {
  params: Promise<{ userId: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { userId } = await params;
  const consultant = await getConsultantByUserId(userId);
  return {
    title: consultant
      ? `${consultant.user.name} — AILearn Consults`
      : "Consultant — AILearn",
  };
}

export default async function ConsultantDetailPage({ params }: PageProps) {
  const { userId } = await params;
  const [consultant, currency] = await Promise.all([
    getConsultantByUserId(userId),
    getCurrentCurrency(),
  ]);

  if (!consultant) notFound();

  // Availability is admin-authored JSON and its shape has drifted (see audit note:
  // the admin form saves {day, hours} while older/seeded data uses {day, slots}) —
  // read defensively so neither shape crashes this page.
  const availability = (
    (consultant.availability as unknown as { day: string; slots?: string[]; hours?: string }[]) ?? []
  ).map((slot) => ({
    day: slot.day,
    label: Array.isArray(slot.slots) ? slot.slots.join(", ") : slot.hours || "—",
  }));

  return (
    <main id="main-content" className="min-h-screen bg-white">
      <div className="bg-ink text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-white/60 mb-5 flex-wrap">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight size={12} />
            <Link href="/consults" className="hover:text-white transition-colors">Consults</Link>
            <ChevronRight size={12} />
            <span className="text-white/40 line-clamp-1">{consultant.user.name}</span>
          </nav>

          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-16 h-16 rounded-full shrink-0"
              style={{
                background:
                  consultant.avatarGradient ?? "linear-gradient(135deg, #064e3b, #10b981)",
              }}
            />
            <div>
              <h1 className="text-2xl sm:text-3xl font-800 leading-snug">
                {consultant.user.name}
              </h1>
              {consultant.tagline && (
                <p className="text-white/70 text-sm font-500 mt-1">{consultant.tagline}</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-white/70">
            <span className="flex items-center gap-1.5">
              <Star size={14} className="text-star fill-star" />
              {consultant.avgRating.toFixed(1)} ({consultant.totalSessions} sessions)
            </span>
            {!consultant.acceptsNew && (
              <span className="text-white/50">Not currently accepting new bookings</span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="flex flex-col lg:flex-row gap-10 items-start">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-800 text-ink mb-3">About</h2>
            <p className="text-[15px] text-body-text leading-relaxed whitespace-pre-line mb-6">
              {consultant.bio}
            </p>

            <h2 className="text-lg font-800 text-ink mb-3">Expertise</h2>
            <div className="flex flex-wrap gap-1.5 mb-6">
              {consultant.skills.map((skill) => (
                <span
                  key={skill}
                  className="text-[12px] font-semibold text-primary bg-primary-soft px-2.5 py-1 rounded-[4px] leading-none"
                >
                  {skill}
                </span>
              ))}
            </div>

            {availability.length > 0 && (
              <>
                <h2 className="text-lg font-800 text-ink mb-3">Typical availability</h2>
                <ul className="flex flex-col gap-2 text-[13.5px] text-body-text font-medium">
                  {availability.map((slot) => (
                    <li key={slot.day} className="flex items-center gap-2">
                      <Clock size={14} className="text-muted shrink-0" />
                      <span className="font-700 text-ink capitalize">{slot.day}:</span>
                      {slot.label}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <div className="w-full lg:w-[340px] shrink-0 lg:sticky lg:top-24">
            <div className="border border-line rounded-2xl p-6 bg-white shadow-card">
              <div className="text-[26px] font-extrabold text-primary tracking-[-0.01em] mb-1">
                {formatPrice(
                  consultant.ratePerSessionMadCents,
                  consultant.ratePerSessionUsdCents,
                  currency
                )}
              </div>
              <div className="text-[13px] text-muted font-medium mb-5">
                per {consultant.durationMins}-minute call
              </div>

              {consultant.acceptsNew ? (
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
              ) : (
                <div className="text-center py-3.5 bg-bg-soft text-muted text-[13px] font-bold rounded-lg">
                  Not accepting new bookings
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
