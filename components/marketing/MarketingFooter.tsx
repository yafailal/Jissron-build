import Link from "next/link";
import type { SiteSettings } from "@/lib/data/homepage";

interface FooterColumn {
  heading: string;
  links: { label: string; url: string }[];
}

interface SocialLink {
  platform: string;
  url: string;
}

function SocialIcon({ platform }: { platform: string }) {
  switch (platform) {
    case "twitter":
      return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" /></svg>;
    case "linkedin":
      return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-4 0v7h-4v-7a6 6 0 016-6zM2 9h4v12H2zM4 7a2 2 0 100-4 2 2 0 000 4z" /></svg>;
    case "youtube":
      return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 00.5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 002.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 002.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.6 15.6V8.4l6.2 3.6-6.2 3.6z" /></svg>;
    case "instagram":
      return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></svg>;
    default:
      return null;
  }
}

interface MarketingFooterProps {
  settings: SiteSettings;
}

export function MarketingFooter({ settings }: MarketingFooterProps) {
  const columns = settings.footerColumns as unknown as FooterColumn[];
  const social = settings.footerSocial as unknown as SocialLink[];

  return (
    <footer className="bg-primary text-[#c4d0e0] pt-16 pb-8">
      <div className="wrap">
        {/* Columns */}
        {columns.length > 0 && (
          <div
            className="grid gap-10 pb-10"
            style={{ gridTemplateColumns: `repeat(${Math.min(columns.length, 5)}, 1fr)` }}
          >
            {columns.map((col) => (
              <div key={col.heading}>
                <h6 className="text-[13px] font-bold text-white mb-4">{col.heading}</h6>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.url}
                        className="text-[13.5px] font-medium text-[#c4d0e0] hover:text-primary-bright transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* Bottom bar */}
        <div className="flex flex-wrap justify-between items-center gap-5 pt-6 border-t border-white/10">
          {/* Wordmark + copyright */}
          <div className="flex items-center gap-4">
            <span className="text-[20px] font-bold tracking-[-0.01em] leading-none">
              <span className="text-white">J</span>
              <span className="text-[#c4d0e0]">issrO</span>
              <span className="text-white">N</span>
            </span>
            <span className="text-[12.5px] text-[#8da0bc] font-medium">
              {settings.footerCopyright}
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <button className="inline-flex items-center gap-2 px-3.5 py-2 border border-white/25 rounded-md text-[12.5px] font-semibold text-white hover:border-primary-bright hover:text-primary-bright transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
              </svg>
              English
            </button>

            {social.length > 0 && (
              <div className="flex gap-2">
                {social.map((s) => (
                  <a
                    key={s.platform}
                    href={s.url}
                    aria-label={s.platform}
                    className="w-9 h-9 grid place-items-center border border-white/20 rounded-full text-[#c4d0e0] hover:bg-primary-bright hover:text-primary hover:border-primary-bright transition-all"
                  >
                    <SocialIcon platform={s.platform} />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
