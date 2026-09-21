import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/PageHeader";
import type { TranslationsValue } from "@/components/admin/TranslationsEditor";
import { CategoryTranslations } from "./CategoryTranslations";

export async function generateMetadata() {
  const t = await getTranslations("AdminCategories");
  return { title: t("metaTitle") };
}

export default async function AdminCategoriesPage() {
  const t = await getTranslations("AdminCategories");
  const categories = await db.category.findMany({
    orderBy: { order: "asc" },
    select: { id: true, slug: true, name: true, description: true, translations: true },
  });

  return (
    <div>
      <PageHeader title={t("title")} description={t("intro")} />
      <CategoryTranslations
        categories={categories.map((c) => ({ ...c, translations: (c.translations as TranslationsValue | null) ?? null }))}
      />
    </div>
  );
}
