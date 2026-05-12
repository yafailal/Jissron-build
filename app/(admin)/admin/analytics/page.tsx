import { Wallet, Receipt, Trophy, TrendingUp } from "lucide-react";
import { AnalyticsFilters } from "./AnalyticsFilters";
import { ExportButton } from "./ExportButton";
import { HorizontalBarChart, DonutChart, VerticalBarChart } from "@/components/admin/AnalyticsChart";
import { parseFilters } from "./filters";
import { loadAnalytics, loadFilterOptions, type BreakdownRow } from "./data";

export const metadata = { title: "Analytics — JissrON Admin" };

function fmtMad(cents: number) {
  return `${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })} MAD`;
}

function periodLabel(period: string): string {
  if (period === "today") return "Today";
  if (period === "thisWeek") return "This week";
  if (period === "thisMonth") return "This month";
  if (period === "lastMonth") return "Last month";
  if (period === "all") return "All time";
  if (period === "custom") return "Custom range";
  return period;
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const f = parseFilters(sp);
  const [data, options] = await Promise.all([loadAnalytics(f), loadFilterOptions()]);

  const topByType = data.byType[0];

  return (
    <div className="analytics-page">
      {/* Header */}
      <div className="flex items-start justify-between mb-2 gap-3 print:mb-4">
        <div>
          <h1 className="text-[18px] font-extrabold text-ink tracking-[-0.01em]">Revenue analytics</h1>
          <p className="text-[12px] text-muted mt-0.5">
            {periodLabel(f.period)} · MAD only · paid orders
          </p>
        </div>
        <div className="print:hidden">
          <ExportButton />
        </div>
      </div>

      {/* Filter bar */}
      <div className="print:hidden">
        <AnalyticsFilters
          categories={options.categories}
          languages={options.languages}
          instructors={options.instructors}
          students={options.students}
        />
      </div>

      {/* Hero cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-2">
        <HeroCard
          label="Revenue (filtered)"
          value={fmtMad(data.total.amountCents)}
          icon={Wallet}
          tone="emerald"
        />
        <HeroCard
          label="Paid orders"
          value={`${data.total.orders}`}
          icon={Receipt}
          tone="primary"
        />
        <HeroCard
          label="Avg order value"
          value={data.total.orders > 0 ? fmtMad(data.total.avgOrderCents) : "—"}
          icon={TrendingUp}
          tone="violet"
        />
        <HeroCard
          label="Top type"
          value={topByType ? topByType.label : "—"}
          sub={topByType ? fmtMad(topByType.amountCents) : "No revenue"}
          icon={Trophy}
          tone="orange"
        />
      </div>

      {/* Type split */}
      <Section title="By type (Course / Live / Consulting)">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-2 items-stretch">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {(["Courses", "Live sessions", "Consulting"] as const).map((label) => {
              const row = data.byType.find((r) => r.label === label);
              return (
                <div key={label} className="bg-white rounded-lg border border-line px-3 py-2.5">
                  <p className="text-[10.5px] font-bold uppercase tracking-wide text-muted">{label}</p>
                  <p className="text-[18px] font-extrabold text-ink mt-0.5">
                    {row ? fmtMad(row.amountCents) : "0 MAD"}
                  </p>
                  <p className="text-[11px] text-muted mt-0.5">
                    {row ? `${row.orders} order${row.orders === 1 ? "" : "s"}` : "—"}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="bg-white rounded-lg border border-line p-2">
            <DonutChart
              data={data.byType.map((r) => ({ label: r.label, amountCents: r.amountCents }))}
              height={180}
            />
          </div>
        </div>
      </Section>

      {/* Breakdowns: two columns of (card + chart) per breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 mt-2">
        <BreakdownPanel
          title="By category"
          rows={data.byCategory}
          subtitle="Distribution across course/live/consult categories."
          chart="donut"
        />
        <BreakdownPanel
          title="By language"
          rows={data.byLanguage}
          subtitle="Course / live / consult language."
          chart="donut"
        />
        <BreakdownPanel
          title="By teacher"
          rows={data.byTeacher.slice(0, 12)}
          subtitle="Instructors, live-session hosts, and consultants. Top 12."
          chart="hbar"
        />
        <BreakdownPanel
          title="By student"
          rows={data.byStudent.slice(0, 12)}
          subtitle="Highest-spending students. Top 12."
          chart="hbar"
        />
      </div>

      {/* Print-only full data appendix */}
      <div className="hidden print:block mt-6">
        <h2 className="text-[14px] font-bold mb-2">Full breakdown — by student</h2>
        <table className="w-full text-[11px] border border-line">
          <thead>
            <tr className="bg-bg-soft">
              <th className="text-left px-2 py-1 border-b border-line">Student</th>
              <th className="text-right px-2 py-1 border-b border-line">Orders</th>
              <th className="text-right px-2 py-1 border-b border-line">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {data.byStudent.map((r) => (
              <tr key={r.key}>
                <td className="px-2 py-1 border-b border-line">{r.label}</td>
                <td className="px-2 py-1 border-b border-line text-right">{r.orders}</td>
                <td className="px-2 py-1 border-b border-line text-right">{fmtMad(r.amountCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-2">
      <h2 className="text-[10.5px] font-bold text-muted uppercase tracking-[0.08em] mb-1.5">{title}</h2>
      {children}
    </div>
  );
}

type HeroTone = "primary" | "emerald" | "violet" | "orange" | "rose" | "teal";
const HERO_TONE: Record<HeroTone, { bg: string; text: string }> = {
  primary: { bg: "bg-primary", text: "text-white" },
  emerald: { bg: "bg-emerald-500", text: "text-white" },
  violet: { bg: "bg-violet-500", text: "text-white" },
  orange: { bg: "bg-orange-500", text: "text-white" },
  rose: { bg: "bg-rose-500", text: "text-white" },
  teal: { bg: "bg-teal-500", text: "text-white" },
};

function HeroCard({
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
  const t = HERO_TONE[tone];
  return (
    <div className="bg-white rounded-lg border border-line px-3.5 py-3 flex items-start gap-2.5">
      <div className={`w-8 h-8 rounded-md grid place-items-center shrink-0 ${t.bg} ${t.text}`}>
        <Icon size={15} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.05em] text-muted leading-tight">{label}</p>
        <p className="text-[18px] font-extrabold text-ink tracking-[-0.01em] leading-tight mt-0.5 truncate">{value}</p>
        {sub && <p className="text-[11px] text-muted mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  );
}

type ChartKind = "hbar" | "vbar" | "donut";

function BreakdownPanel({
  title,
  rows,
  subtitle,
  chart = "hbar",
}: {
  title: string;
  rows: BreakdownRow[];
  subtitle?: string;
  chart?: ChartKind;
}) {
  const total = rows.reduce((s, r) => s + r.amountCents, 0);
  const top = rows[0];
  const chartData = rows.map((r) => ({ label: r.label, amountCents: r.amountCents }));
  return (
    <div className="bg-white rounded-lg border border-line p-3">
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="text-[12.5px] font-bold text-ink">{title}</p>
          {subtitle && <p className="text-[10.5px] text-muted leading-snug">{subtitle}</p>}
        </div>
        <p className="text-[11px] text-muted shrink-0">
          {top ? `Top: ${top.label}` : ""}
        </p>
      </div>
      {chart === "donut" && <DonutChart data={chartData} />}
      {chart === "vbar" && <VerticalBarChart data={chartData} />}
      {chart === "hbar" && <HorizontalBarChart data={chartData} />}
      <div className="mt-2 flex items-center justify-between text-[10.5px] text-muted border-t border-line pt-1.5">
        <span>{rows.length} group{rows.length === 1 ? "" : "s"}</span>
        <span className="font-semibold text-ink">{fmtMad(total)} total</span>
      </div>
    </div>
  );
}
