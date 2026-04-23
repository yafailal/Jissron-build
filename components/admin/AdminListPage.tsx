import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

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
  newLabel = "New",
  children,
}: AdminListPageProps) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-ink tracking-tight">{title}</h1>
          {description && (
            <p className="text-[13px] text-muted mt-0.5">{description}</p>
          )}
        </div>
        <Link href={newHref} className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}>
          <Plus className="w-3.5 h-3.5" />
          {newLabel}
        </Link>
      </div>
      {children}
    </div>
  );
}
