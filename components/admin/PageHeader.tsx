import { Link } from "@/i18n/navigation";
import { ChevronLeft } from "lucide-react";
import { useTranslations } from "next-intl";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  backHref?: string;
}

export function PageHeader({ title, description, actions, backHref }: PageHeaderProps) {
  const t = useTranslations("AdminCommon");
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 mb-5 rounded-2xl px-6 py-5 text-white"
      style={{ background: "linear-gradient(135deg, #064e3b 0%, #0b6b53 62%, #0e7a5a 100%)" }}
    >
      <div className="min-w-0">
        {backHref && (
          <Link
            href={backHref}
            className="inline-flex items-center gap-1 text-[12px] text-white/80 hover:text-white mb-1 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" />
            {t("back")}
          </Link>
        )}
        <h1 className="text-[22px] font-extrabold text-white tracking-[-0.02em]">{title}</h1>
        {description && <p className="text-[13px] text-white/85 mt-0.5">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0 [&_button]:rounded-full [&_a]:rounded-full [&_button]:border-white/70 [&_button]:bg-white [&_button]:text-primary [&_a]:bg-white [&_a]:text-primary [&_button:hover]:bg-primary-soft [&_a:hover]:bg-primary-soft">{actions}</div>}
    </div>
  );
}
