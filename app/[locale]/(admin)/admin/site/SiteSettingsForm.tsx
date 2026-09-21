"use client";

import { Fragment, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useForm, useFormContext, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { FormSection } from "@/components/admin/FormSection";
import { ColorPickerField } from "@/components/admin/ColorPickerField";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { TagInput } from "@/components/admin/TagInput";
import { RepeatableList } from "@/components/admin/RepeatableList";
import { TranslationsEditor, type TranslatableField, type TranslationsValue } from "@/components/admin/TranslationsEditor";
import { createSiteSettingsSchema, type SiteSettingsFormValues } from "./schema";
import { saveSiteSettings } from "./actions";
import type { SiteSettings } from "@prisma/client";

interface Props {
  settings: SiteSettings;
  publishedCourses?: { id: string; title: string }[];
}

export function SiteSettingsForm({ settings, publishedCourses = [] }: Props) {
  const t = useTranslations("AdminSite");
  const tTr = useTranslations("AdminTrSite");
  const schema = useMemo(
    () =>
      createSiteSettingsSchema({
        hex: t("validation.hex"),
        stripeRequired: t("validation.stripeRequired"),
        cmiRequired: t("validation.cmiRequired"),
      }),
    [t]
  );
  const form = useForm<SiteSettingsFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      // Brand
      siteName: settings.siteName,
      tagline: settings.tagline,
      defaultCurrency: (settings.defaultCurrency === "USD" ? "USD" : "MAD") as "MAD" | "USD",
      logoUrl: settings.logoUrl ?? "",
      logoDarkUrl: settings.logoDarkUrl ?? "",
      faviconUrl: settings.faviconUrl ?? "",
      colorPrimary: settings.colorPrimary,
      colorPrimaryHover: settings.colorPrimaryHover,
      colorPrimaryBright: settings.colorPrimaryBright,
      colorInk: settings.colorInk,
      colorBg: settings.colorBg,
      colorBorder: settings.colorBorder,

      // Nav
      navLinks: (settings.navLinks as { label: string; url: string }[]) ?? [],

      // Hero
      heroKicker: settings.heroKicker,
      heroTitleLine1: settings.heroTitleLine1,
      heroTitleLine2: settings.heroTitleLine2,
      heroTitleLine3: settings.heroTitleLine3,
      heroSubtitle: settings.heroSubtitle,
      heroSearchPlaceholder: settings.heroSearchPlaceholder,
      heroPopularTerms: (settings.heroPopularTerms as string[]) ?? [],
      heroTrustBullets: (settings.heroTrustBullets as string[]) ?? [],

      // Urgency
      urgencyEnabled: settings.urgencyEnabled,
      urgencyTag: settings.urgencyTag,
      urgencyMessage: settings.urgencyMessage,
      urgencyEndsAt: settings.urgencyEndsAt
        ? new Date(settings.urgencyEndsAt).toISOString().slice(0, 16)
        : "",
      urgencyCtaLabel: settings.urgencyCtaLabel,
      urgencyCtaUrl: settings.urgencyCtaUrl,

      // Trust strip
      trustStripLabel: settings.trustStripLabel,
      trustStripLogos: (settings.trustStripLogos as { name: string; logoUrl?: string }[]) ?? [],

      // Mid CTA
      midCtaTitle: settings.midCtaTitle,
      midCtaDescription: settings.midCtaDescription,
      midCtaPrimaryLabel: settings.midCtaPrimaryLabel,
      midCtaPrimaryUrl: settings.midCtaPrimaryUrl,
      midCtaSecondaryLabel: settings.midCtaSecondaryLabel,
      midCtaSecondaryUrl: settings.midCtaSecondaryUrl,
      midCtaStats: (settings.midCtaStats as { number: string; label: string }[]) ?? [],
      midCtaCourseIds: (settings.midCtaCourseIds as string[]) ?? [],

      // Final CTA
      finalCtaTitle: settings.finalCtaTitle,
      finalCtaDescription: settings.finalCtaDescription,
      finalCtaCtaLabel: settings.finalCtaCtaLabel,
      finalCtaCtaUrl: settings.finalCtaCtaUrl,

      // Footer
      footerColumns:
        (settings.footerColumns as { heading: string; links: { label: string; url: string }[] }[]) ?? [],
      footerSocial: (settings.footerSocial as { platform: string; url: string }[]) ?? [],
      footerCopyright: settings.footerCopyright,

      // Contact / support
      supportEmail: settings.supportEmail ?? "",
      supportPhone: settings.supportPhone ?? "",
      supportWhatsapp: settings.supportWhatsapp ?? "",
      supportAddress: settings.supportAddress ?? "",

      // SEO
      seoTitle: settings.seoTitle,
      seoDescription: settings.seoDescription ?? "",
      seoOgImageUrl: settings.seoOgImageUrl ?? "",

      // Bank transfer (MAD)
      bankName: settings.bankName ?? "",
      bankAccountName: settings.bankAccountName ?? "",
      bankIBAN: settings.bankIBAN ?? "",
      bankRIB: settings.bankRIB ?? "",
      bankSwift: settings.bankSwift ?? "",
      bankInstructions: settings.bankInstructions ?? "",

      // Lemon Squeezy (USD)
      stripeEnabled: settings.stripeEnabled,
      stripeSecretKey: settings.stripeSecretKey ?? "",
      stripePublishableKey: settings.stripePublishableKey ?? "",
      stripeWebhookSecret: settings.stripeWebhookSecret ?? "",

      // CMI (Moroccan card acquiring)
      cmiEnabled: settings.cmiEnabled,
      cmiTestMode: settings.cmiTestMode,
      cmiMerchantId: settings.cmiMerchantId ?? "",
      cmiStoreKey: settings.cmiStoreKey ?? "",

      // Translations (fr/ar/es)
      translations: (settings.translations as TranslationsValue | null) ?? {},
    },
  });

  const { isDirty, isSubmitting } = form.formState;

