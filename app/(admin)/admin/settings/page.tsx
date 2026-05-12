import Link from "next/link";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/admin/PageHeader";
import { Palette, CreditCard, FileText, Mail, Shield, UserCog, ChevronRight } from "lucide-react";

export const metadata = { title: "Settings — JissrON Admin" };

interface SettingCard {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  status?: "active" | "soon";
}

const CARDS: SettingCard[] = [
  {
    href: "/admin/site",
    icon: Palette,
    title: "Brand & site content",
    description: "Edit colors, logo, hero copy, urgency banner, footer — all public-facing content.",
    status: "active",
  },
  {
    href: "/admin/site#payments",
    icon: CreditCard,
    title: "Payments",
    description: "Bank transfer (MAD) details and Stripe (USD) keys.",
    status: "active",
  },
  {
    href: "/admin/pages",
    icon: FileText,
    title: "Pages",
    description: "Static CMS pages — About, Privacy, Terms.",
    status: "active",
  },
  {
    href: "#",
    icon: Mail,
    title: "Email & notifications",
    description: "Sender domain, transactional templates, admin alerts.",
    status: "soon",
  },
  {
    href: "#",
    icon: Shield,
    title: "Security",
    description: "Rate limiting, login alerts, audit log retention.",
    status: "soon",
  },
  {
    href: "#",
    icon: UserCog,
    title: "Profile",
    description: "Your admin account name, avatar, password.",
    status: "soon",
  },
];

export default async function AdminSettingsPage() {
  const session = await auth();

  return (
    <div>
      <PageHeader
        title="Settings"
        description={`Signed in as ${session?.user?.email ?? "admin"}.`}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {CARDS.map((card) => {
          const Icon = card.icon;
          const isActive = card.status === "active";
          const inner = (
            <div
              className={`group h-full bg-white rounded-lg border border-line p-4 transition-all ${
                isActive
                  ? "hover:border-primary hover:shadow-sm cursor-pointer"
                  : "opacity-70 cursor-not-allowed"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary-soft text-primary grid place-items-center shrink-0">
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[13.5px] font-bold text-ink leading-tight">{card.title}</h3>
                    {!isActive && (
                      <span className="text-[10px] font-bold uppercase tracking-wide bg-bg-soft text-muted px-1.5 py-0.5 rounded">
                        Soon
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-muted mt-1 leading-snug">{card.description}</p>
                </div>
                {isActive && (
                  <ChevronRight className="w-4 h-4 text-muted group-hover:text-primary shrink-0" />
                )}
              </div>
            </div>
          );
          return isActive ? (
            <Link key={card.title} href={card.href}>
              {inner}
            </Link>
          ) : (
            <div key={card.title}>{inner}</div>
          );
        })}
      </div>
    </div>
  );
}
