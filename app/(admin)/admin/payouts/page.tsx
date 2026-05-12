import { Wallet, ArrowRightCircle, TrendingUp, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { loadPayouts } from "./data";
import { PayoutRow } from "./PayoutRow";

export const metadata = { title: "Payouts — JissrON Admin" };

function fmtMad(cents: number) {
  return `${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })} MAD`;
}

export default async function PayoutsPage() {
  const { rows, totals } = await loadPayouts();

  const pendingInstructors = rows.filter((r) => r.pending.orders > 0).length;

  return (
    <div>
      <PageHeader
        title="Payouts"
        description="Instructor revenue shares, transfers owed, and platform earnings. Only MAD orders are counted."
      />

      {/* Hero — top totals */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
        <Hero
          label="To transfer (pending)"
          value={fmtMad(totals.pendingInstructorOwedCents)}
          sub={`${totals.pendingOrders} orders · ${pendingInstructors} instructor${pendingInstructors === 1 ? "" : "s"}`}
          icon={ArrowRightCircle}
          tone="orange"
        />
        <Hero
          label="Platform earned (all-time)"
          value={fmtMad(totals.lifetimePlatformEarnedCents)}
          sub={`from ${totals.lifetimeOrders} paid orders`}
          icon={Wallet}
          tone="emerald"
        />
        <Hero
          label="Instructors earned (all-time)"
          value={fmtMad(totals.lifetimeInstructorEarnedCents)}
          icon={TrendingUp}
          tone="violet"
        />
        <Hero
          label="Gross revenue (all-time)"
          value={fmtMad(totals.lifetimeRevenueCents)}
          sub="Customer-paid totals"
          icon={Wallet}
          tone="primary"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-line overflow-hidden">
        <table className="w-full text-[13px]">
          <thead className="bg-bg-soft border-b border-line">
            <tr className="text-left">
              <Th>Instructor</Th>
              <Th>Cut</Th>
              <ThR>Pending payout</ThR>
              <ThR>Lifetime earned</ThR>
              <ThR>Already paid</ThR>
              <ThR>Platform earned</ThR>
              <Th>{""}</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted">
                  No paid course orders yet — payouts will appear once instructors have sold something.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <PayoutRow key={r.instructorId} row={r} />
            ))}
          </tbody>
        </table>
      </div>

      {totals.lifetimeOrders === 0 && (
        <div className="mt-3 flex items-start gap-2 p-3 bg-primary-soft border border-primary/20 rounded-lg text-[12px] text-primary">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <p>
            Payouts are computed from <strong>paid</strong> orders only. Live session and consulting revenue
            require the booking-to-Order link to be wired (the schema is ready; the flow isn&apos;t connected yet).
            Course revenue works today.
          </p>
        </div>
      )}
    </div>
  );
}

type HeroTone = "primary" | "emerald" | "violet" | "orange";
const HERO_TONE: Record<HeroTone, string> = {
  primary: "bg-primary text-white",
  emerald: "bg-emerald-500 text-white",
  violet: "bg-violet-500 text-white",
  orange: "bg-orange-500 text-white",
};

function Hero({
  label,
  value,
  sub,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ComponentType<{ size?: number }>;
  tone?: HeroTone;
}) {
  return (
    <div className="bg-white rounded-lg border border-line px-3.5 py-3 flex items-start gap-2.5">
      <div className={`w-8 h-8 rounded-md grid place-items-center shrink-0 ${HERO_TONE[tone]}`}>
        <Icon size={15} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.05em] text-muted leading-tight">{label}</p>
        <p className="text-[18px] font-extrabold text-ink tracking-[-0.01em] leading-tight mt-0.5 truncate">{value}</p>
        {sub && <p className="text-[10.5px] text-muted mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-2.5 text-[10.5px] font-bold uppercase tracking-wide text-muted">{children}</th>;
}
function ThR({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-2.5 text-[10.5px] font-bold uppercase tracking-wide text-muted text-right">{children}</th>;
}
