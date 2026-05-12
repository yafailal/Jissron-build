"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/site", label: "Site", icon: Settings2 },
  { href: "/admin/courses", label: "Courses", icon: BookOpen },
  { href: "/admin/grading", label: "Grading", icon: ClipboardCheck },
  { href: "/admin/live", label: "Live Sessions", icon: Video },
  { href: "/admin/consultants", label: "Consultants", icon: Headphones },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/payouts", label: "Payouts", icon: Wallet },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/pages", label: "Pages", icon: FileText },
  { href: "/admin/settings", label: "Settings", icon: Sliders },
];

interface AdminSidebarProps {
  logoUrl?: string | null;
  siteName?: string;
}

export function AdminSidebar({ logoUrl, siteName = "JissrON" }: AdminSidebarProps = {}) {
  const pathname = usePathname();

  return (
    <aside className="w-[240px] shrink-0 flex flex-col bg-[#002a5a] min-h-screen">
      {/* Logo */}
      <Link
        href="/admin/analytics"
        className="h-[60px] flex items-center px-5 border-b border-white/10 hover:bg-white/5 transition-colors"
        aria-label={`${siteName} admin home`}
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
            {siteName}<span className="text-[#0071e3]">Admin</span>
          </span>
        )}
      </Link>

      {/* Nav */}
      <nav className="flex-1 py-3 px-3">
        {NAV.map(({ href, label, icon: Icon }) => {
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
              {label}
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
          ↗ View public site
        </Link>
      </div>
    </aside>
  );
}
