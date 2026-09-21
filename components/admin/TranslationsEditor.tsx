"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/admin/RichTextEditor";

/** { fr: { title: "…" }, ar: { … }, es: { … } } — English stays in the normal columns. */
export type TranslationsValue = Record<string, Record<string, string>>;

export const TRANSLATION_LOCALES = ["fr", "ar", "es"] as const;

export interface TranslatableField {
  /** Column / property name, e.g. "title". */
  name: string;
  label: string;
  kind?: "text" | "textarea" | "richtext";
  rows?: number;
}

/** Drops empty strings and empty languages so only real translations are stored. */
export function cleanTranslations(value: TranslationsValue | null | undefined): TranslationsValue | null {
  if (!value) return null;
  const out: TranslationsValue = {};
  for (const [lang, fields] of Object.entries(value)) {
    const kept = Object.fromEntries(Object.entries(fields ?? {}).filter(([, v]) => typeof v === "string" && v.trim() !== ""));
    if (Object.keys(kept).length) out[lang] = kept;
  }
  return Object.keys(out).length ? out : null;
}

interface TranslationsEditorProps {
  fields: TranslatableField[];
  value: TranslationsValue | null | undefined;
  onChange: (next: TranslationsValue) => void;
  /** English source text per field name, shown as a reference under each label. */
  english?: Record<string, string | null | undefined>;
  className?: string;
}

/** Language tabs (French / Arabic / Spanish) with one input per translatable field. */
export function TranslationsEditor({ fields, value, onChange, english, className }: TranslationsEditorProps) {
  const t = useTranslations("AdminTranslations");
  const [lang, setLang] = useState<(typeof TRANSLATION_LOCALES)[number]>("fr");
  const current = value?.[lang] ?? {};

  function setField(name: string, text: string) {
    onChange({ ...(value ?? {}), [lang]: { ...current, [name]: text } });
  }

  return (
    <div className={`rounded-xl border border-line bg-white p-4 ${className ?? ""}`}>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <h4 className="text-[13px] font-bold text-ink">{t("title")}</h4>
        <div role="tablist" className="flex gap-1.5">
          {TRANSLATION_LOCALES.map((l) => {
            const filled = Object.values(value?.[l] ?? {}).some((v) => v && v.trim() !== "");
            return (
              <button
                key={l}
                type="button"
                role="tab"
                aria-selected={lang === l}
                onClick={() => setLang(l)}
                className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3.5 text-[12.5px] font-semibold transition-colors ${
                  lang === l
                    ? "border-primary bg-primary text-white"
                    : "border-primary-soft bg-primary-softer text-ink hover:border-primary-mid"
                }`}
              >
                {t(l)}
                {filled && <span className="h-1.5 w-1.5 rounded-full bg-primary-bright" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </div>
      <p className="mb-4 text-[12px] text-muted">{t("hint")}</p>

      <div className="space-y-4">
        {fields.map((f) => {
          const src = english?.[f.name];
          const common = {
            value: current[f.name] ?? "",
            onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setField(f.name, e.target.value),
            dir: lang === "ar" ? ("rtl" as const) : ("ltr" as const),
            lang,
          };
          return (
            <div key={f.name}>
              <label className="mb-1 block text-[12.5px] font-semibold text-ink">{f.label}</label>
              {src ? (
                <p className="mb-1.5 line-clamp-2 text-[11.5px] text-muted">
                  {t("english")} {f.kind === "richtext" ? src.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() : src}
                </p>
              ) : null}
              {f.kind === "richtext" ? (
                <div dir={lang === "ar" ? "rtl" : "ltr"} lang={lang}>
                  <RichTextEditor
                    key={`${lang}-${f.name}`}
                    value={current[f.name] ?? ""}
                    // An empty editor reports "<p></p>": store nothing so English is used instead.
                    onChange={(html) => setField(f.name, html.replace(/<p><\/p>/g, "").trim() === "" ? "" : html)}
                  />
                </div>
              ) : f.kind === "textarea" ? (
                <Textarea rows={f.rows ?? 3} {...common} />
              ) : (
                <Input {...common} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
