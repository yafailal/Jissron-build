"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { usePathname } from "@/i18n/navigation";
import {
  Settings2,
  BookOpen,
  Video,
  Users,
  FileText,
  Sliders,
  Headphones,
  ShoppingCart,
  BarChart3,
  Wallet,
  ClipboardCheck,
  Tags,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

const NAV = [
  { href: "/admin/analytics", key: "analytics", icon: BarChart3 },
  { href: "/admin/site", key: "site", icon: Settings2 },
  { href: "/admin/courses", key: "courses", icon: BookOpen },
  { href: "/admin/categories", key: "categories", icon: Tags },
  { href: "/admin/grading", key: "grading", icon: ClipboardCheck },
  { href: "/admin/live", key: "liveSessions", icon: Video },
  { href: "/admin/consultants", key: "consultants", icon: Headphones },
  { href: "/admin/orders", key: "orders", icon: ShoppingCart },
  { href: "/admin/payouts", key: "payouts", icon: Wallet },
  { href: "/admin/users", key: "users", icon: Users },
  { href: "/admin/pages", key: "pages", icon: FileText },
  { href: "/admin/settings", key: "settings", icon: Sliders },
];

interface AdminSidebarProps {
  logoUrl?: string | null;
  siteName?: string;
}

export function AdminSidebar({ logoUrl, siteName = "AILearn" }: AdminSidebarProps = {}) {
  const pathname = usePathname();
  const t = useTranslations("AdminCommon");

  return (
    <aside className="w-[240px] shrink-0 flex flex-col bg-[#033a2c] min-h-screen">
      {/* Logo */}
      <Link
        href="/admin/analytics"
        className="h-[60px] flex items-center px-5 border-b border-white/10 hover:bg-white/5 transition-colors"
        aria-label={t("adminHome", { siteName })}
      >
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={siteName}
            width={140}
            height={32}
            className="h-8 w-auto object-contain"
            priority
          />
        ) : (
          <span className="text-[17px] font-extrabold text-white tracking-[-0.01em]">
            {siteName}<span className="text-[#10b981]">Admin</span>
          </span>
        )}
      </Link>

      {/* Nav */}
      <nav className="flex-1 py-3 px-3">
        {NAV.map(({ href, key, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-semibold mb-0.5 transition-colors",
                active
                  ? "bg-white/15 text-white"
                  : "text-white/60 hover:text-white hover:bg-white/8"
              )}
            >
              <Icon size={16} strokeWidth={2} />
              {t(`nav.${key}`)}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-5 py-4 border-t border-white/10">
        <Link
          href="/"
          target="_blank"
          className="text-[12px] text-white/50 hover:text-white/80 transition-colors font-medium"
        >
          ↗ {t("viewPublicSite")}
        </Link>
      </div>
    </aside>
  );
}
