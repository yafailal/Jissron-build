import { getLocale } from "next-intl/server";

const DEFAULT_LOCALE = "en";

function isPlainObject(v: unknown): v is Record<string, unknown> {
  if (v === null || typeof v !== "object") return false;
  const proto = Object.getPrototypeOf(v);
  return proto === Object.prototype || proto === null;
}

/**
 * Overlays translated text onto database rows.
 *
 * English lives in the normal columns; other languages live in each row's `translations`
 * JSON, shaped `{ fr: { title: "…" }, ar: { … }, es: { … } }`. For every object (at any depth)
 * that has a `translations` value, string fields present for `locale` replace the English ones.
 * Missing or empty translations fall back to English. The `translations` blob itself is removed from
 * the output so other languages are not shipped to the browser. Input is never mutated (it may be cached).
 */
export function localize<T>(data: T, locale: string): T {
  return walk(data, locale) as T;
}

function walk(value: unknown, locale: string): unknown {
  if (Array.isArray(value)) return value.map((v) => walk(v, locale));
  if (!isPlainObject(value)) return value;

  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) out[k] = walk(v, locale);

  const tr = value.translations;
  if ("translations" in out) delete out.translations;
  if (isPlainObject(tr) && locale !== DEFAULT_LOCALE) {
    const mine = tr[locale];
    if (isPlainObject(mine)) {
      for (const [field, text] of Object.entries(mine)) {
        if (typeof text === "string" && text.trim() !== "" && field in value && typeof value[field] === "string") {
          out[field] = text;
        }
      }
    }
  }
  return out;
}

/** Server-side convenience: localize `data` for the current request's language. */
export async function loc<T>(data: T): Promise<T> {
  return localize(data, await getLocale());
}

/** Wraps a data reader so its result is localized for the current request (applied outside any cache). */
export function withLocale<A extends unknown[], R>(fn: (...args: A) => Promise<R>): (...args: A) => Promise<R> {
  return async (...args) => loc(await fn(...args));
}
