"use client";

import { usePathname } from "@/i18n/navigation";
import { signOut } from "next-auth/react";
import { broadcastAuthChange } from "@/components/TabFocusRefresh";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronRight } from "lucide-react";
import type { Session } from "next-auth";
import { useTranslations } from "next-intl";

const LABEL_KEYS: Record<string, string> = {
  "/admin": "admin",
  "/admin/analytics": "analytics",
  "/admin/site": "siteSettings",
  "/admin/courses": "courses",
  "/admin/live": "liveSessions",
  "/admin/consultants": "consultants",
  "/admin/orders": "orders",
  "/admin/users": "users",
  "/admin/pages": "pages",
  "/admin/settings": "settings",
};

interface AdminTopbarProps {
  session: Session;
}

export function AdminTopbar({ session }: AdminTopbarProps) {
  const pathname = usePathname();
  const t = useTranslations("AdminCommon");

  const segments = pathname.split("/").filter(Boolean);
  const crumbs: { label: string; href: string }[] = [];
  let acc = "";
  for (const seg of segments) {
    acc += `/${seg}`;
    crumbs.push({ label: LABEL_KEYS[acc] ? t(`crumbs.${LABEL_KEYS[acc]}`) : seg, href: acc });
  }

  const initials = session.user.name
    ? session.user.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : session.user.email?.[0]?.toUpperCase() ?? "A";

  return (
    <header className="h-[60px] flex items-center justify-between px-6 bg-white border-b border-line shrink-0">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-[12.5px] font-semibold text-muted">
        {crumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight size={12} className="text-line-strong rtl:rotate-180" />}
            <span className={i === crumbs.length - 1 ? "text-ink" : ""}>{crumb.label}</span>
          </span>
        ))}
      </nav>

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-full ps-1 pe-3 py-1 border border-transparent hover:border-line hover:bg-bg-soft transition-colors cursor-pointer">
          <span className="contents">
            <Avatar className="w-8 h-8">
              <AvatarImage src={session.user.image ?? undefined} />
              <AvatarFallback className="bg-primary text-white text-[11px] font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="text-start hidden sm:block">
              <p className="text-[12.5px] font-semibold text-ink leading-tight">
                {session.user.name ?? session.user.email}
              </p>
              <p className="text-[11px] text-muted leading-tight">{session.user.role}</p>
            </div>
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => window.open("/", "_blank")}>
            {t("viewSite")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              broadcastAuthChange();
              signOut({ callbackUrl: "/" });
            }}
          >
            {t("signOut")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
