import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes safely — shadcn/ui standard utility */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format cents to display price: 999 → "$9.99" */
export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

/** Calculate discount percentage */
export function discountPct(priceCents: number, oldPriceCents: number): number {
  return Math.round((1 - priceCents / oldPriceCents) * 100);
}

/** Convert duration minutes to "Xh Ym" or "X hours" */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h} hour${h !== 1 ? "s" : ""}`;
  return `${h}h ${m}m`;
}

/** Slugify a string */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
