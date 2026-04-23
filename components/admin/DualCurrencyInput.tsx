"use client";

import { Controller, useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";

interface DualCurrencyInputProps {
  label: string;
  madField: string;
  usdField: string;
  optional?: boolean;
  description?: string;
}

function CentsInput({
  value,
  onChange,
  currency,
  optional,
  placeholder,
}: {
  value: number | null | undefined;
  onChange: (v: number | null) => void;
  currency: "MAD" | "USD";
  optional?: boolean;
  placeholder: string;
}) {
  const displayValue =
    value == null || value === 0
      ? ""
      : currency === "USD"
      ? (value / 100).toFixed(2)
      : String(Math.round(value / 100));

  function handleChange(raw: string) {
    if (raw === "") {
      onChange(optional ? null : 0);
      return;
    }
    const num = parseFloat(raw);
    if (isNaN(num) || num < 0) return;
    onChange(Math.round(num * 100));
  }

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-[12px] font-medium select-none">
        {currency === "USD" ? "$" : "MAD"}
      </span>
      <input
        type="number"
        min={0}
        step={currency === "USD" ? "0.01" : "1"}
        value={displayValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full h-9 rounded-lg border border-line bg-white text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 transition-shadow",
          currency === "USD" ? "pl-7 pr-3" : "pl-12 pr-3"
        )}
      />
    </div>
  );
}

export function DualCurrencyInput({
  label,
  madField,
  usdField,
  optional,
  description,
}: DualCurrencyInputProps) {
  const { control } = useFormContext();

  return (
    <div>
      <p className="text-[13px] font-medium text-ink mb-0.5">{label}</p>
      {description && <p className="text-[11px] text-muted mb-2">{description}</p>}
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] font-medium text-muted block mb-1">MAD (dirham)</label>
          <Controller
            control={control}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            name={madField as any}
            render={({ field }) => (
              <CentsInput
                value={field.value as number | null}
                onChange={field.onChange}
                currency="MAD"
                optional={optional}
                placeholder={optional ? "e.g. 899" : "0"}
              />
            )}
          />
          <p className="text-[11px] text-muted mt-0.5">Whole number — e.g. 119 = 119 MAD</p>
        </div>
        <div>
          <label className="text-[11px] font-medium text-muted block mb-1">USD (dollar)</label>
          <Controller
            control={control}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            name={usdField as any}
            render={({ field }) => (
              <CentsInput
                value={field.value as number | null}
                onChange={field.onChange}
                currency="USD"
                optional={optional}
                placeholder={optional ? "e.g. 89.99" : "0.00"}
              />
            )}
          />
          <p className="text-[11px] text-muted mt-0.5">Decimals — e.g. 11.99 = $11.99</p>
        </div>
      </div>
    </div>
  );
}
