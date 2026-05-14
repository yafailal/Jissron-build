import Link from "next/link";
import type { SiteSettings } from "@/lib/data/homepage";
import { SocialIcon, type SocialLink } from "./SocialIcon";

interface FooterColumn {
  heading: string;
  links: { label: string; url: string }[];
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-10 pb-10">
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
            <span className="text-[#8da0bc]/30 hidden sm:inline">·</span>
            <Link
              href="/contact"
              className="text-[12.5px] text-[#8da0bc] hover:text-primary-bright font-medium transition-colors"
            >
              Contact
            </Link>
            <Link
              href="/p/privacy"
              className="text-[12.5px] text-[#8da0bc] hover:text-primary-bright font-medium transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/p/terms"
              className="text-[12.5px] text-[#8da0bc] hover:text-primary-bright font-medium transition-colors"
            >
              Terms
            </Link>
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
