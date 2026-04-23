"use client";

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
import { TagInput } from "@/components/admin/TagInput";
import { RepeatableList } from "@/components/admin/RepeatableList";
import { SiteSettingsSchema, type SiteSettingsFormValues } from "./schema";
import { saveSiteSettings } from "./actions";
import type { SiteSettings } from "@prisma/client";

interface Props {
  settings: SiteSettings;
}

export function SiteSettingsForm({ settings }: Props) {
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
        <div className="sticky top-0 z-10 flex items-center justify-between bg-bg-soft/90 backdrop-blur-sm border-b border-line py-3 mb-6 -mx-6 px-6">
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
            className="w-full flex flex-wrap h-auto gap-x-1 gap-y-1 bg-transparent border-b border-line rounded-none pb-1 mb-6 justify-start"
          >
            {["brand", "nav", "hero", "urgency", "trust", "mid-cta", "final-cta", "footer", "seo"].map(
              (tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="text-[12px] font-semibold capitalize px-3 py-1.5 rounded-md data-[active]:bg-primary data-[active]:text-white text-muted hover:text-ink hover:bg-bg-hover transition-colors"
                >
                  {tab.replace("-", " ")}
                </TabsTrigger>
              )
            )}
          </TabsList>

          {/* ── BRAND ── */}
          <TabsContent value="brand">
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
                  <FormLabel>Logo URL (light)</FormLabel>
                  <FormControl><Input {...field} placeholder="https://…" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="logoDarkUrl" render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo URL (dark)</FormLabel>
                  <FormControl><Input {...field} placeholder="https://…" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="faviconUrl" render={({ field }) => (
                <FormItem>
                  <FormLabel>Favicon URL</FormLabel>
                  <FormControl><Input {...field} placeholder="https://…" /></FormControl>
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

            <FormSection title="Brand colors" description="Used throughout the public site. Must be valid 6-digit hex values.">
              <div className="grid sm:grid-cols-2 gap-4">
                <ColorPickerField name="colorPrimary" label="Primary" />
                <ColorPickerField name="colorPrimaryHover" label="Primary hover" />
                <ColorPickerField name="colorPrimaryBright" label="Primary bright (accent)" />
                <ColorPickerField name="colorInk" label="Ink (text)" />
              </div>
            </FormSection>
          </TabsContent>

          {/* ── NAV ── */}
          <TabsContent value="nav">
            <FormSection title="Navigation links" description="Links shown in the top-right of the nav bar.">
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
          </TabsContent>

          {/* ── HERO ── */}
          <TabsContent value="hero">
            <FormSection title="Hero section" description="The main above-the-fold area.">
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
          </TabsContent>

          {/* ── URGENCY ── */}
          <TabsContent value="urgency">
            <FormSection title="Urgency banner" description="The thin strip shown above the nav.">
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
            <FormSection title="Trust strip" description="Partner/company logos displayed below the hero.">
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
            <FormSection title="Mid-page CTA banner" description="The dark blue banner between courses and consultants.">
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
                  <FormControl><Textarea {...field} rows={2} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid sm:grid-cols-2 gap-4">
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
            <FormSection title="Footer columns" description="Each column has a heading and a list of links.">
              <FooterColumnsEditor />
            </FormSection>
            <FormSection title="Social links">
              <RepeatableList
                name="footerSocial"
                label="Social platforms"
                fields={[
                  { key: "platform", label: "Platform", placeholder: "Twitter" },
                  { key: "url", label: "URL", placeholder: "https://twitter.com/…" },
                ]}
                addLabel="Add social link"
                defaultItem={{ platform: "", url: "" }}
              />
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
            <FormSection title="Global SEO defaults" description="Used on pages that don't set their own meta.">
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
    <div className="space-y-4">
      {columns.map((col, colIdx) => (
        <div key={col.id} className="border border-line rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <Input
              {...form.register(`footerColumns.${colIdx}.heading`)}
              placeholder="Column heading"
              className="text-[13px] font-semibold w-48"
            />
            <button
              type="button"
              onClick={() => removeCol(colIdx)}
              className="text-muted hover:text-red-500 transition-colors text-[12px]"
            >
              Remove column
            </button>
          </div>
          <FooterLinksEditor colIdx={colIdx} />
        </div>
      ))}
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
