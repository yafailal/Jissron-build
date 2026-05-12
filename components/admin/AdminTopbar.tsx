"use client";

import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
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

const LABELS: Record<string, string> = {
  "/admin": "Admin",
  "/admin/analytics": "Analytics",
  "/admin/site": "Site Settings",
  "/admin/courses": "Courses",
  "/admin/live": "Live Sessions",
  "/admin/consultants": "Consultants",
  "/admin/orders": "Orders",
  "/admin/users": "Users",
  "/admin/pages": "Pages",
  "/admin/settings": "Settings",
};

interface AdminTopbarProps {
  session: Session;
}

export function AdminTopbar({ session }: AdminTopbarProps) {
  const pathname = usePathname();

  const segments = pathname.split("/").filter(Boolean);
  const crumbs: { label: string; href: string }[] = [];
  let acc = "";
  for (const seg of segments) {
    acc += `/${seg}`;
    crumbs.push({ label: LABELS[acc] ?? seg, href: acc });
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
            {i > 0 && <ChevronRight size={12} className="text-line-strong" />}
            <span className={i === crumbs.length - 1 ? "text-ink" : ""}>{crumb.label}</span>
          </span>
        ))}
      </nav>

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-lg px-2 py-1 hover:bg-bg-soft transition-colors cursor-pointer">
          <span className="contents">
            <Avatar className="w-8 h-8">
              <AvatarImage src={session.user.image ?? undefined} />
              <AvatarFallback className="bg-primary text-white text-[11px] font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="text-left hidden sm:block">
              <p className="text-[12.5px] font-semibold text-ink leading-tight">
                {session.user.name ?? session.user.email}
              </p>
              <p className="text-[11px] text-muted leading-tight">{session.user.role}</p>
            </div>
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => window.open("/", "_blank")}>
            View site
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => signOut({ callbackUrl: "/signin" })}
          >
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
