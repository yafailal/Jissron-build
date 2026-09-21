import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { PageBand } from "@/components/marketing/PageBand";
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
    <main className="bg-bg-soft min-h-screen pb-10">
      <PageBand
        title={page.title}
        description={t("cms.lastUpdated", { date: page.updatedAt.toLocaleDateString(dateLocale, { day: "numeric", month: "long", year: "numeric" }) })}
      />

      <article className="wrap py-8">
        <div
          className="mx-auto max-w-[720px] bg-white border border-line rounded-2xl p-6 sm:p-10 text-[15px] leading-[1.75] text-body-text break-words
            [&_h1]:text-[26px] [&_h1]:font-extrabold [&_h1]:tracking-[-0.02em] [&_h1]:text-ink [&_h1]:mt-8 [&_h1]:mb-3 [&_h1:first-child]:mt-0
            [&_h2]:text-[22px] [&_h2]:font-extrabold [&_h2]:tracking-[-0.02em] [&_h2]:text-ink [&_h2]:mt-8 [&_h2]:mb-3 [&_h2:first-child]:mt-0
            [&_h3]:text-[17px] [&_h3]:font-bold [&_h3]:text-ink [&_h3]:mt-6 [&_h3]:mb-2
            [&_h4]:text-[15px] [&_h4]:font-bold [&_h4]:text-ink [&_h4]:mt-5 [&_h4]:mb-2
            [&_p]:my-3 [&_strong]:font-bold [&_strong]:text-ink
            [&_a]:text-primary-mid [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:text-primary
            [&_ul]:list-disc [&_ul]:ps-6 [&_ul]:my-3 [&_ol]:list-decimal [&_ol]:ps-6 [&_ol]:my-3 [&_li]:my-1 [&_li::marker]:text-primary-mid
            [&_blockquote]:border-s-4 [&_blockquote]:border-primary-bright [&_blockquote]:bg-primary-softer [&_blockquote]:ps-4 [&_blockquote]:py-2 [&_blockquote]:my-4
            [&_hr]:my-6 [&_hr]:border-line [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-2xl
            [&_table]:w-full [&_table]:my-4 [&_table]:text-[14px] [&_th]:text-start [&_th]:font-bold [&_th]:text-ink [&_th]:border-b [&_th]:border-line [&_th]:py-2 [&_td]:border-b [&_td]:border-line [&_td]:py-2"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      </article>
    </main>
  );
}
