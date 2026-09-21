import { getTranslations } from "next-intl/server";
import { Toaster } from "@/components/ui/sonner";
import { getSiteSettings } from "@/lib/data/homepage";
import { getCurrentCurrency } from "@/lib/currency-server";
import { auth } from "@/lib/auth";
import { getNavCategories, getNavFeaturedCourses } from "@/lib/data/nav";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { SignInModalProvider } from "@/components/auth/SignInModalProvider";
import { AutoOpenSignInOnQuery } from "@/components/auth/AutoOpenOnQuery";

// Learn pages now share the same global header as the rest of the public site
// so navigation stays consistent. The lesson-specific course-progress strip
// renders inside the page itself, below this nav.
export default async function LearnLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("Learn");
  const [settings, currency, session, categories, featuredCourses] = await Promise.all([
    getSiteSettings(),
    getCurrentCurrency(),
    auth(),
    getNavCategories(),
    getNavFeaturedCourses(),
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
      <MarketingNav
        variant="accent"
        searchPlaceholder={settings?.heroSearchPlaceholder ?? t("searchPlaceholder")}
        siteName={settings?.siteName ?? "AILearn"}
        logoUrl={settings?.logoUrl ?? null}
        navLinks={(settings?.navLinks as { label: string; url: string }[]) ?? []}
        socialLinks={(settings?.footerSocial as { platform: string; url: string }[]) ?? []}
        categories={categories}
        featuredCourses={featuredCourses}
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
      <Toaster position="bottom-right" richColors />
    </SignInModalProvider>
  );
}
