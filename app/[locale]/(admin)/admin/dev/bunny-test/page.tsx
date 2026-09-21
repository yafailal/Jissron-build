// Dev-only verification tool — consider removing in Phase 7.
import { redirect } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { generateBunnyEmbedUrl, BUNNY_SIGNED_URL_EXPIRY_SECONDS } from "@/lib/bunny";

interface PageProps {
  searchParams: Promise<{ guid?: string }>;
}

export default async function BunnyTestPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/admin");

  const t = await getTranslations("AdminDev");
  const locale = await getLocale();
  const { guid } = await searchParams;

  let embedUrl: string | null = null;
  let error: string | null = null;
  let expiresAt: Date | null = null;

  if (guid) {
    try {
      embedUrl = generateBunnyEmbedUrl(guid);
      expiresAt = new Date(Date.now() + BUNNY_SIGNED_URL_EXPIRY_SECONDS * 1000);
    } catch (e) {
      error = e instanceof Error ? e.message : "Unknown error generating URL";
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-extrabold text-ink">{t("bunnyTitle")}</h1>
        <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-bold uppercase tracking-wide">
          {t("devOnly")}
        </span>
      </div>
      <p className="text-[13px] text-muted">
        {t("bunnyIntro")}
      </p>

      <form method="GET" className="flex gap-2">
        <input
          name="guid"
          defaultValue={guid ?? ""}
          placeholder={t("guidPlaceholder")}
          className="flex-1 h-9 px-3 rounded-lg border border-line text-[13px] font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <button
          type="submit"
          className="h-9 px-4 rounded-full bg-primary text-white text-[13px] font-bold hover:bg-primary-hover transition-colors"
        >
          {t("generate")}
        </button>
      </form>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[13px] font-medium">
          {error}
        </div>
      )}

      {embedUrl && expiresAt && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-bg-soft border border-line space-y-2">
            <p className="text-[11px] font-bold text-muted uppercase tracking-wide">{t("generatedUrl")}</p>
            <p className="text-[12px] font-mono text-ink break-all">{embedUrl}</p>
            <p className="text-[11px] text-muted">
              {t("expiresAt", { date: expiresAt.toLocaleString(locale === "ar" ? "ar-u-nu-latn" : locale), hours: BUNNY_SIGNED_URL_EXPIRY_SECONDS / 3600 })}
            </p>
          </div>

          <div className="rounded-xl overflow-hidden border border-line bg-black" style={{ paddingBottom: "56.25%", position: "relative" }}>
            <iframe
              src={embedUrl}
              allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
            />
          </div>

          <p className="text-[12px] text-muted text-center">
            {t("playsOk")}
          </p>
        </div>
      )}
    </div>
  );
}
