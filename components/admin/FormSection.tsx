import { cn } from "@/lib/utils";

interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <div className={cn("bg-white rounded-lg border border-line px-5 py-4 mb-3 max-w-[600px]", className)}>
      <div className="mb-3 pb-2.5 border-b border-line">
        <h3 className="text-[13px] font-bold text-ink">{title}</h3>
        {description && <p className="text-[11.5px] text-muted mt-0.5">{description}</p>}
      </div>
      <div className="grid gap-2.5">{children}</div>
    </div>
  );
}
