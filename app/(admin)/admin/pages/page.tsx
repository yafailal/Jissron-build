import Link from "next/link";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/PageHeader";
import { formatDistanceToNow } from "date-fns";
import { FileText } from "lucide-react";

export const metadata = { title: "Pages — JissrON Admin" };

export default async function AdminPagesPage() {
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
        title="Pages"
        description="Static CMS pages (About, Privacy, Terms, etc.). Edit content and meta from here."
      />

      {pages.length === 0 ? (
        <div className="bg-white rounded-lg border border-line p-12 text-center">
          <FileText className="w-10 h-10 text-line-strong mx-auto mb-3" />
          <p className="text-[14px] font-semibold text-ink mb-1">No pages yet</p>
          <p className="text-[12.5px] text-muted">
            Create CMS pages here (About, Privacy, Terms, etc.). Page creation UI coming soon.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-line overflow-hidden">
          <table className="w-full text-[13px]">
            <thead className="bg-bg-soft border-b border-line">
              <tr className="text-left">
                <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-muted">Title</th>
                <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-muted">Slug</th>
                <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-muted">Status</th>
                <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-muted">Updated</th>
                <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-muted text-right">View</th>
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
                        Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-bold uppercase tracking-wide bg-primary-soft text-primary">
                        Draft
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted text-[12px]">
                    {formatDistanceToNow(p.updatedAt, { addSuffix: true })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {p.published ? (
                      <Link
                        href={`/${p.slug}`}
                        target="_blank"
                        className="text-primary hover:underline text-[12px] font-semibold"
                      >
                        Open →
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
        Create / edit / delete UI is coming. Pages can currently be managed via the database or seed file.
      </p>
    </div>
  );
}