const translatableFields: TranslatableField[] = [
    { name: "tagline", label: t("tagline") },
    { name: "heroKicker", label: t("kickerSmallLineAboveHeadline") },
    { name: "heroTitleLine1", label: t("titleLine1") },
    { name: "heroTitleLine2", label: t("titleLine2") },
    { name: "heroTitleLine3", label: t("titleLine3") },
    { name: "heroSubtitle", label: t("subtitle"), kind: "textarea" },
    { name: "heroSearchPlaceholder", label: t("searchPlaceholder") },
    { name: "urgencyTag", label: t("tagLabel") },
    { name: "urgencyMessage", label: t("message"), kind: "textarea" },
    { name: "urgencyCtaLabel", label: t("ctaLabel") },
    { name: "trustStripLabel", label: t("label") },
    { name: "midCtaTitle", label: t("midPageCtaBanner") },
    { name: "midCtaDescription", label: t("description"), kind: "textarea" },
    { name: "midCtaPrimaryLabel", label: t("primaryCtaLabel") },
    { name: "midCtaSecondaryLabel", label: t("secondaryCtaLabel") },
    { name: "finalCtaTitle", label: t("finalCtaSection") },
    { name: "finalCtaDescription", label: t("description"), kind: "textarea" },
    { name: "finalCtaCtaLabel", label: t("ctaButtonLabel") },
    { name: "footerCopyright", label: t("copyrightText") },
    { name: "supportAddress", label: t("address"), kind: "textarea" },
    { name: "bankInstructions", label: t("paymentInstructions"), kind: "textarea" },
    { name: "seoTitle", label: t("title") },
    { name: "seoDescription", label: t("description"), kind: "textarea" },
  ];
  const watched = form.watch();
  const english = Object.fromEntries(
    translatableFields.map((f) => [f.name, (watched as Record<string, unknown>)[f.name] as string | null | undefined])
  );

  async function onSubmit(values: SiteSettingsFormValues) {
    try {
      const result = await saveSiteSettings(values);
      if (result.ok) {
        toast.success(t("toastSaved"));
        form.reset(values);
      } else {
        toast.error(result.error ?? t("toastFailed"));
      }
    } catch (err) {
      console.error("saveSiteSettings threw:", err);
      toast.error(t("toastUnexpected"));
    }
  }

  function onInvalid(errors: object) {
    console.error("Form validation failed:", errors);
    const fields = Object.keys(errors).join(", ");
    toast.error(t("toastValidation", { fields }));
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onInvalid)}>
        {/* Sticky save bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between bg-bg-soft/90 backdrop-blur-sm border-b border-line py-2.5 mb-4 -mx-6 px-6">
          <p className="text-[13px] text-muted">
            {isDirty ? t("unsaved") : t("allSaved")}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!isDirty || isSubmitting}
              onClick={() => form.reset()}
            >
              {t("reset")}
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? t("saving") : t("saveChanges")}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="brand" className="flex flex-col gap-0">
          <TabsList
            variant="line"
            className="w-full flex flex-nowrap overflow-x-auto h-auto gap-1.5 bg-transparent rounded-none p-0 pb-1 mb-4 justify-start"
          >
            {["brand", "nav", "hero", "urgency", "trust", "mid-cta", "final-cta", "footer", "seo", "payments", "translations"].map(
              (tab, i, arr) => (
                <Fragment key={tab}>
                  <TabsTrigger
                    value={tab}
                    className="shrink-0 flex-none h-8 text-[13px] font-semibold capitalize px-3.5 py-0 rounded-full border border-primary-soft bg-primary-softer text-ink hover:border-primary-mid hover:text-ink after:hidden data-active:!bg-primary data-active:!text-white data-active:!border-primary transition-colors"
                  >
                    {tab === "translations" ? tTr("tab") : t(`tabs.${tab}`)}
                  </TabsTrigger>
                </Fragment>
              )
            )}
          </TabsList>

          {/* ── BRAND ── */}
          <TabsContent value="brand">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
              {/* Left column — Identity & Currency */}
              <div className="flex flex-col gap-0">
                <FormSection title={t("identity")} description={t("siteNameAndLogoAssets")}>
                  <FormField control={form.control} name="siteName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("siteName")}</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="tagline" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("tagline")}</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="logoUrl" render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <ImageUploadField
                          endpoint="partnerLogo"
                          value={field.value || ""}
                          onChange={field.onChange}
                          label={t("logoLightShownInThe")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="logoDarkUrl" render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <ImageUploadField
                          endpoint="partnerLogo"
                          value={field.value || ""}
                          onChange={field.onChange}
                          label={t("logoDarkForDarkBackgrounds")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="faviconUrl" render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <ImageUploadField
                          endpoint="partnerLogo"
                          value={field.value || ""}
                          onChange={field.onChange}
                          label={t("faviconBrowserTabIcon")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </FormSection>

                <FormSection title={t("defaultCurrency")} description={t("currencyShownToVisitorsWho")}>
                  <FormField control={form.control} name="defaultCurrency" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("defaultCurrency")}</FormLabel>
                      <FormControl>
                        <select {...field} className="h-9 rounded-lg border border-line bg-white px-2.5 text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/20">
                          <option value="MAD">MAD — {t("currencyMad")}</option>
                          <option value="USD">USD — {t("currencyUsd")}</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </FormSection>
              </div>

              {/* Right column — Brand colors */}
              <div className="flex flex-col gap-0">
                <FormSection title={t("brandColors")} description={t("usedThroughoutThePublicSite")}>
                  <div className="grid grid-cols-1 gap-4">
                    <ColorPickerField name="colorPrimary" label={t("primary")} />
                    <ColorPickerField name="colorPrimaryBright" label={t("accent")} />
                    <ColorPickerField name="colorBg" label={t("background")} />
                    <ColorPickerField name="colorInk" label={t("text")} />
                    <ColorPickerField name="colorBorder" label={t("borders")} />
                    <ColorPickerField name="colorPrimaryHover" label={t("primaryHoverState")} />
                  </div>
                </FormSection>
              </div>
            </div>
          </TabsContent>

          {/* ── NAV ── */}
          <TabsContent value="nav">
            <div className="flex flex-wrap items-stretch gap-4">
              <FormSection
                title={t("navigationLinks")}
                description={t("textLinksShownInThe")}
                className="flex-1 min-w-[400px] max-w-[750px]"
              >
                <RepeatableList
                  name="navLinks"
                  label={t("links")}
                  fields={[
                    { key: "label", label: t("label"), placeholder: t("forBusiness") },
                    { key: "url", label: t("url"), placeholder: "/business" },
                  ]}
                  addLabel={t("addLink")}
                  defaultItem={{ label: "", url: "" }}
                />
              </FormSection>

              <FormSection
                title={t("socialLinks")}
                description={t("shownAsIconsInBoth")}
              >
                <RepeatableList
                  name="footerSocial"
                  label={t("socialPlatforms")}
                  fields={[
                    { key: "platform", label: t("platform"), placeholder: "instagram" },
                    { key: "url", label: t("url"), placeholder: "https://instagram.com/…" },
                  ]}
                  addLabel={t("addSocialLink")}
                  defaultItem={{ platform: "", url: "" }}
                />
              </FormSection>
            </div>
          </TabsContent>

          {/* ── HERO ── */}
          <TabsContent value="hero">
            <div className="flex flex-wrap items-stretch gap-4">
              <FormSection title={t("headline")} description={t("theMainAboveTheFold")} className="flex-1 min-w-[400px] max-w-[900px]">
                <FormField control={form.control} name="heroKicker" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("kickerSmallLineAboveHeadline")}</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="heroTitleLine1" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("titleLine1")}</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="heroTitleLine2" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("titleLine2")}</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="heroTitleLine3" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("titleLine3")}</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="heroSubtitle" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("subtitle")}</FormLabel>
                    <FormControl><Textarea {...field} rows={2} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </FormSection>

              <FormSection title={t("searchTrust")} description={t("searchBarCopyAndTrust")}>
                <FormField control={form.control} name="heroSearchPlaceholder" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("searchPlaceholder")}</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <TagInput name="heroPopularTerms" label={t("popularSearchTerms")} description={t("pressEnterOrCommaTo")} />
                <TagInput name="heroTrustBullets" label={t("trustBullets")} description={t("shortTrustSignalsShownBelow")} />
              </FormSection>
            </div>
          </TabsContent>

          {/* ── URGENCY ── */}
          <TabsContent value="urgency">
            <FormSection title={t("urgencyBanner")} description={t("theThinStripShownAbove")} className="w-full max-w-[700px]">
              <FormField control={form.control} name="urgencyEnabled" render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-3">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel>{t("bannerEnabled")}</FormLabel>
                  </div>
                </FormItem>
              )} />
              <FormField control={form.control} name="urgencyTag" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("tagLabel")}</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="urgencyMessage" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("message")}</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="urgencyEndsAt" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("countdownEndsAt")}</FormLabel>
                  <FormControl>
                    <Input {...field} type="datetime-local" value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="urgencyCtaLabel" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("ctaLabel")}</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="urgencyCtaUrl" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("ctaUrl")}</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </FormSection>
          </TabsContent>

          {/* ── TRUST STRIP ── */}
          <TabsContent value="trust">
            <FormSection title={t("trustStrip")} description={t("partnerCompanyLogosDisplayedBelow")} className="w-full max-w-[800px]">
              <FormField control={form.control} name="trustStripLabel" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("label")}</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <RepeatableList
                name="trustStripLogos"
                label={t("logos")}
                fields={[
                  { key: "name", label: t("name"), placeholder: t("companyName") },
                  { key: "logoUrl", label: t("logoUrl"), placeholder: "https://…" },
                ]}
                addLabel={t("addLogo")}
                defaultItem={{ name: "", logoUrl: "" }}
              />
            </FormSection>
          </TabsContent>

          {/* ── MID CTA ── */}
          <TabsContent value="mid-cta">
            <FormSection title={t("midPageCtaBanner")} description={t("theDarkBlueBannerBetween")} className="w-full max-w-[1200px]">
              <FormField control={form.control} name="midCtaTitle" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("title")}</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="midCtaDescription" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("description")}</FormLabel>
                  <FormControl><Textarea {...field} rows={1} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid md:grid-cols-4 gap-3">
                <FormField control={form.control} name="midCtaPrimaryLabel" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("primaryCtaLabel")}</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="midCtaPrimaryUrl" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("primaryCtaUrl")}</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="midCtaSecondaryLabel" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("secondaryCtaLabel")}</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="midCtaSecondaryUrl" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("secondaryCtaUrl")}</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <RepeatableList
                name="midCtaStats"
                label={t("stats")}
                fields={[
                  { key: "number", label: t("number"), placeholder: "2.4M" },
                  { key: "label", label: t("label"), placeholder: t("activeLearners") },
                ]}
                addLabel={t("addStat")}
                defaultItem={{ number: "", label: "" }}
              />

              <FormField
                control={form.control}
                name="midCtaCourseIds"
                render={({ field }) => {
                  const ids: string[] = field.value ?? [];
                  const setSlot = (slot: 0 | 1, value: string) => {
                    const next = [...ids];
                    next[slot] = value;
                    // Strip empty entries from the end so DB stays clean
                    field.onChange(next.filter((v, i) => v || i < (slot === 0 ? 1 : 2)));
                  };
                  return (
                    <FormItem>
                      <FormLabel>{t("featuredCoursesOnTheBanner")}</FormLabel>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {([0, 1] as const).map((slot) => (
                          <select
                            key={slot}
                            value={ids[slot] ?? ""}
                            onChange={(e) => setSlot(slot, e.target.value)}
                            className="h-9 rounded-md border border-line bg-white px-2.5 text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/20"
                          >
                            <option value="">{t("courseSlot", { n: slot + 1 })}</option>
                            {publishedCourses.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.title}
                              </option>
                            ))}
                          </select>
                        ))}
                      </div>
                      <p className="text-[11px] text-muted mt-1">
                        {t("featuredCoursesHint")}
                      </p>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </FormSection>
          </TabsContent>

          {/* ── FINAL CTA ── */}
          <TabsContent value="final-cta">
            <FormSection title={t("finalCtaSection")} description={t("bottomOfPageCallTo")}>
              <FormField control={form.control} name="finalCtaTitle" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("title")}</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="finalCtaDescription" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("description")}</FormLabel>
                  <FormControl><Textarea {...field} rows={2} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="finalCtaCtaLabel" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("ctaButtonLabel")}</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="finalCtaCtaUrl" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("ctaButtonUrl")}</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </FormSection>
          </TabsContent>

          {/* ── FOOTER ── */}
          <TabsContent value="footer">
            <FormSection title={t("footerColumns")} description={t("eachColumnHasAHeading")} className="w-full max-w-[1200px]">
              <FooterColumnsEditor />
            </FormSection>
            <FormSection title={t("copyright")}>
              <FormField control={form.control} name="footerCopyright" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("copyrightText")}</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </FormSection>

            <FormSection title={t("contactDetails")} description={t("shownOnThePublicContact")}>
              <FormField control={form.control} name="supportEmail" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("supportEmail")}</FormLabel>
                  <FormControl><Input type="email" placeholder="hello@ailearn.com" {...field} value={field.value ?? ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="supportPhone" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("phoneNumber")}</FormLabel>
                  <FormControl><Input placeholder="+212 6 12 34 56 78" {...field} value={field.value ?? ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="supportWhatsapp" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("whatsappNumber")}</FormLabel>
                  <FormControl><Input placeholder="+212612345678 (E.164, no spaces)" {...field} value={field.value ?? ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="supportAddress" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("address")}</FormLabel>
                  <FormControl><Textarea rows={2} placeholder={t("streetCityCountry")} {...field} value={field.value ?? ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </FormSection>
          </TabsContent>

          {/* ── SEO ── */}
          <TabsContent value="seo">
            <FormSection title={t("globalSeoDefaults")} description={t("usedOnPagesThatDon")} className="w-full max-w-[1300px]">
              <FormField control={form.control} name="seoTitle" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("title")}</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="seoDescription" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("description")}</FormLabel>
                  <FormControl><Textarea {...field} rows={3} value={field.value ?? ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="seoOgImageUrl" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("ogImageUrl")}</FormLabel>
                  <FormControl><Input {...field} placeholder="https://…" value={field.value ?? ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </FormSection>
          </TabsContent>
          {/* ── PAYMENTS ── */}
          <TabsContent value="payments">
            <FormSection
              title={t("bankTransferMad")}
              description={t("theseDetailsAppearOnThe")}
              className="w-full max-w-[1300px]"
            >
              <FormField control={form.control} name="bankName" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("bankName")}</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} placeholder="Attijariwafa Bank" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="bankAccountName" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("accountHolderName")}</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} placeholder="e.g., Youssef Afailal" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="bankIBAN" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("iban")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="MA64 0000 0000 0000 0000 0000 00"
                      className="font-mono"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="bankRIB" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("rib")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder={t("24Digits")}
                      className="font-mono"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="bankSwift" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("swiftCodeOptional")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder={t("bcmamamcForInternationalWires")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="bankInstructions" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("paymentInstructions")}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      rows={4}
                      placeholder={t("eGPleaseIncludeYour")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </FormSection>

            <FormSection
              title={t("cardPaymentUsdStripe")}
              description={t("setYourStripeApiKeys")}
              className="w-full max-w-[1300px]"
            >
              {form.watch("stripeEnabled") &&
                (!form.watch("stripeSecretKey") ||
                  !form.watch("stripePublishableKey") ||
                  !form.watch("stripeWebhookSecret")) && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-primary-soft border border-primary/20 text-[12px] text-primary font-medium">
                  <span className="shrink-0 font-bold">⚠</span>
                  {t("stripeWarning")}
                </div>
              )}

              <FormField control={form.control} name="stripeEnabled" render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-3">
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <div>
                      <FormLabel>{t("enableStripeUsdPayments")}</FormLabel>
                      <p className="text-[11px] text-muted font-medium mt-0.5">{t("onlyEnableAfterConfiguringAll")}</p>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="stripeSecretKey" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("secretKey")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      type="password"
                      placeholder="sk_live_… or sk_test_…"
                      className="font-mono text-[12px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="stripePublishableKey" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("publishableKey")}</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} placeholder="pk_live_… or pk_test_…" className="font-mono text-[12px]" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="stripeWebhookSecret" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("webhookSigningSecret")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      type="password"
                      placeholder="whsec_…"
                      className="font-mono text-[12px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </FormSection>

            <FormSection
              title={t("cardPaymentMadCmi")}
              description={t("moroccoSInterbankCardAcquirer")}
              className="w-full max-w-[1300px]"
            >
              {form.watch("cmiEnabled") &&
                (!form.watch("cmiMerchantId") || !form.watch("cmiStoreKey")) && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-primary-soft border border-primary/20 text-[12px] text-primary font-medium">
                  <span className="shrink-0 font-bold">⚠</span>
                  {t("cmiWarning")}
                </div>
              )}

              <FormField control={form.control} name="cmiEnabled" render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-3">
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <div>
                      <FormLabel>{t("enableCmiCardPayments")}</FormLabel>
                      <p className="text-[11px] text-muted font-medium mt-0.5">{t("cmiEnableHint")}</p>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="cmiTestMode" render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-3">
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <div>
                      <FormLabel>{t("testMode")}</FormLabel>
                      <p className="text-[11px] text-muted font-medium mt-0.5">{t("routesPaymentsToTestpaymentCmi")}</p>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="cmiMerchantId" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("merchantIdClientid")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="600000000…"
                      className="font-mono text-[12px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="cmiStoreKey" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("storeKey")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      type="password"
                      placeholder={t("providedByCmiWhenYour")}
                      className="font-mono text-[12px]"
                    />
                  </FormControl>
                  <p className="text-[11px] text-muted font-medium mt-1">
                    {t("cmiStoreKeyHint")}
                  </p>
                  <FormMessage />
                </FormItem>
              )} />
            </FormSection>
          </TabsContent>

          {/* ── TRANSLATIONS ── */}
          <TabsContent value="translations">
            <FormSection title={tTr("sectionTitle")} className="w-full max-w-[900px]">
              <TranslationsEditor
                fields={translatableFields}
                value={watched.translations as TranslationsValue | null | undefined}
                onChange={(next) => form.setValue("translations", next, { shouldDirty: true })}
                english={english}
              />
            </FormSection>
          </TabsContent>
        </Tabs>
      </form>
    </Form>
  );
}

