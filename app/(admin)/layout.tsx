// Admin layout — wraps all admin panel pages (/admin/*)
// Admin sidebar and header added in Phase 3.
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg-soft">
      {/* Admin shell (sidebar + header) added in Phase 3 */}
      <main id="main-content">{children}</main>
    </div>
  );
}
