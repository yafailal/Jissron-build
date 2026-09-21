import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { loc } from "@/lib/localize";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "CourseDetail" });
  const page = await loc(await db.page.findUnique({ where: { slug } }));
  if (!page) return { title: t("cms.notFoundTitle") };
  return {
    title: page.metaTitle ?? t("cms.titleSuffix", { title: page.title }),
    description: page.metaDescription ?? undefined,
  };
}

export default async function CmsPage({ params }: PageProps) {
  const { slug } = await params;
  const page = await loc(await db.page.findUnique({ where: { slug } }));
  if (!page || !page.published) notFound();
  const t = await getTranslations("CourseDetail");
  const locale = await getLocale();
  const dateLocale = locale === "en" ? "en-GB" : locale === "ar" ? "ar-u-nu-latn" : locale;

  return (
    <main className="bg-bg-soft min-h-screen pb-16">
      <section className="bg-gradient-to-b from-primary/[0.06] to-transparent border-b border-line">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <h1 className="text-[28px] sm:text-[34px] font-800 text-ink leading-[1.15] tracking-tight">
            {page.title}
          </h1>
          <p className="text-[12px] text-muted mt-2">
            {t("cms.lastUpdated", { date: page.updatedAt.toLocaleDateString(dateLocale, { day: "numeric", month: "long", year: "numeric" }) })}
          </p>
        </div>
      </section>

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div
          className="prose prose-sm max-w-none text-ink/85"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      </article>
    </main>
  );
}
