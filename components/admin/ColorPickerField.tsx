"use client";

import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface ColorPickerFieldProps {
  name: string;
  label: string;
}

const FULL_HEX = /^#[0-9a-fA-F]{6}$/;

export function ColorPickerField({ name, label }: ColorPickerFieldProps) {
  const form = useFormContext();

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => {
        const raw = (field.value ?? "").toString();
        // Only feed a valid 7-char hex into <input type="color"> to avoid
        // browser warnings while the user is mid-typing in the text field.
        const safeHex = FULL_HEX.test(raw) ? raw.toLowerCase() : "#ffffff";
        return (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl>
              <div className="flex items-center gap-2">
                <label
                  className="relative w-8 h-8 rounded-md border border-line shrink-0 cursor-pointer overflow-hidden focus-within:ring-2 focus-within:ring-primary-ring"
                  style={{ background: FULL_HEX.test(raw) ? raw : "#ffffff" }}
                  title="Click to open color picker"
                >
                  <input
                    type="color"
                    value={safeHex}
                    onChange={(e) => field.onChange(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    aria-label={`${label} color picker`}
                  />
                </label>
                <Input
                  {...field}
                  placeholder="#003d80"
                  className="font-mono text-[13px] w-36"
                  maxLength={7}
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
