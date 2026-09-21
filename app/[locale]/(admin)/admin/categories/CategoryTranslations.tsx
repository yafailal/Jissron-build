"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  TranslationsEditor,
  type TranslationsValue,
  type TranslatableField,
} from "@/components/admin/TranslationsEditor";
import { saveCategoryTranslations } from "./actions";

interface CategoryRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  translations: TranslationsValue | null;
}

export function CategoryTranslations({ categories }: { categories: CategoryRow[] }) {
  const t = useTranslations("AdminCategories");
  const [values, setValues] = useState<Record<string, TranslationsValue>>(
    Object.fromEntries(categories.map((c) => [c.id, c.translations ?? {}]))
  );
  const [open, setOpen] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const fields: TranslatableField[] = [
    { name: "name", label: t("name") },
    { name: "description", label: t("description"), kind: "textarea", rows: 3 },
  ];

  function save(id: string) {
    start(async () => {
      const res = await saveCategoryTranslations(id, values[id] ?? {});
      if (res.ok) toast.success(t("saved"));
      else toast.error(t("failed"));
    });
  }

  return (
    <ul className="space-y-3">
      {categories.map((c) => {
        const isOpen = open === c.id;
        const langs = Object.keys(values[c.id] ?? {}).filter((l) =>
          Object.values(values[c.id]?.[l] ?? {}).some((v) => v && v.trim() !== "")
        );
        return (
          <li key={c.id} className="rounded-xl border border-line bg-white">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : c.id)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-start"
            >
              <span>
                <span className="block text-[14px] font-bold text-ink">{c.name}</span>
                <span className="block text-[12px] text-muted">{c.slug}</span>
              </span>
              <span className="text-[12px] font-semibold text-primary-mid">
                {langs.length ? langs.map((l) => l.toUpperCase()).join(" · ") : t("noTranslations")}
              </span>
            </button>
            {isOpen && (
              <div className="border-t border-line p-4">
                <TranslationsEditor
                  fields={fields}
                  value={values[c.id]}
                  onChange={(next) => setValues((v) => ({ ...v, [c.id]: next }))}
                  english={{ name: c.name, description: c.description }}
                />
                <div className="mt-4 flex justify-end">
                  <Button type="button" onClick={() => save(c.id)} disabled={pending}>
                    {t("save")}
                  </Button>
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
