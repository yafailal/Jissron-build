import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getAllUpcomingLiveSessions } from "@/lib/data/live-sessions";
import { getCurrentCurrency } from "@/lib/currency-server";
import { LiveSessionRow } from "@/components/marketing/LiveSessionRow";

export const metadata = {
  title: "Live sessions — AILearn",
  description:
    "Join live workshops, AMAs, seminars, and cohorts with industry experts.",
};

export default async function LiveSessionsPage() {
  const [sessions, currency] = await Promise.all([
    getAllUpcomingLiveSessions(),
    getCurrentCurrency(),
  ]);

  return (
    <main id="main-content" className="min-h-screen bg-bg-soft">
      <div className="section">
        <div className="wrap">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-muted mb-5">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight size={12} />
            <span className="text-ink">Live sessions</span>
          </nav>

          <div className="mb-8">
            <div className="section-eyebrow">Live sessions</div>
            <h1 className="section-title mt-1">Upcoming live sessions</h1>
            <p className="text-[15px] text-body-text mt-3 max-w-[600px] leading-relaxed font-medium">
              Real-time workshops, AMAs, and office hours with industry experts. Ask
              questions, meet peers, and accelerate your learning.
            </p>
          </div>

          {sessions.length > 0 ? (
            <div className="bg-white border border-line rounded-2xl overflow-hidden lg:overflow-x-auto">
              <div className="flex flex-col gap-5 lg:block lg:min-w-[800px]">
                {sessions.map((session) => (
                  <LiveSessionRow key={session.id} session={session} currency={currency} />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-2xl border border-line">
              <p className="text-[18px] font-800 text-ink mb-2">
                No live sessions scheduled right now
              </p>
              <p className="text-[14px] text-muted">
                Check back soon — new sessions are added regularly.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
