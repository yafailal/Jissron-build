import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/PageHeader";
import { SiteSettingsForm } from "./SiteSettingsForm";

export const metadata = { title: "Site Settings — JissrON Admin" };

async function getSettings() {
  return db.siteSettings.upsert({
    where: { id: "default" },
    create: { id: "default" },
    update: {},
  });
}

export default async function AdminSitePage() {
  const settings = await getSettings();

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Site Settings"
        description="Edit every piece of public-facing content from here."
      />
      <SiteSettingsForm settings={settings} />
    </div>
  );
}
