import { getSiteSettings } from "@/lib/data/homepage";
import { getCurrentCurrency } from "@/lib/currency-server";
import { UrgencyBanner } from "@/components/marketing/UrgencyBanner";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { SignInModalProvider } from "@/components/auth/SignInModalProvider";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, currency] = await Promise.all([
    getSiteSettings(),
    getCurrentCurrency(),
  ]);

  return (
    <SignInModalProvider>
      {settings && (
        <style>{`
          :root {
            --primary: ${settings.colorPrimary};
            --primary-hover: ${settings.colorPrimaryHover};
            --primary-bright: ${settings.colorPrimaryBright};
            --ink: ${settings.colorInk};
            --bg: ${settings.colorBg};
            --line: ${settings.colorBorder};
          }
        `}</style>
      )}
      {settings && <UrgencyBanner settings={settings} />}
      <MarketingNav
        searchPlaceholder={settings?.heroSearchPlaceholder ?? "Search courses…"}
        siteName={settings?.siteName ?? "JissrON"}
        navLinks={(settings?.navLinks as { label: string; url: string }[]) ?? []}
        socialLinks={(settings?.footerSocial as { platform: string; url: string }[]) ?? []}
        currentCurrency={currency}
      />
      {children}
      {settings && <MarketingFooter settings={settings} />}
    </SignInModalProvider>
  );
}
