import { enUS, fr, ar, es } from "date-fns/locale";
import type { Locale } from "date-fns";

// Maps the next-intl locale to a date-fns locale (English stays date-fns' default).
export function dateFnsLocale(locale: string): Locale {
  switch (locale) {
    case "fr":
      return fr;
    case "ar":
      return ar;
    case "es":
      return es;
    default:
      return enUS;
  }
}
