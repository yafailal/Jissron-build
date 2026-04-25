function formatLastActive(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  return `${diffDays} days ago`;
}

interface DashboardHeaderProps {
  firstName: string | null;
  lastActive: Date | null;
}

export function DashboardHeader({ firstName, lastActive }: DashboardHeaderProps) {
  return (
    <div className="mb-8">
      <h1
        className="text-3xl sm:text-4xl font-700 text-ink leading-tight mb-1.5"
        style={{ fontFamily: "var(--font-crimson), Georgia, serif" }}
      >
        <em>Welcome back{firstName ? `, ${firstName}` : ""}.</em>
      </h1>
      {lastActive && (
        <p className="text-sm text-muted font-500">
          Last active: {formatLastActive(lastActive)}
        </p>
      )}
    </div>
  );
}
