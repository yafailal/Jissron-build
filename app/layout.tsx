import type { Metadata } from "next";
import { Inter, Noto_Naskh_Arabic } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { TabFocusRefresh } from "@/components/TabFocusRefresh";
import { getLocale } from "next-intl/server";
import { isRtl } from "@/i18n/routing";

// Arabic glyphs (Inter has none). Only downloaded by the browser when a page contains Arabic text.
const notoNaskhArabic = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-arabic",
  display: "swap",
  preload: false,
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "AILearn — Learning Management System | EdTech Platform",
    template: "%s | AILearn",
  },
  description:
    "Master new skills with expert-led courses, live sessions and 1-to-1 expert consultations.",
  metadataBase: new URL(
    process.env.NEXTAUTH_URL ?? "http://localhost:3000"
  ),
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();

  return (
    <html lang={locale} dir={isRtl(locale) ? "rtl" : "ltr"} className={cn("font-sans", inter.variable, notoNaskhArabic.variable)}>
      <body>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <TabFocusRefresh />
        {children}
      </body>
    </html>
  );
}
