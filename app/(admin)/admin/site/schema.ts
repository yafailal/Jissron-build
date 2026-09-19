import { z } from "zod";

const logoEntry = z.object({ name: z.string(), logoUrl: z.string().optional() });
const statEntry = z.object({ number: z.string(), label: z.string() });
const linkEntry = z.object({ label: z.string(), url: z.string() });
const columnEntry = z.object({ heading: z.string(), links: z.array(linkEntry) });
const socialEntry = z.object({ platform: z.string(), url: z.string() });

export const SiteSettingsSchema = z.object({
  // Brand
  siteName: z.string().min(1),
  tagline: z.string(),
  logoUrl: z.string().optional(),
  logoDarkUrl: z.string().optional(),
  faviconUrl: z.string().optional(),
  defaultCurrency: z.enum(["MAD", "USD"]),
  colorPrimary: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color"),
  colorPrimaryHover: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color"),
  colorPrimaryBright: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color"),
  colorInk: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color"),
  colorBg: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color"),
  colorBorder: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color"),

  // Nav
  navLinks: z.array(linkEntry),

  // Hero
  heroKicker: z.string(),
  heroTitleLine1: z.string(),
  heroTitleLine2: z.string(),
  heroTitleLine3: z.string(),
  heroSubtitle: z.string(),
  heroSearchPlaceholder: z.string(),
  heroPopularTerms: z.array(z.string()),
  heroTrustBullets: z.array(z.string()),

  // Urgency
  urgencyEnabled: z.boolean(),
  urgencyTag: z.string(),
  urgencyMessage: z.string(),
  urgencyEndsAt: z.string().optional().nullable(),
  urgencyCtaLabel: z.string(),
  urgencyCtaUrl: z.string(),

  // Trust strip
  trustStripLabel: z.string(),
  trustStripLogos: z.array(logoEntry),

  // Mid CTA
  midCtaTitle: z.string(),
  midCtaDescription: z.string(),
  midCtaPrimaryLabel: z.string(),
  midCtaPrimaryUrl: z.string(),
  midCtaSecondaryLabel: z.string(),
  midCtaSecondaryUrl: z.string(),
  midCtaStats: z.array(statEntry),
  midCtaCourseIds: z.array(z.string()),

  // Final CTA
  finalCtaTitle: z.string(),
  finalCtaDescription: z.string(),
  finalCtaCtaLabel: z.string(),
  finalCtaCtaUrl: z.string(),

  // Footer
  footerColumns: z.array(columnEntry),
  footerSocial: z.array(socialEntry),
  footerCopyright: z.string(),

  // Contact / support
  supportEmail: z.string(),
  supportPhone: z.string(),
  supportWhatsapp: z.string(),
  supportAddress: z.string(),

  // SEO
  seoTitle: z.string(),
  seoDescription: z.string().optional().nullable(),
  seoOgImageUrl: z.string().optional().nullable(),

  // Bank transfer (MAD)
  bankName: z.string().optional().nullable(),
  bankAccountName: z.string().optional().nullable(),
  bankIBAN: z.string().optional().nullable(),
  bankRIB: z.string().optional().nullable(),
  bankSwift: z.string().optional().nullable(),
  bankInstructions: z.string().optional().nullable(),

  // Lemon Squeezy (USD card payments)
  stripeEnabled: z.boolean(),
  stripeSecretKey: z.string().optional().nullable(),
  stripePublishableKey: z.string().optional().nullable(),
  stripeWebhookSecret: z.string().optional().nullable(),

  // CMI (Moroccan card acquiring)
  cmiEnabled: z.boolean(),
  cmiTestMode: z.boolean(),
  cmiMerchantId: z.string().optional().nullable(),
  cmiStoreKey: z.string().optional().nullable(),
}).superRefine((data, ctx) => {
  if (data.stripeEnabled) {
    if (!data.stripeSecretKey) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["stripeSecretKey"], message: "Required when USD payments are enabled" });
    }
    if (!data.stripePublishableKey) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["stripePublishableKey"], message: "Required when USD payments are enabled" });
    }
    if (!data.stripeWebhookSecret) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["stripeWebhookSecret"], message: "Required when USD payments are enabled" });
    }
  }
  if (data.cmiEnabled) {
    if (!data.cmiMerchantId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["cmiMerchantId"], message: "Required when CMI card payments are enabled" });
    }
    if (!data.cmiStoreKey) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["cmiStoreKey"], message: "Required when CMI card payments are enabled" });
    }
  }
});

export type SiteSettingsFormValues = z.infer<typeof SiteSettingsSchema>;
