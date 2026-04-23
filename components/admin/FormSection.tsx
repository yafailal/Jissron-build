interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <div className="bg-white rounded-xl border border-line px-8 py-6 mb-5">
      <div className="mb-5 pb-4 border-b border-line">
        <h3 className="text-[14px] font-bold text-ink">{title}</h3>
        {description && <p className="text-[12.5px] text-muted mt-0.5">{description}</p>}
      </div>
      <div className="grid gap-4">{children}</div>
    </div>
  );
}
