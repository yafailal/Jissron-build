"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, GripVertical } from "lucide-react";

interface FieldDef {
  key: string;
  label: string;
  placeholder?: string;
  type?: string;
}

interface RepeatableListProps {
  name: string;
  label: string;
  fields: FieldDef[];
  addLabel?: string;
  defaultItem?: Record<string, string>;
}

export function RepeatableList({
  name,
  label,
  fields,
  addLabel = "Add item",
  defaultItem,
}: RepeatableListProps) {
  const form = useFormContext();
  const { fields: items, append, remove } = useFieldArray({ control: form.control, name });

  const blank = defaultItem ?? Object.fromEntries(fields.map((f) => [f.key, ""]));

  return (
    <div>
      <p className="text-[12px] font-semibold text-ink uppercase tracking-[0.06em] mb-2">{label}</p>
      <div className="space-y-2 mb-3">
        {items.map((item, idx) => (
          <div key={item.id} className="flex items-center gap-2">
            <GripVertical size={14} className="text-muted shrink-0 cursor-grab" />
            {fields.map((f) => (
              <Input
                key={f.key}
                {...form.register(`${name}.${idx}.${f.key}`)}
                placeholder={f.placeholder ?? f.label}
                type={f.type ?? "text"}
                className="flex-1 text-[13px]"
              />
            ))}
            <button
              type="button"
              onClick={() => remove(idx)}
              className="text-muted hover:text-red-500 transition-colors shrink-0"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={() => append(blank)} className="text-[12px]">
        <Plus size={13} className="mr-1" />
        {addLabel}
      </Button>
    </div>
  );
}
