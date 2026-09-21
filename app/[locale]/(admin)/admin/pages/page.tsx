import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/PageHeader";
import { formatDistanceToNow } from "date-fns";
import { getTranslations, getLocale } from "next-intl/server";
import { enUS, fr, ar, es } from "date-fns/locale";
import { FileText } from "lucide-react";

export async function generateMetadata() {
  const t = await getTranslations("AdminPages");
  return { title: t("metaTitle") };
}

const DATE_LOCALES = { en: enUS, fr, ar, es } as const;

export default async function AdminPagesPage() {
  const t = await getTranslations("AdminPages");
  const locale = await getLocale();
  const dfLocale = DATE_LOCALES[locale as keyof typeof DATE_LOCALES] ?? enUS;
  const pages = await db.page.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      published: true,
      updatedAt: true,
    },
  });

  return (
    <div>
      <PageHeader
        title={t("title")}
        description={t("description")}
      />

      {pages.length === 0 ? (
        <div className="bg-white rounded-lg border border-line p-12 text-center">
          <FileText className="w-10 h-10 text-line-strong mx-auto mb-3" />
          <p className="text-[14px] font-semibold text-ink mb-1">{t("empty")}</p>
          <p className="text-[12.5px] text-muted">
            {t("emptyHint")}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-line overflow-hidden">
          <table className="w-full text-[13px]">
            <thead className="bg-bg-soft border-b border-line">
              <tr className="text-left">
                <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-muted">{t("colTitle")}</th>
                <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-muted">{t("colSlug")}</th>
                <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-muted">{t("colStatus")}</th>
                <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-muted">{t("colUpdated")}</th>
                <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-muted text-right">{t("colView")}</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((p) => (
                <tr key={p.id} className="border-b border-line last:border-0 hover:bg-bg-soft/40 transition-colors">
                  <td className="px-4 py-3 font-semibold text-ink">{p.title}</td>
                  <td className="px-4 py-3 text-muted font-mono text-[12px]">/{p.slug}</td>
                  <td className="px-4 py-3">
                    {p.published ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-bold uppercase tracking-wide bg-green-100 text-green-700">
                        {t("published")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-bold uppercase tracking-wide bg-primary-soft text-primary">
                        {t("draft")}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted text-[12px]">
                    {formatDistanceToNow(p.updatedAt, { addSuffix: true, locale: dfLocale })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {p.published ? (
                      <Link
                        href={`/${p.slug}`}
                        target="_blank"
                        className="text-primary hover:underline text-[12px] font-semibold"
                      >
                        {t("open")}
                      </Link>
                    ) : (
                      <span className="text-muted text-[12px]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-[12px] text-muted mt-3">
        {t("footerNote")}
      </p>
    </div>
  );
}