// ─── Footer columns sub-editor ───────────────────────────────────────────────
// Nested: columns → links. useFieldArray twice.

function FooterColumnsEditor() {
  const t = useTranslations("AdminSite");
  const form = useFormContext<SiteSettingsFormValues>();
  const { fields: columns, append: appendCol, remove: removeCol } = useFieldArray({
    control: form.control,
    name: "footerColumns",
  });

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
        {columns.map((col, colIdx) => (
          <div key={col.id} className="border border-line rounded-lg p-3">
            <div className="flex items-center justify-between mb-2 gap-2">
              <Input
                {...form.register(`footerColumns.${colIdx}.heading`)}
                placeholder={t("columnHeading")}
                className="text-[13px] font-semibold flex-1 min-w-0"
              />
              <button
                type="button"
                onClick={() => removeCol(colIdx)}
                aria-label={t("removeColumn")}
                className="text-muted hover:text-red-500 transition-colors shrink-0 text-[11px]"
              >
                ✕
              </button>
            </div>
            <FooterLinksEditor colIdx={colIdx} />
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => appendCol({ heading: "", links: [] })}
        className="text-[12px]"
      >
        {t("addColumn")}
      </Button>
    </div>
  );
}

function FooterLinksEditor({ colIdx }: { colIdx: number }) {
  const t = useTranslations("AdminSite");
  const form = useFormContext<SiteSettingsFormValues>();
  const { fields: links, append, remove } = useFieldArray({
    control: form.control,
    name: `footerColumns.${colIdx}.links`,
  });

  return (
    <div className="space-y-1.5">
      {links.map((link, linkIdx) => (
        <div key={link.id} className="flex gap-2 items-center">
          <Input
            {...form.register(`footerColumns.${colIdx}.links.${linkIdx}.label`)}
            placeholder={t("label")}
            className="flex-1 text-[12.5px]"
          />
          <Input
            {...form.register(`footerColumns.${colIdx}.links.${linkIdx}.url`)}
            placeholder="/path or https://…"
            className="flex-1 text-[12.5px]"
          />
          <button
            type="button"
            onClick={() => remove(linkIdx)}
            className="text-muted hover:text-red-500 transition-colors shrink-0"
          >
            <span className="text-[11px]">✕</span>
          </button>
        </div>
      ))}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => append({ label: "", url: "" })}
        className="text-[11.5px] text-muted hover:text-ink h-7 px-2"
      >
        {t("addLinkPlus")}
      </Button>
    </div>
  );
}
