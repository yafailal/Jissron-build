import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { TabFocusRefresh } from "@/components/TabFocusRefresh";

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-sans", inter.variable)}>
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
