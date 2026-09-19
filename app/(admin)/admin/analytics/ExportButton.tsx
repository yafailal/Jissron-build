"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Download, ChevronDown, Printer, FileText, FileJson } from "lucide-react";

export function ExportButton() {
  const sp = useSearchParams();
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
        className="h-8 rounded-md bg-primary text-white px-3 text-[12.5px] font-bold flex items-center gap-1.5 hover:bg-primary-hover transition-colors"
      >
        <Download size={14} />
        Export
        <ChevronDown size={12} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-30 bg-white border border-line rounded-lg shadow-lg w-44 overflow-hidden">
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
            className="w-full flex items-center gap-2 px-3 py-2 text-[12.5px] text-ink hover:bg-bg-soft text-left"
          >
            <Printer size={14} className="text-muted" />
            Print / Save as PDF
          </button>
        </div>
      )}
    </div>
  );
}
