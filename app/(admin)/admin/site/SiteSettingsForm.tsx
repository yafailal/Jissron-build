"use client";

import { Fragment } from "react";
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
import { SiteSettingsSchema, type SiteSettingsFormValues } from "./schema";
import { saveSiteSettings } from "./actions";
import type { SiteSettings } from "@prisma/client";

interface Props {
  settings: SiteSettings;
  publishedCourses?: { id: string; title: string }[];
}

export function SiteSettingsForm({ settings, publishedCourses = [] }: Props) {
  const form = useForm<SiteSettingsFormValues>({
    resolver: zodResolver(SiteSettingsSchema),
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
    },
  });

  const { isDirty, isSubmitting } = form.formState;

  async function onSubmit(values: SiteSettingsFormValues) {
    try {
      const result = await saveSiteSettings(values);
      if (result.ok) {
        toast.success("Site settings saved");
        form.reset(values);
      } else {
        toast.error(result.error ?? "Failed to save");
      }
    } catch (err) {
      console.error("saveSiteSettings threw:", err);
      toast.error("Unexpected error — check the console");
    }
  }

  function onInvalid(errors: object) {
    console.error("Form validation failed:", errors);
    const fields = Object.keys(errors).join(", ");
    toast.error(`Validation error in: ${fields}`);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onInvalid)}>
        {/* Sticky save bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between bg-bg-soft/90 backdrop-blur-sm border-b border-line py-2.5 mb-4 -mx-6 px-6">
          <p className="text-[13px] text-muted">
            {isDirty ? "You have unsaved changes." : "All changes saved."}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!isDirty || isSubmitting}
              onClick={() => form.reset()}
            >
              Reset
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="brand" className="flex flex-col gap-0">
          <TabsList
            variant="line"
            className="w-full flex flex-nowrap overflow-x-auto h-auto gap-1 bg-[#142A5A] rounded-lg p-1.5 mb-4 justify-start"
          >
            {["brand", "nav", "hero", "urgency", "trust", "mid-cta", "final-cta", "footer", "seo", "payments"].map(
              (tab, i, arr) => (
                <Fragment key={tab}>
                  <TabsTrigger
                    value={tab}
                    className="shrink-0 text-[12.5px] font-semibold capitalize px-3.5 py-2 rounded-md text-white hover:bg-white/10 data-[active]:bg-primary-bright data-[active]:text-white data-[active]:shadow-sm transition-colors"
                  >
                    {tab.replace("-", " ")}
                  </TabsTrigger>
                  {i < arr.length - 1 && (
                    <span aria-hidden className="shrink-0 self-center w-px h-5 bg-white/20" />
                  )}
                </Fragment>
              )
            )}
          </TabsList>

          {/* ── BRAND ── */}
          <TabsContent value="brand">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
              {/* Left column — Identity & Currency */}
              <div className="flex flex-col gap-0">
                <FormSection title="Identity" description="Site name and logo assets.">
                  <FormField control={form.control} name="siteName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Site name</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="tagline" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tagline</FormLabel>
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
                          label="Logo (light) — shown in the nav bar"
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
                          label="Logo (dark) — for dark backgrounds (footer, etc.)"
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
                          label="Favicon — browser tab icon"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </FormSection>

                <FormSection title="Default currency" description="Currency shown to visitors who haven't toggled their preference.">
                  <FormField control={form.control} name="defaultCurrency" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default currency</FormLabel>
                      <FormControl>
                        <select {...field} className="h-9 rounded-lg border border-line bg-white px-2.5 text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/20">
                          <option value="MAD">MAD — Moroccan Dirham</option>
                          <option value="USD">USD — US Dollar</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </FormSection>
              </div>

              {/* Right column — Brand colors */}
              <div className="flex flex-col gap-0">
                <FormSection title="Brand colors" description="Used throughout the public site. Must be valid 6-digit hex values.">
                  <div className="grid grid-cols-1 gap-4">
                    <ColorPickerField name="colorPrimary" label="Primary" />
                    <ColorPickerField name="colorPrimaryBright" label="Accent" />
                    <ColorPickerField name="colorBg" label="Background" />
                    <ColorPickerField name="colorInk" label="Text" />
                    <ColorPickerField name="colorBorder" label="Borders" />
                    <ColorPickerField name="colorPrimaryHover" label="Primary (hover state)" />
                  </div>
                </FormSection>
              </div>
            </div>
          </TabsContent>

          {/* ── NAV ── */}
          <TabsContent value="nav">
            <div className="flex flex-wrap items-stretch gap-4">
              <FormSection
                title="Navigation links"
                description="Text links shown in the top-right of the nav bar (e.g. For Business, Teachers)."
                className="flex-1 min-w-[400px] max-w-[750px]"
              >
                <RepeatableList
                  name="navLinks"
                  label="Links"
                  fields={[
                    { key: "label", label: "Label", placeholder: "For Business" },
                    { key: "url", label: "URL", placeholder: "/business" },
                  ]}
                  addLabel="Add link"
                  defaultItem={{ label: "", url: "" }}
                />
              </FormSection>

              <FormSection
                title="Social links"
                description="Shown as icons in both the top nav bar and the footer. Supported platforms: instagram, twitter, x, linkedin, facebook, youtube, tiktok."
              >
                <RepeatableList
                  name="footerSocial"
                  label="Social platforms"
                  fields={[
                    { key: "platform", label: "Platform", placeholder: "instagram" },
                    { key: "url", label: "URL", placeholder: "https://instagram.com/…" },
                  ]}
                  addLabel="Add social link"
                  defaultItem={{ platform: "", url: "" }}
                />
              </FormSection>
            </div>
          </TabsContent>

          {/* ── HERO ── */}
          <TabsContent value="hero">
            <div className="flex flex-wrap items-stretch gap-4">
              <FormSection title="Headline" description="The main above-the-fold copy." className="flex-1 min-w-[400px] max-w-[900px]">
                <FormField control={form.control} name="heroKicker" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kicker (small line above headline)</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="heroTitleLine1" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title line 1</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="heroTitleLine2" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title line 2</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="heroTitleLine3" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title line 3</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="heroSubtitle" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subtitle</FormLabel>
                    <FormControl><Textarea {...field} rows={2} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </FormSection>

              <FormSection title="Search & trust" description="Search bar copy and trust signals shown beneath it.">
                <FormField control={form.control} name="heroSearchPlaceholder" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Search placeholder</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <TagInput name="heroPopularTerms" label="Popular search terms" description="Press Enter or comma to add a term." />
                <TagInput name="heroTrustBullets" label="Trust bullets" description="Short trust signals shown below the search bar." />
              </FormSection>
            </div>
          </TabsContent>

          {/* ── URGENCY ── */}
          <TabsContent value="urgency">
            <FormSection title="Urgency banner" description="The thin strip shown above the nav." className="w-full max-w-[700px]">
              <FormField control={form.control} name="urgencyEnabled" render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-3">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel>Banner enabled</FormLabel>
                  </div>
                </FormItem>
              )} />
              <FormField control={form.control} name="urgencyTag" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tag (e.g. &ldquo;FLASH SALE&rdquo;)</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="urgencyMessage" render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="urgencyEndsAt" render={({ field }) => (
                <FormItem>
                  <FormLabel>Countdown ends at</FormLabel>
                  <FormControl>
                    <Input {...field} type="datetime-local" value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="urgencyCtaLabel" render={({ field }) => (
                <FormItem>
                  <FormLabel>CTA label</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="urgencyCtaUrl" render={({ field }) => (
                <FormItem>
                  <FormLabel>CTA URL</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </FormSection>
          </TabsContent>

          {/* ── TRUST STRIP ── */}
          <TabsContent value="trust">
            <FormSection title="Trust strip" description="Partner/company logos displayed below the hero." className="w-full max-w-[800px]">
              <FormField control={form.control} name="trustStripLabel" render={({ field }) => (
                <FormItem>
                  <FormLabel>Label</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <RepeatableList
                name="trustStripLogos"
                label="Logos"
                fields={[
                  { key: "name", label: "Name", placeholder: "Company name" },
                  { key: "logoUrl", label: "Logo URL", placeholder: "https://…" },
                ]}
                addLabel="Add logo"
                defaultItem={{ name: "", logoUrl: "" }}
              />
            </FormSection>
          </TabsContent>

          {/* ── MID CTA ── */}
          <TabsContent value="mid-cta">
            <FormSection title="Mid-page CTA banner" description="The dark blue banner between courses and consultants." className="w-full max-w-[1200px]">
              <FormField control={form.control} name="midCtaTitle" render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="midCtaDescription" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Textarea {...field} rows={1} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid md:grid-cols-4 gap-3">
                <FormField control={form.control} name="midCtaPrimaryLabel" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary CTA label</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="midCtaPrimaryUrl" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary CTA URL</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="midCtaSecondaryLabel" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secondary CTA label</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="midCtaSecondaryUrl" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secondary CTA URL</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <RepeatableList
                name="midCtaStats"
                label="Stats"
                fields={[
                  { key: "number", label: "Number", placeholder: "2.4M" },
                  { key: "label", label: "Label", placeholder: "Active learners" },
                ]}
                addLabel="Add stat"
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
                      <FormLabel>Featured courses on the banner</FormLabel>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {([0, 1] as const).map((slot) => (
                          <select
                            key={slot}
                            value={ids[slot] ?? ""}
                            onChange={(e) => setSlot(slot, e.target.value)}
                            className="h-9 rounded-md border border-line bg-white px-2.5 text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/20"
                          >
                            <option value="">{`— Course ${slot + 1} (auto-pick if empty) —`}</option>
                            {publishedCourses.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.title}
                              </option>
                            ))}
                          </select>
                        ))}
                      </div>
                      <p className="text-[11px] text-muted mt-1">
                        Pick which 2 published courses appear in the banner. Leave a slot empty to fall back
                        to the top featured/bestseller course.
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
            <FormSection title="Final CTA section" description="Bottom-of-page call to action.">
              <FormField control={form.control} name="finalCtaTitle" render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="finalCtaDescription" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Textarea {...field} rows={2} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="finalCtaCtaLabel" render={({ field }) => (
                  <FormItem>
                    <FormLabel>CTA button label</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="finalCtaCtaUrl" render={({ field }) => (
                  <FormItem>
                    <FormLabel>CTA button URL</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </FormSection>
          </TabsContent>

          {/* ── FOOTER ── */}
          <TabsContent value="footer">
            <FormSection title="Footer columns" description="Each column has a heading and a list of links." className="w-full max-w-[1200px]">
              <FooterColumnsEditor />
            </FormSection>
            <FormSection title="Copyright">
              <FormField control={form.control} name="footerCopyright" render={({ field }) => (
                <FormItem>
                  <FormLabel>Copyright text</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </FormSection>
          </TabsContent>

          {/* ── SEO ── */}
          <TabsContent value="seo">
            <FormSection title="Global SEO defaults" description="Used on pages that don't set their own meta." className="w-full max-w-[1300px]">
              <FormField control={form.control} name="seoTitle" render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="seoDescription" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Textarea {...field} rows={3} value={field.value ?? ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="seoOgImageUrl" render={({ field }) => (
                <FormItem>
                  <FormLabel>OG image URL</FormLabel>
                  <FormControl><Input {...field} placeholder="https://…" value={field.value ?? ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </FormSection>
          </TabsContent>
          {/* ── PAYMENTS ── */}
          <TabsContent value="payments">
            <FormSection
              title="Bank transfer (MAD)"
              description="These details appear on the checkout page when a student pays by bank transfer. Keep them current — students will use them to transfer money to you."
              className="w-full max-w-[1300px]"
            >
              <FormField control={form.control} name="bankName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Bank name</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} placeholder="Attijariwafa Bank" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="bankAccountName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Account holder name</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} placeholder="e.g., Youssef Afailal" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="bankIBAN" render={({ field }) => (
                <FormItem>
                  <FormLabel>IBAN</FormLabel>
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
                  <FormLabel>RIB</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="24 digits"
                      className="font-mono"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="bankSwift" render={({ field }) => (
                <FormItem>
                  <FormLabel>SWIFT code (optional)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="BCMAMAMC (for international wires)"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="bankInstructions" render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment instructions</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      rows={4}
                      placeholder="e.g., Please include your order reference in the transfer description. Processing takes 1-2 business days after confirmation."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </FormSection>

            <FormSection
              title="Card payment (USD) — Stripe"
              description="Set your Stripe API keys here. Production deployments should set these via Vercel env vars instead — env vars take precedence."
              className="w-full max-w-[1300px]"
            >
              {form.watch("stripeEnabled") &&
                (!form.watch("stripeSecretKey") ||
                  !form.watch("stripePublishableKey") ||
                  !form.watch("stripeWebhookSecret")) && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-primary-soft border border-primary/20 text-[12px] text-primary font-500">
                  <span className="shrink-0 font-700">⚠</span>
                  USD payments are enabled but one or more fields below are empty. Stripe checkout will not appear until all three fields are set.
                </div>
              )}

              <FormField control={form.control} name="stripeEnabled" render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-3">
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <div>
                      <FormLabel>Enable Stripe USD payments</FormLabel>
                      <p className="text-[11px] text-muted font-500 mt-0.5">Only enable after configuring all fields below and verifying your Stripe account.</p>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="stripeSecretKey" render={({ field }) => (
                <FormItem>
                  <FormLabel>Secret key</FormLabel>
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
                  <FormLabel>Publishable key</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} placeholder="pk_live_… or pk_test_…" className="font-mono text-[12px]" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="stripeWebhookSecret" render={({ field }) => (
                <FormItem>
                  <FormLabel>Webhook signing secret</FormLabel>
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
              title="Card payment (MAD) — CMI"
              description="Morocco's interbank card acquirer. Hosted payment page — no PCI scope on our side. Test mode targets testpayment.cmi.co.ma."
              className="w-full max-w-[1300px]"
            >
              {form.watch("cmiEnabled") &&
                (!form.watch("cmiMerchantId") || !form.watch("cmiStoreKey")) && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-primary-soft border border-primary/20 text-[12px] text-primary font-500">
                  <span className="shrink-0 font-700">⚠</span>
                  CMI is enabled but Merchant ID or Store Key is empty. The card-payment button stays hidden until both are set.
                </div>
              )}

              <FormField control={form.control} name="cmiEnabled" render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-3">
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <div>
                      <FormLabel>Enable CMI card payments</FormLabel>
                      <p className="text-[11px] text-muted font-500 mt-0.5">Once enabled and the credentials below are filled, MAD checkouts will route to CMI&apos;s hosted page.</p>
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
                      <FormLabel>Test mode</FormLabel>
                      <p className="text-[11px] text-muted font-500 mt-0.5">Routes payments to testpayment.cmi.co.ma instead of the production endpoint. Use until your prod credentials are verified.</p>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="cmiMerchantId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Merchant ID (clientid)</FormLabel>
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
                  <FormLabel>Store key</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      type="password"
                      placeholder="Provided by CMI when your merchant account is opened"
                      className="font-mono text-[12px]"
                    />
                  </FormControl>
                  <p className="text-[11px] text-muted font-500 mt-1">
                    Used server-side to sign outgoing payment forms and verify incoming callbacks. Never sent to the browser.
                  </p>
                  <FormMessage />
                </FormItem>
              )} />
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
                placeholder="Column heading"
                className="text-[13px] font-semibold flex-1 min-w-0"
              />
              <button
                type="button"
                onClick={() => removeCol(colIdx)}
                aria-label="Remove column"
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
        + Add column
      </Button>
    </div>
  );
}

function FooterLinksEditor({ colIdx }: { colIdx: number }) {
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
            placeholder="Label"
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
        + Add link
      </Button>
    </div>
  );
}
