export type Currency = "MAD" | "USD";

export function formatPrice(madCents: number, usdCents: number, currency: Currency): string {
  if (currency === "USD") {
    if (usdCents === 0) return "Free";
    return `$${(usdCents / 100).toFixed(2)}`;
  }
  // MAD — whole numbers, no decimals
  if (madCents === 0) return "Free";
  return `${Math.round(madCents / 100)} MAD`;
}

export function discountPct(priceCents: number, oldPriceCents: number): number {
  if (!oldPriceCents || oldPriceCents <= priceCents) return 0;
  return Math.round(((oldPriceCents - priceCents) / oldPriceCents) * 100);
}
