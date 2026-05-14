import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Star, Globe, Clock } from "lucide-react";
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
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const c = await getConsultantById(id);
  if (!c) return { title: "Consultant — JissrON" };
  return {
    title: `${c.user.name ?? "Consultant"} — Book a session on JissrON`,
    description: c.tagline ?? c.bio.slice(0, 160),
  };
}

const DAY_LABEL_FULL: Record<string, string> = {
  sun: "Sunday",
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
};

export default async function ConsultantDetailPage({ params }: PageProps) {
  const { id } = await params;
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
      dayLabel: date.toLocaleDateString("en-US", {
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
    <main className="bg-bg-soft min-h-screen pb-16">
      <section className="bg-gradient-to-b from-primary/[0.08] via-primary/[0.04] to-transparent border-b border-line">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="flex items-center gap-2 mb-4 text-[12px] font-600 text-muted">
            <Link href="/consultants" className="hover:text-primary transition-colors">
              All consultants
            </Link>
            <span>/</span>
            <span className="text-ink/60">{consultant.user.name ?? "Consultant"}</span>
          </div>

          <div className="grid lg:grid-cols-[1.6fr_1fr] gap-8 lg:gap-12">
            <div className="min-w-0">
              <div className="flex items-start gap-4">
                {consultant.user.image ? (
                  <Image
                    src={consultant.user.image}
                    alt={consultant.user.name ?? "Consultant"}
                    width={72}
                    height={72}
                    className="w-[72px] h-[72px] rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div
                    className="w-[72px] h-[72px] rounded-full shrink-0"
                    style={{
                      background: consultant.avatarGradient ?? "linear-gradient(135deg, #003d80, #0071e3)",
                    }}
                  />
                )}
                <div className="min-w-0">
                  <h1 className="text-[24px] sm:text-[28px] font-800 text-ink leading-[1.15] tracking-tight">
                    {consultant.user.name ?? "Consultant"}
                  </h1>
                  {consultant.tagline && (
                    <p className="text-[14px] text-muted mt-1">{consultant.tagline}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-[12px] text-muted">
                    {consultant.avgRating > 0 && (
                      <span className="inline-flex items-center gap-0.5">
                        <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                        {consultant.avgRating.toFixed(1)} ({consultant.totalSessions} sessions)
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {consultant.durationMins}-min sessions
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
                  <p className="text-[10.5px] uppercase tracking-wider font-700 text-muted mb-2">
                    Areas of expertise
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {consultant.skills.map((s) => (
                      <span
                        key={s}
                        className="inline-flex px-2.5 py-1 rounded-md bg-white border border-line text-[12px] font-600 text-ink"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <article className="mt-6">
                <h2 className="text-[16px] font-700 text-ink mb-2">About</h2>
                <p className="text-[13.5px] text-ink/85 leading-relaxed whitespace-pre-line">
                  {consultant.bio}
                </p>
              </article>

              {availability.some((d) => d.slots.length > 0) && (
                <div className="mt-6">
                  <h2 className="text-[16px] font-700 text-ink mb-2">Weekly availability</h2>
                  <ul className="space-y-1.5">
                    {availability
                      .filter((d) => d.slots.length > 0)
                      .map((d) => (
                        <li key={d.day} className="flex gap-2 text-[12.5px] text-ink">
                          <span className="font-700 w-24">{DAY_LABEL_FULL[d.day] ?? d.day}</span>
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
            <aside className="lg:sticky lg:top-24 self-start bg-white border border-line rounded-xl p-5 shadow-sm">
              <div className="mb-4">
                <p className="text-[10.5px] uppercase tracking-wider font-700 text-muted">Rate</p>
                <p className="text-[28px] font-800 text-ink leading-none mt-1">
                  {rate}
                  <span className="text-[12px] text-muted font-500 ml-1">
                    / {consultant.durationMins}m
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
        </div>
      </section>
    </main>
  );
}
