"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Copy, Check } from "lucide-react";

export function CopyButton({ value, label }: { value: string; label?: string }) {
  const t = useTranslations("Checkout");
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      title={label ? t("copyLabel", { label }) : t("copyValue")}
      className="shrink-0 inline-flex items-center gap-1 h-7 px-2.5 rounded-full border border-line bg-white text-[11px] font-semibold text-muted hover:text-primary hover:border-primary transition-colors"
    >
      {copied ? (
        <><Check size={11} className="text-primary" /><span className="text-primary">{t("copied")}</span></>
      ) : (
        <><Copy size={11} />{label ? t("copyLabel", { label }) : t("copy")}</>
      )}
    </button>
  );
}
