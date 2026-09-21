import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { SiteSettingsForm } from "./SiteSettingsForm";

export async function generateMetadata() {
  const t = await getTranslations("AdminSite");
  return { title: t("metaTitle") };
}

async function getSettings() {
  return db.siteSettings.upsert({
    where: { id: "default" },
    create: { id: "default" },
    update: {},
  });
}

async function getPublishedCourses() {
  return db.course.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { title: "asc" },
    select: { id: true, title: true },
  });
}

export default async function AdminSitePage() {
  const [settings, courses] = await Promise.all([getSettings(), getPublishedCourses()]);
  return <SiteSettingsForm settings={settings} publishedCourses={courses} />;
}
