"use client";

import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface ColorPickerFieldProps {
  name: string;
  label: string;
}

export function ColorPickerField({ name, label }: ColorPickerFieldProps) {
  const form = useFormContext();

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-md border border-line shrink-0"
                style={{ background: field.value || "#ffffff" }}
              />
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
      )}
    />
  );
}
