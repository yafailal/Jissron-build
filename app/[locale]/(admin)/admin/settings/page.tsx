import { Link } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/admin/PageHeader";
import { getTranslations } from "next-intl/server";
import { Palette, CreditCard, FileText, Mail, Shield, UserCog, ChevronRight } from "lucide-react";

export async function generateMetadata() {
  const t = await getTranslations("AdminSettings");
  return { title: t("metaTitle") };
}

interface SettingCard {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  id: string;
  status?: "active" | "soon";
}

const CARDS: SettingCard[] = [
  {
    href: "/admin/site",
    icon: Palette,
    id: "brand",
    status: "active",
  },
  {
    href: "/admin/site#payments",
    icon: CreditCard,
    id: "payments",
    status: "active",
  },
  {
    href: "/admin/pages",
    icon: FileText,
    id: "pages",
    status: "active",
  },
  {
    href: "#",
    icon: Mail,
    id: "email",
    status: "soon",
  },
  {
    href: "#",
    icon: Shield,
    id: "security",
    status: "soon",
  },
  {
    href: "#",
    icon: UserCog,
    id: "profile",
    status: "soon",
  },
];

export default async function AdminSettingsPage() {
  const t = await getTranslations("AdminSettings");
  const session = await auth();

  return (
    <div>
      <PageHeader
        title={t("title")}
        description={t("signedInAs", { email: session?.user?.email ?? t("adminFallback") })}
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
                    <h3 className="text-[13.5px] font-bold text-ink leading-tight">{t(`cards.${card.id}.title`)}</h3>
                    {!isActive && (
                      <span className="text-[10px] font-bold uppercase tracking-wide bg-bg-soft text-muted px-1.5 py-0.5 rounded">
                        {t("soon")}
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-muted mt-1 leading-snug">{t(`cards.${card.id}.description`)}</p>
                </div>
                {isActive && (
                  <ChevronRight className="w-4 h-4 text-muted group-hover:text-primary shrink-0" />
                )}
              </div>
            </div>
          );
          return isActive ? (
            <Link key={card.id} href={card.href}>
              {inner}
            </Link>
          ) : (
            <div key={card.id}>{inner}</div>
          );
        })}
      </div>
    </div>
  );
}
