"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Download, ChevronDown, Printer, FileText, FileJson } from "lucide-react";

export function ExportButton() {
  const sp = useSearchParams();
  const t = useTranslations("AdminAnalytics");
  const [open, setOpen] = useState(false);

  const exportUrl = (format: "csv" | "json") => {
    const next = new URLSearchParams(sp.toString());
    next.set("format", format);
    return `/api/admin/analytics/export?${next.toString()}`;
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        className="h-8 rounded-full bg-primary text-white px-3.5 text-[12.5px] font-bold flex items-center gap-1.5 hover:bg-primary-hover transition-colors"
      >
        <Download size={14} />
        {t("export")}
        <ChevronDown size={12} />
      </button>
      {open && (
        <div className="absolute end-0 top-full mt-1 z-30 bg-white border border-line rounded-2xl shadow-lg w-44 overflow-hidden">
          <a
            href={exportUrl("csv")}
            download
            className="flex items-center gap-2 px-3 py-2 text-[12.5px] text-ink hover:bg-bg-soft border-b border-line"
          >
            <FileText size={14} className="text-muted" />
            CSV
          </a>
          <a
            href={exportUrl("json")}
            download
            className="flex items-center gap-2 px-3 py-2 text-[12.5px] text-ink hover:bg-bg-soft border-b border-line"
          >
            <FileJson size={14} className="text-muted" />
            JSON
          </a>
          <button
            type="button"
            onClick={() => window.print()}
            className="w-full flex items-center gap-2 px-3 py-2 text-[12.5px] text-ink hover:bg-bg-soft text-start"
          >
            <Printer size={14} className="text-muted" />
            {t("printPdf")}
          </button>
        </div>
      )}
    </div>
  );
}
