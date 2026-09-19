import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { parseFilters } from "@/app/(admin)/admin/analytics/filters";
import { loadAnalytics } from "@/app/(admin)/admin/analytics/data";

function escapeCsv(value: string | number): string {
  const s = String(value);
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function buildCsv(
  filename: string,
  sections: { title: string; rows: { label: string; amountCents: number; orders: number }[] }[],
  total: { amountCents: number; orders: number }
): string {
  const lines: string[] = [];
  lines.push(`Report,${escapeCsv(filename)}`);
  lines.push(`Generated,${new Date().toISOString()}`);
  lines.push(`Total revenue (MAD cents),${total.amountCents}`);
  lines.push(`Total revenue (MAD),${(total.amountCents / 100).toFixed(2)}`);
  lines.push(`Total orders,${total.orders}`);
  lines.push("");
  for (const sec of sections) {
    lines.push(`Section: ${sec.title}`);
    lines.push("Label,Orders,Revenue (MAD)");
    for (const row of sec.rows) {
      lines.push(`${escapeCsv(row.label)},${row.orders},${(row.amountCents / 100).toFixed(2)}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const format = (url.searchParams.get("format") ?? "csv").toLowerCase();
  const sp: Record<string, string> = {};
  url.searchParams.forEach((v, k) => {
    if (k !== "format") sp[k] = v;
  });

  const f = parseFilters(sp);
  const data = await loadAnalytics(f);

  const filenameBase = `revenue-${f.period}-${new Date().toISOString().slice(0, 10)}`;

  if (format === "json") {
    return new NextResponse(JSON.stringify({ filters: f, ...data }, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filenameBase}.json"`,
      },
    });
  }

  // default CSV
  const csv = buildCsv(
    filenameBase,
    [
      { title: "By type", rows: data.byType },
      { title: "By category", rows: data.byCategory },
      { title: "By language", rows: data.byLanguage },
      { title: "By teacher", rows: data.byTeacher },
      { title: "By student", rows: data.byStudent },
    ],
    data.total
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filenameBase}.csv"`,
    },
  });
}
