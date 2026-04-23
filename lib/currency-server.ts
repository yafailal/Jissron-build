import { cookies } from "next/headers";
import { getSiteSettings } from "./data/homepage";
import type { Currency } from "./currency";

export async function getCurrentCurrency(): Promise<Currency> {
  const cookieStore = await cookies();
  const value = cookieStore.get("jissron_currency")?.value;
  if (value === "MAD" || value === "USD") return value;

  const settings = await getSiteSettings();
  if (settings?.defaultCurrency === "USD") return "USD";
  return "MAD";
}
