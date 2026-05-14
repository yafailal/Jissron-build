import Image from "next/image";
import Link from "next/link";
import { Star, Calendar, Sparkles } from "lucide-react";
import { listPublicConsultants, parseAvailability } from "@/lib/data/consultants";
import { formatPrice } from "@/lib/currency";
import { getCurrentCurrency } from "@/lib/currency-server";

export const metadata = {
  title: "1-on-1 consultants — JissrON",
  description: "Book a private session with a JissrON expert — 30-minute deep dives, mentorship, and career guidance.",
};

export default async function ConsultantsIndexPage() {
  const [consultants, currency] = await Promise.all([
    listPublicConsultants(),
    getCurrentCurrency(),
  ]);

  return (
    <main className="bg-bg-soft min-h-screen pb-16">
      <section className="bg-gradient-to-b from-primary/[0.08] via-primary/[0.04] to-transparent border-b border-line">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <p className="text-[10.5px] uppercase tracking-wider font-700 text-primary mb-2">
            1-on-1 Consultants
          </p>
          <h1 className="text-[28px] sm:text-[36px] font-800 text-ink tracking-tight leading-[1.1] max-w-2xl">
            Private time with someone who&apos;s been where you want to go.
          </h1>
          <p className="text-[14px] text-muted font-500 mt-3 max-w-xl">
            Book a focused 30-minute call. Bring your question, your code review, or your decision —
            walk out with a plan.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-[18px] font-800 text-ink">Available consultants</h2>
          <p className="text-[12px] text-muted">
            {consultants.length} expert{consultants.length !== 1 ? "s" : ""}
          </p>
        </div>

        {consultants.length === 0 ? (
          <div className="bg-white border border-line rounded-xl p-10 text-center">
            <p className="text-[14px] font-700 text-ink mb-1">No consultants available right now.</p>
            <p className="text-[12.5px] text-muted">Check back soon — we onboard new experts every month.</p>
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
                  className="group bg-white border border-line rounded-xl p-5 hover:border-primary/40 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start gap-3 mb-3">
                    {c.user.image ? (
                      <Image
                        src={c.user.image}
                        alt={c.user.name ?? "Consultant"}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-full shrink-0"
                        style={{
                          background: c.avatarGradient ?? "linear-gradient(135deg, #003d80, #0071e3)",
                        }}
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <p className="text-[14px] font-700 text-ink truncate group-hover:text-primary transition-colors">
                          {c.user.name ?? "Consultant"}
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
                          className="inline-flex px-2 py-0.5 rounded-md bg-bg-soft text-[10.5px] font-600 text-muted"
                        >
                          {s}
                        </span>
                      ))}
                      {c.skills.length > 3 && (
                        <span className="text-[10.5px] text-muted font-500">
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
                          ? "by request"
                          : `${daysAvailable} day${daysAvailable !== 1 ? "s" : ""}/wk`}
                      </span>
                    </div>
                    <p className="text-[14px] font-800 text-primary">
                      {rate}
                      <span className="text-[10px] text-muted font-500"> / {c.durationMins}m</span>
                    </p>
                  </div>
                  <p className="sr-only">{totalRanges} availability windows</p>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
