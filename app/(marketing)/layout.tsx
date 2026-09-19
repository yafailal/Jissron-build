import { getSiteSettings } from "@/lib/data/homepage";
import { getCurrentCurrency } from "@/lib/currency-server";
import { getAllCategoriesWithCounts } from "@/lib/data/courses";
import { UrgencyBanner } from "@/components/marketing/UrgencyBanner";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { SignInModalProvider } from "@/components/auth/SignInModalProvider";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, currency, categories] = await Promise.all([
    getSiteSettings(),
    getCurrentCurrency(),
    getAllCategoriesWithCounts(),
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
          }
        `}</style>
      )}
      {settings && <UrgencyBanner settings={settings} />}
      <MarketingNav
        searchPlaceholder={settings?.heroSearchPlaceholder ?? "Search courses…"}
        siteName={settings?.siteName ?? "AILearn"}
        logoUrl={settings?.logoUrl ?? null}
        categories={categories.map((c) => ({ name: c.name, slug: c.slug, courseCount: c._count.courses }))}
        navLinks={(settings?.navLinks as { label: string; url: string }[]) ?? []}
        currentCurrency={currency}
      />
      {children}
      {settings && <MarketingFooter settings={settings} />}
    </SignInModalProvider>
  );
}
