import { db } from "@/lib/db";
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

  return <SiteSettingsForm settings={settings} />;
}
