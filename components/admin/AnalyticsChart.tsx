"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";

const BRAND = {
  primary: "#003d80",
  primaryBright: "#0071e3",
  primarySoft: "#cbdcf2",
  ink: "#081a36",
  muted: "#6a7890",
  line: "#e4e9ef",
};

// Palette for multi-slice charts (donut). Brand-aligned, no yellow/amber.
const PALETTE = [
  "#003d80", // primary navy
  "#0071e3", // primary bright
  "#10b981", // emerald
  "#8b5cf6", // violet
  "#f97316", // orange
  "#0d9488", // teal
  "#f43f5e", // rose
  "#0058b8", // primary hover
  "#475569", // slate
  "#6366f1", // indigo
];

const fmtCompact = (cents: number) => {
  if (cents >= 100_000) return `${(cents / 100_000).toFixed(1)}k`;
  return (cents / 100).toFixed(0);
};

const fmtMad = (cents: number) =>
  `${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })} MAD`;

interface BarRow {
  label: string;
  amountCents: number;
}

export function HorizontalBarChart({ data, height = 220 }: { data: BarRow[]; height?: number }) {
  if (data.length === 0) {
    return (
      <p className="text-[11.5px] text-muted text-center py-8">No data for current filters.</p>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 0 }}>
        <CartesianGrid stroke={BRAND.line} strokeDasharray="3 3" horizontal={false} />
        <XAxis
          type="number"
          tickFormatter={fmtCompact}
          tick={{ fill: BRAND.muted, fontSize: 10 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          type="category"
          dataKey="label"
          tick={{ fill: BRAND.ink, fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={120}
        />
        <Tooltip
          contentStyle={{
            background: "#fff",
            border: `1px solid ${BRAND.line}`,
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(v) => [fmtMad(Number(v)), "Revenue"]}
        />
        <Bar dataKey="amountCents" radius={[0, 4, 4, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function VerticalBarChart({ data, height = 220 }: { data: BarRow[]; height?: number }) {
  if (data.length === 0) {
    return (
      <p className="text-[11.5px] text-muted text-center py-8">No data for current filters.</p>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
        <CartesianGrid stroke={BRAND.line} strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: BRAND.muted, fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          interval={0}
          angle={-12}
          textAnchor="end"
          height={48}
        />
        <YAxis
          tickFormatter={fmtCompact}
          tick={{ fill: BRAND.muted, fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          width={36}
        />
        <Tooltip
          contentStyle={{
            background: "#fff",
            border: `1px solid ${BRAND.line}`,
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(v) => [fmtMad(Number(v)), "Revenue"]}
        />
        <Bar dataKey="amountCents" radius={[4, 4, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DonutChart({ data, height = 220 }: { data: BarRow[]; height?: number }) {
  if (data.length === 0) {
    return (
      <p className="text-[11.5px] text-muted text-center py-8">No data for current filters.</p>
    );
  }
  const total = data.reduce((s, d) => s + d.amountCents, 0);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
        <Pie
          data={data}
          dataKey="amountCents"
          nameKey="label"
          innerRadius="58%"
          outerRadius="86%"
          paddingAngle={2}
          stroke="none"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: "#fff",
            border: `1px solid ${BRAND.line}`,
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(v, name) => {
            const n = Number(v);
            const pct = total > 0 ? Math.round((n / total) * 100) : 0;
            return [`${fmtMad(n)} (${pct}%)`, name];
          }}
        />
        <Legend
          verticalAlign="bottom"
          align="center"
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 10.5, color: BRAND.muted, paddingTop: 4 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
