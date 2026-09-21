"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopyButton({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      title={`Copy ${label ?? "value"}`}
      className="shrink-0 inline-flex items-center gap-1 h-7 px-2.5 rounded-md border border-line bg-white text-[11px] font-600 text-muted hover:text-ink hover:border-primary/40 transition-colors"
    >
      {copied ? (
        <><Check size={11} className="text-green-600" /><span className="text-green-600">Copied</span></>
      ) : (
        <><Copy size={11} />{label ? `Copy ${label}` : "Copy"}</>
      )}
    </button>
  );
}
