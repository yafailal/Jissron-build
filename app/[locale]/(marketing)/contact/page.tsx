import { Mail, Phone, MessageCircle, MapPin } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { loc } from "@/lib/localize";
import { PageBand } from "@/components/marketing/PageBand";
import { ContactForm } from "./ContactForm";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Contact" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function ContactPage() {
  const t = await getTranslations("Contact");
  const settingsRaw = await db.siteSettings.findUnique({
    where: { id: "default" },
    select: {
      supportEmail: true,
      supportPhone: true,
      supportWhatsapp: true,
      supportAddress: true,
      translations: true,
    },
  });
  const settings = await loc(settingsRaw);

  const email = settings?.supportEmail?.trim() ?? "";
  const phone = settings?.supportPhone?.trim() ?? "";
  const whatsapp = settings?.supportWhatsapp?.trim() ?? "";
  const address = settings?.supportAddress?.trim() ?? "";

  const whatsappLink = whatsapp ? `https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}` : "";

  return (
    <main className="bg-bg-soft min-h-screen pb-10">
      <PageBand eyebrow={t("eyebrow")} title={t("title")} description={t("intro")} />

      <section className="wrap py-8 grid lg:grid-cols-[1fr_1.4fr] gap-8">
        {/* LEFT — direct channels */}
        <div className="space-y-4">
          <h2 className="text-[12px] font-bold text-primary-mid uppercase tracking-[0.1em]">{t("reach")}</h2>

          {email && (
            <ContactRow
              icon={Mail}
              label={t("email")}
              value={email}
              href={`mailto:${email}`}
            />
          )}
          {phone && (
            <ContactRow
              icon={Phone}
              label={t("phone")}
              value={phone}
              href={`tel:${phone.replace(/\s/g, "")}`}
            />
          )}
          {whatsappLink && (
            <ContactRow
              icon={MessageCircle}
              label={t("whatsapp")}
              value={whatsapp}
              href={whatsappLink}
              external
            />
          )}
          {address && (
            <ContactRow
              icon={MapPin}
              label={t("address")}
              value={address}
            />
          )}

          {!email && !phone && !whatsapp && !address && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-[12.5px] text-amber-800">
              {t.rich("noChannels", {
                b: (chunks) => <span className="font-bold">{chunks}</span>,
              })}
            </div>
          )}
        </div>

        {/* RIGHT — form */}
        <div>
          <h2 className="text-[12px] font-bold text-primary-mid uppercase tracking-[0.1em] mb-3">{t("send")}</h2>
          <ContactForm />
        </div>
      </section>
    </main>
  );
}

function ContactRow({
  icon: Icon,
  label,
  value,
  href,
  external,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  href?: string;
  external?: boolean;
}) {
  const inner = (
    <div className="bg-white border border-line rounded-2xl p-4 flex items-start gap-3 hover:border-primary hover:shadow-card transition-colors">
      <div className="w-9 h-9 shrink-0 rounded-md bg-primary-soft text-primary grid place-items-center">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10.5px] uppercase tracking-wider font-bold text-muted">{label}</p>
        <p className="text-[13.5px] font-bold text-ink mt-0.5 break-words">{value}</p>
      </div>
    </div>
  );
  if (!href) return inner;
  return (
    <a href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined} className="block">
      {inner}
    </a>
  );
}
