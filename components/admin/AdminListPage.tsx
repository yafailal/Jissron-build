import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface AdminListPageProps {
  title: string;
  description?: string;
  newHref: string;
  newLabel?: string;
  children: React.ReactNode;
}

export function AdminListPage({
  title,
  description,
  newHref,
  newLabel,
  children,
}: AdminListPageProps) {
  const t = useTranslations("AdminCommon");
  return (
    <div className="space-y-5">
      <div
        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl px-6 py-5 text-white"
        style={{ background: "linear-gradient(135deg, #064e3b 0%, #0b6b53 62%, #0e7a5a 100%)" }}
      >
        <div className="min-w-0">
          <h1 className="text-[22px] font-extrabold text-white tracking-[-0.02em]">{title}</h1>
          {description && (
            <p className="text-[13px] text-white/85 mt-0.5">{description}</p>
          )}
        </div>
        <Link href={newHref} className={cn(buttonVariants({ size: "sm" }), "gap-1.5 rounded-full bg-white text-primary hover:bg-primary-soft")}>
          <Plus className="w-3.5 h-3.5" />
          {newLabel ?? t("new")}
        </Link>
      </div>
      {children}
    </div>
  );
}
