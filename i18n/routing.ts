import { defineRouting } from "next-intl/routing";

export const LOCALES = ["en", "fr", "ar", "es"] as const;
export type Locale = (typeof LOCALES)[number];

/**
 * English is the default and stays unprefixed (/courses) so every existing URL, payment
 * callback and email link keeps working. The other languages live under a prefix
 * (/fr/courses, /ar/courses, /es/courses).
 * The default language is provisional — change `defaultLocale` once it is decided.
 */
export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: "en",
  localePrefix: "as-needed",
});

export const RTL_LOCALES: Locale[] = ["ar"];
export const isRtl = (locale: string) => RTL_LOCALES.includes(locale as Locale);
