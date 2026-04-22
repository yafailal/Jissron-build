import type { SiteSettings } from "@/lib/data/homepage";

interface TrustStripProps {
  settings: SiteSettings;
}

export function TrustStrip({ settings }: TrustStripProps) {
  const logos = settings.trustStripLogos as unknown as { name: string; logoUrl?: string }[];

  return (
    <section className="border-b border-line py-6">
      <div className="wrap">
        <p className="text-[12px] font-semibold text-muted text-center uppercase tracking-[0.08em] mb-5">
          {settings.trustStripLabel}
        </p>
        <div className="flex flex-wrap justify-center items-center gap-x-10 gap-y-4">
          {logos.map((logo) => (
            <span
              key={logo.name}
              className="text-[15px] font-bold text-muted/60 tracking-tight hover:text-muted transition-colors"
            >
              {logo.name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
