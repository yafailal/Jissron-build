import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

/**
 * Messages live in messages/<locale>/<file>.json. Every file's top-level keys are namespaces
 * (e.g. "Hero", "Nav"); all files of a locale are merged. Missing keys fall back to English.
 */
function loadMessages(locale: string): Record<string, unknown> {
  const dir = path.join(process.cwd(), "messages", locale);
  const merged: Record<string, unknown> = {};
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".json")).sort()) {
    const part = JSON.parse(readFileSync(path.join(dir, file), "utf-8"));
    Object.assign(merged, deepMerge(merged, part));
  }
  return merged;
}

function deepMerge(base: Record<string, unknown>, over: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(over)) {
    const b = out[k];
    out[k] =
      v && typeof v === "object" && !Array.isArray(v) && b && typeof b === "object"
        ? deepMerge(b as Record<string, unknown>, v as Record<string, unknown>)
        : v;
  }
  return out;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  const english = loadMessages("en");
  return { locale, messages: locale === "en" ? english : deepMerge(english, loadMessages(locale)) };
});
