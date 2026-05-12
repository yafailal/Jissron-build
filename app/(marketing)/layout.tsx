import { getSiteSettings } from "@/lib/data/homepage";
import { getCurrentCurrency } from "@/lib/currency-server";
import { auth } from "@/lib/auth";
import { UrgencyBanner } from "@/components/marketing/UrgencyBanner";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { SignInModalProvider } from "@/components/auth/SignInModalProvider";
import { AutoOpenSignInOnQuery } from "@/components/auth/AutoOpenOnQuery";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, currency, session] = await Promise.all([
    getSiteSettings(),
    getCurrentCurrency(),
    auth(),
  ]);

  return (
    <SignInModalProvider>
      <AutoOpenSignInOnQuery />
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
        logoUrl={settings?.logoUrl ?? null}
        navLinks={(settings?.navLinks as { label: string; url: string }[]) ?? []}
        socialLinks={(settings?.footerSocial as { platform: string; url: string }[]) ?? []}
        currentCurrency={currency}
        user={
          session?.user
            ? {
                name: session.user.name ?? null,
                email: session.user.email ?? "",
                image: session.user.image ?? null,
                role: session.user.role,
              }
            : null
        }
      />
      {children}
      {settings && <MarketingFooter settings={settings} />}
    </SignInModalProvider>
  );
}
