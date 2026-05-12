import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { AdminSignInView } from "@/components/admin/AdminSignInView";
import { Toaster } from "@/components/ui/sonner";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Not signed in — show the styled in-page sign-in (navy bg, popup modal).
  if (!session) {
    return <AdminSignInView />;
  }

  // Signed in but not admin — bounce them to the student dashboard.
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Sidebar logo — prefer the dark variant since the sidebar background is navy.
  const settings = await db.siteSettings.findUnique({
    where: { id: "default" },
    select: { logoUrl: true, logoDarkUrl: true, siteName: true },
  });
  const sidebarLogo = settings?.logoDarkUrl || settings?.logoUrl || null;

  return (
    <div className="flex min-h-screen bg-bg-soft">
      <AdminSidebar logoUrl={sidebarLogo} siteName={settings?.siteName ?? "JissrON"} />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminTopbar session={session} />
        <main id="main-content" className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
      <Toaster position="bottom-right" richColors />
    </div>
  );
}
