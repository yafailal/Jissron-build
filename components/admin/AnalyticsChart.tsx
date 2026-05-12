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
} from "recharts";

const BRAND = {
  primary: "#003d80",
  primaryBright: "#0071e3",
  primarySoft: "#cbdcf2",
  ink: "#081a36",
  muted: "#6a7890",
  line: "#e4e9ef",
};

const fmtCompact = (cents: number) => {
  if (cents >= 100_000) return `${(cents / 100_000).toFixed(1)}k`;
  return (cents / 100).toFixed(0);
};

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
          formatter={(v) => [`${(Number(v) / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })} MAD`, "Revenue"]}
        />
        <Bar dataKey="amountCents" radius={[0, 4, 4, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={i === 0 ? BRAND.primary : BRAND.primaryBright} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
