import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { SiteSettings } from "@/lib/data/homepage";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { SocialIcon, type SocialLink } from "./SocialIcon";

interface FooterColumn {
  heading: string;
  links: { label: string; url: string }[];
}

interface MarketingFooterProps {
  settings: SiteSettings;
}

export async function MarketingFooter({ settings }: MarketingFooterProps) {
  const t = await getTranslations("Footer");
  const columns = settings.footerColumns as unknown as FooterColumn[];
  const social = settings.footerSocial as unknown as SocialLink[];

  return (
    <footer className="bg-primary text-[#c9d1cc] pt-16 pb-8">
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
                        className="text-[13.5px] font-medium text-[#c9d1cc] hover:text-primary-bright transition-colors"
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
            <span className="text-[20px] font-bold tracking-[-0.01em] leading-none text-white">
              {settings.siteName}
            </span>
            <span className="text-[12.5px] text-[#9aaaa1] font-medium">
              {settings.footerCopyright}
            </span>
            <span className="text-[#9aaaa1]/30 hidden sm:inline">·</span>
            <Link
              href="/contact"
              className="text-[12.5px] text-[#9aaaa1] hover:text-primary-bright font-medium transition-colors"
            >
              {t("contact")}
            </Link>
            <Link
              href="/p/privacy"
              className="text-[12.5px] text-[#9aaaa1] hover:text-primary-bright font-medium transition-colors"
            >
              {t("privacy")}
            </Link>
            <Link
              href="/p/terms"
              className="text-[12.5px] text-[#9aaaa1] hover:text-primary-bright font-medium transition-colors"
            >
              {t("terms")}
            </Link>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher />

            {social.length > 0 && (
              <div className="flex gap-2">
                {social.map((s) => (
                  <a
                    key={s.platform}
                    href={s.url}
                    aria-label={s.platform}
                    className="w-9 h-9 grid place-items-center border border-white/20 rounded-full text-[#c9d1cc] hover:bg-primary-bright hover:text-primary hover:border-primary-bright transition-all"
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
