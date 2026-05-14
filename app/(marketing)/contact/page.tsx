import { Mail, Phone, MessageCircle, MapPin } from "lucide-react";
import { db } from "@/lib/db";
import { ContactForm } from "./ContactForm";

export const metadata = {
  title: "Contact us — JissrON",
  description: "Get in touch with the JissrON team — we'll reply within one business day.",
};

export default async function ContactPage() {
  const settings = await db.siteSettings.findUnique({
    where: { id: "default" },
    select: {
      supportEmail: true,
      supportPhone: true,
      supportWhatsapp: true,
      supportAddress: true,
    },
  });

  const email = settings?.supportEmail?.trim() ?? "";
  const phone = settings?.supportPhone?.trim() ?? "";
  const whatsapp = settings?.supportWhatsapp?.trim() ?? "";
  const address = settings?.supportAddress?.trim() ?? "";

  const whatsappLink = whatsapp ? `https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}` : "";

  return (
    <main className="bg-bg-soft min-h-screen pb-16">
      <section className="bg-gradient-to-b from-primary/[0.08] via-primary/[0.04] to-transparent border-b border-line">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <p className="text-[10.5px] uppercase tracking-wider font-700 text-primary mb-2">
            Contact
          </p>
          <h1 className="text-[28px] sm:text-[34px] font-800 text-ink leading-[1.15] tracking-tight">
            We&apos;d love to hear from you.
          </h1>
          <p className="text-[14px] text-muted font-500 mt-3">
            Questions about a course? Need an invoice? Have feedback? Drop us a line — we usually reply within one business day.
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-8 grid lg:grid-cols-[1fr_1.4fr] gap-8">
        {/* LEFT — direct channels */}
        <div className="space-y-4">
          <h2 className="text-[14px] font-700 text-ink uppercase tracking-wider">Reach us directly</h2>

          {email && (
            <ContactRow
              icon={Mail}
              label="Email"
              value={email}
              href={`mailto:${email}`}
            />
          )}
          {phone && (
            <ContactRow
              icon={Phone}
              label="Phone"
              value={phone}
              href={`tel:${phone.replace(/\s/g, "")}`}
            />
          )}
          {whatsappLink && (
            <ContactRow
              icon={MessageCircle}
              label="WhatsApp"
              value={whatsapp}
              href={whatsappLink}
              external
            />
          )}
          {address && (
            <ContactRow
              icon={MapPin}
              label="Address"
              value={address}
            />
          )}

          {!email && !phone && !whatsapp && !address && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-[12.5px] text-amber-800">
              No direct channels published yet. Use the form on the right — admins can add an email/phone in <span className="font-700">/admin/site → Footer → Contact details</span>.
            </div>
          )}
        </div>

        {/* RIGHT — form */}
        <div>
          <h2 className="text-[14px] font-700 text-ink uppercase tracking-wider mb-3">Send a message</h2>
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
    <div className="bg-white border border-line rounded-xl p-4 flex items-start gap-3 hover:border-primary/30 transition-colors">
      <div className="w-9 h-9 shrink-0 rounded-md bg-primary-soft text-primary grid place-items-center">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10.5px] uppercase tracking-wider font-700 text-muted">{label}</p>
        <p className="text-[13.5px] font-700 text-ink mt-0.5 break-words">{value}</p>
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
