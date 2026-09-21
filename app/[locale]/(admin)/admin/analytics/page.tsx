import { Wallet, Receipt, Trophy, TrendingUp } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { AnalyticsFilters } from "./AnalyticsFilters";
import { ExportButton } from "./ExportButton";
import { HorizontalBarChart, DonutChart, VerticalBarChart } from "@/components/admin/AnalyticsChart";
import { parseFilters } from "./filters";
import { loadAnalytics, loadFilterOptions, type BreakdownRow } from "./data";

export async function generateMetadata() {
  const t = await getTranslations("AdminAnalytics");
  return { title: t("metaTitle") };
}

function fmtMad(cents: number) {
  return `${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })} MAD`;
}

const PERIODS = ["today", "thisWeek", "thisMonth", "lastMonth", "all", "custom"];
const KNOWN_LANGS = ["en", "fr", "ar", "es", "de"];

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("AdminAnalytics");
  const sp = await searchParams;
  const f = parseFilters(sp);
  const [data, options] = await Promise.all([loadAnalytics(f), loadFilterOptions()]);

  const periodLabel = (p: string) => (PERIODS.includes(p) ? t(`period.${p}`) : p);
  const byType = data.byType.map((r) => ({
    ...r,
    label: ["course", "live", "consult"].includes(r.key) ? t(`type.${r.key}`) : t("type.unknown"),
  }));
  const byCategory = data.byCategory.map((r) => (r.key === "uncategorized" ? { ...r, label: t("uncategorized") } : r));
  const byLanguage = data.byLanguage.map((r) => (KNOWN_LANGS.includes(r.key) ? { ...r, label: t(`lang.${r.key}`) } : r));
  const byTeacher = data.byTeacher.map((r) => (r.key === "unassigned" ? { ...r, label: t("unassigned") } : r));

  const topByType = byType[0];

  return (
    <div className="analytics-page">
      {/* Header */}
      <div className="flex items-start justify-between mb-2 gap-3 print:mb-4">
        <div>
          <h1 className="text-[18px] font-extrabold text-ink tracking-[-0.01em]">{t("title")}</h1>
          <p className="text-[12px] text-muted mt-0.5">
            {periodLabel(f.period)} · {t("subtitleSuffix")}
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
          label={t("heroRevenue")}
          value={fmtMad(data.total.amountCents)}
          icon={Wallet}
          tone="emerald"
        />
        <HeroCard
          label={t("heroPaidOrders")}
          value={`${data.total.orders}`}
          icon={Receipt}
          tone="primary"
        />
        <HeroCard
          label={t("heroAvgOrder")}
          value={data.total.orders > 0 ? fmtMad(data.total.avgOrderCents) : "—"}
          icon={TrendingUp}
          tone="violet"
        />
        <HeroCard
          label={t("heroTopType")}
          value={topByType ? topByType.label : "—"}
          sub={topByType ? fmtMad(topByType.amountCents) : t("noRevenue")}
          icon={Trophy}
          tone="orange"
        />
      </div>

      {/* Type split */}
      <Section title={t("byTypeTitle")}>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-2 items-stretch">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {(["course", "live", "consult"] as const).map((typeKey) => {
              const row = byType.find((r) => r.key === typeKey);
              const label = t(`type.${typeKey}`);
              return (
                <div key={typeKey} className="bg-white rounded-2xl border border-line px-3 py-2.5">
                  <p className="text-[10.5px] font-bold uppercase tracking-wide text-muted">{label}</p>
                  <p className="text-[18px] font-extrabold text-ink mt-0.5">
                    {row ? fmtMad(row.amountCents) : "0 MAD"}
                  </p>
                  <p className="text-[11px] text-muted mt-0.5">
                    {row ? t("orders", { count: row.orders }) : "—"}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="bg-white rounded-2xl border border-line p-2">
            <DonutChart
              data={byType.map((r) => ({ label: r.label, amountCents: r.amountCents }))}
              height={180}
            />
          </div>
        </div>
      </Section>

      {/* Breakdowns: two columns of (card + chart) per breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 mt-2">
        <BreakdownPanel
          title={t("byCategory")}
          rows={byCategory}
          subtitle={t("byCategorySub")}
          chart="donut"
        />
        <BreakdownPanel
          title={t("byLanguage")}
          rows={byLanguage}
          subtitle={t("byLanguageSub")}
          chart="donut"
        />
        <BreakdownPanel
          title={t("byTeacher")}
          rows={byTeacher.slice(0, 12)}
          subtitle={t("byTeacherSub")}
          chart="hbar"
        />
        <BreakdownPanel
          title={t("byStudent")}
          rows={data.byStudent.slice(0, 12)}
          subtitle={t("byStudentSub")}
          chart="hbar"
        />
      </div>

      {/* Print-only full data appendix */}
      <div className="hidden print:block mt-6">
        <h2 className="text-[14px] font-bold mb-2">{t("fullBreakdown")}</h2>
        <table className="w-full text-[11px] border border-line">
          <thead>
            <tr className="bg-bg-soft">
              <th className="text-start px-2 py-1 border-b border-line">{t("student")}</th>
              <th className="text-right px-2 py-1 border-b border-line">{t("ordersHeader")}</th>
              <th className="text-right px-2 py-1 border-b border-line">{t("revenue")}</th>
            </tr>
          </thead>
          <tbody>
            {data.byStudent.map((r) => (
              <tr key={r.key}>
                <td className="px-2 py-1 border-b border-line">{r.label}</td>
                <td className="px-2 py-1 border-b border-line text-end">{r.orders}</td>
                <td className="px-2 py-1 border-b border-line text-end">{fmtMad(r.amountCents)}</td>
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
  emerald: { bg: "bg-primary-bright", text: "text-white" },
  violet: { bg: "bg-primary-mid", text: "text-white" },
  orange: { bg: "bg-amber-500", text: "text-white" },
  rose: { bg: "bg-rose-500", text: "text-white" },
  teal: { bg: "bg-primary-hover", text: "text-white" },
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
    <div className="bg-white rounded-2xl border border-line px-3.5 py-3 flex items-start gap-2.5">
      <div className={`w-8 h-8 rounded-full grid place-items-center shrink-0 ${t.bg} ${t.text}`}>
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

async function BreakdownPanel({
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
  const t = await getTranslations("AdminAnalytics");
  const total = rows.reduce((s, r) => s + r.amountCents, 0);
  const top = rows[0];
  const chartData = rows.map((r) => ({ label: r.label, amountCents: r.amountCents }));
  return (
    <div className="bg-white rounded-2xl border border-line p-3">
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="text-[12.5px] font-bold text-ink">{title}</p>
          {subtitle && <p className="text-[10.5px] text-muted leading-snug">{subtitle}</p>}
        </div>
        <p className="text-[11px] text-muted shrink-0">
          {top ? t("top", { label: top.label }) : ""}
        </p>
      </div>
      {chart === "donut" && <DonutChart data={chartData} />}
      {chart === "vbar" && <VerticalBarChart data={chartData} />}
      {chart === "hbar" && <HorizontalBarChart data={chartData} />}
      <div className="mt-2 flex items-center justify-between text-[10.5px] text-muted border-t border-line pt-1.5">
        <span>{t("groups", { count: rows.length })}</span>
        <span className="font-semibold text-ink">{t("total", { amount: fmtMad(total) })}</span>
      </div>
    </div>
  );
}
