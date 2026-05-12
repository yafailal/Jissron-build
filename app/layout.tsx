import type { Metadata } from "next";
import { Montserrat, Crimson_Pro } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { TabFocusRefresh } from "@/components/TabFocusRefresh";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-montserrat",
  display: "swap",
});

const crimsonPro = Crimson_Pro({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-crimson",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "JissrON — Learning Management System | EdTech Platform",
    template: "%s | JissrON",
  },
  description:
    "Master new skills with 1,200+ expert-led courses, weekly live sessions, and private mentorship.",
  metadataBase: new URL(
    process.env.NEXTAUTH_URL ?? "http://localhost:3000"
  ),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-sans", montserrat.variable, crimsonPro.variable)}>
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
