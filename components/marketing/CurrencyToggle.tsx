"use client";

import { useRouter } from "next/navigation";
import type { Currency } from "@/lib/currency";

interface CurrencyToggleProps {
  current: Currency;
}

export function CurrencyToggle({ current }: CurrencyToggleProps) {
  const router = useRouter();

  function select(currency: Currency) {
    if (currency === current) return;
    document.cookie = `jissron_currency=${currency}; max-age=${60 * 60 * 24 * 365}; path=/; SameSite=Lax`;
    router.refresh();
  }

  return (
    <div className="flex items-center h-8 rounded-full border border-line bg-bg-soft p-0.5 text-[12px] font-semibold shrink-0">
      {(["MAD", "USD"] as Currency[]).map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => select(c)}
          className={`px-2.5 h-full rounded-full transition-colors duration-150 ${
            current === c
              ? "bg-primary text-white"
              : "text-muted hover:text-ink"
          }`}
        >
          {c}
        </button>
      ))}
    </div>
  );
}
