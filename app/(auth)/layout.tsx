import { getSiteSettings } from "@/lib/data/homepage";
import { getCurrentCurrency } from "@/lib/currency-server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { SignInModalProvider } from "@/components/auth/SignInModalProvider";
import { AutoOpenSignInOnQuery } from "@/components/auth/AutoOpenOnQuery";

// Auth pages share the same global header as the public site for nav consistency.
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const [settings, currency, session, categories, featuredCourses] = await Promise.all([
    getSiteSettings(),
    getCurrentCurrency(),
    auth(),
    db.category.findMany({
      orderBy: { order: "asc" },
      select: { id: true, name: true, slug: true },
      take: 10,
    }),
    db.course.findMany({
      where: { status: "PUBLISHED", OR: [{ isFeatured: true }, { isBestseller: true }] },
      orderBy: [{ isFeatured: "desc" }, { isBestseller: "desc" }, { createdAt: "desc" }],
      select: { id: true, title: true, slug: true },
      take: 6,
    }),
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
        searchPlaceholder={settings?.heroSearchPlaceholder ?? "Search courses…"}
        siteName={settings?.siteName ?? "JissrON"}
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
    </SignInModalProvider>
  );
}
