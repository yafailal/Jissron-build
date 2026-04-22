// Dashboard layout — wraps all authenticated student pages (/dashboard/*)
// Sidebar navigation and dashboard shell added in Phase 4.
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg-soft">
      {/* Dashboard shell (sidebar + topbar) added in Phase 4 */}
      <main id="main-content">{children}</main>
    </div>
  );
}
