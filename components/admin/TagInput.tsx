"use client";

import { useState } from "react";
import { useFormContext, Controller } from "react-hook-form";
import { FormItem, FormLabel, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

interface TagInputProps {
  name: string;
  label: string;
  description?: string;
}

interface TagInputInnerProps {
  value: string[];
  onChange: (tags: string[]) => void;
  label: string;
  description?: string;
}

function TagInputInner({ value, onChange, label, description }: TagInputInnerProps) {
  const [inputValue, setInputValue] = useState("");
  const tags = Array.isArray(value) ? value : [];

  function addTag(raw: string) {
    const tag = raw.trim();
    if (tag && !tags.includes(tag)) onChange([...tags, tag]);
    setInputValue("");
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  }

  return (
    <FormItem>
      <FormLabel>{label}</FormLabel>
      <div className="min-h-[40px] flex flex-wrap gap-1.5 items-center p-2 rounded-lg border border-line bg-white focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 bg-primary-soft text-primary text-[12px] font-semibold px-2 py-0.5 rounded"
          >
            {tag}
            <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500 transition-colors">
              <X size={11} />
            </button>
          </span>
        ))}
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => inputValue && addTag(inputValue)}
          placeholder="Type and press Enter or comma"
          className="flex-1 min-w-[140px] border-none shadow-none focus-visible:ring-0 p-0 text-[13px] h-auto"
        />
      </div>
      {description && <FormDescription>{description}</FormDescription>}
      <FormMessage />
    </FormItem>
  );
}

export function TagInput({ name, label, description }: TagInputProps) {
  const form = useFormContext();
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field }) => (
        <TagInputInner value={field.value} onChange={field.onChange} label={label} description={description} />
      )}
    />
  );
}
