import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getAllConsultants } from "@/lib/data/consultants";
import { getCurrentCurrency } from "@/lib/currency-server";
import { ConsultantCard } from "@/components/marketing/ConsultantCard";

export const metadata = {
  title: "1-on-1 consults — AILearn",
  description:
    "Book a 1-on-1 call with an expert consultant for personalized advice and feedback.",
};

export default async function ConsultsPage() {
  const [consultants, currency] = await Promise.all([
    getAllConsultants(),
    getCurrentCurrency(),
  ]);

  return (
    <main id="main-content" className="min-h-screen bg-white">
      <div className="section">
        <div className="wrap">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-muted mb-5">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight size={12} />
            <span className="text-ink">1-on-1 consults</span>
          </nav>

          <div className="mb-8">
            <div className="section-eyebrow">1-on-1 consults</div>
            <h1 className="section-title mt-1">Browse expert consultants</h1>
            <p className="text-[15px] text-body-text mt-3 max-w-[600px] leading-relaxed font-medium">
              Get direct feedback and personalized advice from practitioners across
              product, engineering, and design.
            </p>
          </div>

          {consultants.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {consultants.map((consultant) => (
                <ConsultantCard key={consultant.id} consultant={consultant} currency={currency} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-bg-soft rounded-2xl border border-line">
              <p className="text-[18px] font-800 text-ink mb-2">
                No consultants available right now
              </p>
              <p className="text-[14px] text-muted">
                Check back soon — new experts are added regularly.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
