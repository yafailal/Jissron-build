"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { TranslationsEditor, type TranslationsValue } from "@/components/admin/TranslationsEditor";
import { FormSection } from "@/components/admin/FormSection";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { LiveSessionSchema, type LiveSessionFormValues } from "./schema";
import { createLiveSession, updateLiveSession, deleteLiveSession } from "./actions";
import { DualCurrencyInput } from "@/components/admin/DualCurrencyInput";
import { isPast } from "date-fns";
import { cn } from "@/lib/utils";
import type { LiveSession, User } from "@prisma/client";

interface Props {
  session?: LiveSession;
  hosts: Pick<User, "id" | "name" | "email">[];
}

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
}

function toLocalDatetimeString(date: Date) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export function LiveSessionForm({ session, hosts }: Props) {
  const t = useTranslations("AdminLive");
  const tt = useTranslations("AdminTrLive");
  const router = useRouter();
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const isEdit = !!session;
  const isPastSession = session ? isPast(new Date(session.startsAt)) : false;

  const form = useForm<LiveSessionFormValues>({
    resolver: zodResolver(LiveSessionSchema),
    defaultValues: session
      ? {
          title: session.title,
          slug: session.slug,
          description: session.description,
          kind: session.kind,
          status: session.status,
          hostId: session.hostId,
          startsAt: toLocalDatetimeString(new Date(session.startsAt)),
          durationMins: session.durationMins,
          seatsTotal: session.seatsTotal,
          isFree: session.isFree,
          priceMadCents: (session as LiveSession & { priceMadCents: number }).priceMadCents ?? 0,
          priceUsdCents: (session as LiveSession & { priceUsdCents: number }).priceUsdCents ?? 0,
          meetingUrl: session.meetingUrl ?? "",
          isFeatured: session.isFeatured,
          recordingUrl: (session as LiveSession & { recordingUrl?: string | null }).recordingUrl ?? "",
          translations: (session.translations as TranslationsValue | null) ?? null,
        }
      : {
          title: "",
          slug: "",
          description: "",
          kind: "WORKSHOP",
          status: "SCHEDULED",
          hostId: hosts[0]?.id ?? "",
          startsAt: "",
          durationMins: 60,
          seatsTotal: 50,
          isFree: false,
          priceMadCents: 0,
          priceUsdCents: 0,
          meetingUrl: "",
          isFeatured: false,
          recordingUrl: "",
        },
  });

  const { isSubmitting } = form.formState;
  const watch = form.watch;
  const isFree = watch("isFree");
  const titleValue = watch("title");
  const descriptionValue = watch("description");
  const translationsValue = watch("translations");

  useEffect(() => {
    if (!isEdit) form.setValue("slug", slugify(titleValue));
  }, [titleValue, isEdit, form]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        form.handleSubmit(onSubmit)();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(values: LiveSessionFormValues) {
    try {
      if (isEdit) {
        const result = await updateLiveSession(session.id, values);
        if (result.ok) toast.success(t("form.saved"));
        else toast.error(result.error ?? t("form.saveFailed"));
      } else {
        const result = await createLiveSession(values);
        if (result.ok && result.data) {
          toast.success(t("form.created"));
          router.push(`/admin/live/${result.data.id}`);
        } else {
          toast.error((result as { ok: false; error: string }).error ?? t("form.createFailed"));
        }
      }
    } catch {
      toast.error(t("form.unexpected"));
    }
  }

  function onInvalid(errors: object) {
    toast.error(t("form.fixFields", { fields: Object.keys(errors).join(", ") }));
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onInvalid)}>
        {/* Sticky save bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between bg-bg-soft/90 backdrop-blur-sm border-b border-line py-3 mb-6 -mx-6 px-6">
          <p className="text-[12px] text-muted">
            {isPastSession ? t("form.pastNotice") : isEdit ? t("form.editing") : t("newSessionLabel")}
          </p>
          <div className="flex gap-2">
            {isEdit && (
              <Button type="button" variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => setDeleteConfirm(true)}>
                {t("delete")}
              </Button>
            )}
            <Button type="button" variant="outline" size="sm" onClick={() => router.push("/admin/live")}>
              {t("form.cancel")}
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? t("form.saving") : isEdit ? t("form.saveChanges") : t("form.createSession")}
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Core info — read-only for past sessions */}
          <FormSection title={t("form.details")} description={t("form.detailsDesc")}>
            <fieldset disabled={isPastSession} className={cn(isPastSession && "opacity-60 pointer-events-none")}>
              <div className="space-y-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.title")}</FormLabel>
                    <FormControl><Input {...field} placeholder={t("form.titlePlaceholder")} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="slug" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.slug")}</FormLabel>
                    <FormControl><Input {...field} className="font-mono text-[13px]" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="kind" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("colKind")}</FormLabel>
                      <FormControl>
                        <select {...field} className="w-full h-9 rounded-lg border border-line bg-white px-2.5 text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/20">
                          <option value="AMA">{t("form.kindAMA")}</option>
                          <option value="WORKSHOP">{t("form.kindWORKSHOP")}</option>
                          <option value="SEMINAR">{t("form.kindSEMINAR")}</option>
                          <option value="COHORT">{t("form.kindCOHORT")}</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("colStatus")}</FormLabel>
                      <FormControl>
                        <select {...field} className="w-full h-9 rounded-lg border border-line bg-white px-2.5 text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/20">
                          <option value="SCHEDULED">{t("status.SCHEDULED")}</option>
                          <option value="LIVE">{t("status.LIVE")}</option>
                          <option value="ENDED">{t("status.ENDED")}</option>
                          <option value="CANCELLED">{t("status.CANCELLED")}</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="hostId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("colHost")}</FormLabel>
                    <FormControl>
                      <select {...field} className="w-full h-9 rounded-lg border border-line bg-white px-2.5 text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/20">
                        <option value="">{t("form.selectHost")}</option>
                        {hosts.map((h) => (
                          <option key={h.id} value={h.id}>{h.name ?? h.email}</option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid sm:grid-cols-3 gap-4">
                  <FormField control={form.control} name="startsAt" render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>{t("form.startsAt")}</FormLabel>
                      <FormControl><Input {...field} type="datetime-local" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="durationMins" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("form.duration")}</FormLabel>
                      <FormControl><Input {...field} type="number" min={1} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="seatsTotal" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.totalSeats")}</FormLabel>
                    <FormControl><Input {...field} type="number" min={1} className="w-32" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </fieldset>
          </FormSection>

          <FormSection title={t("form.description")}>
            <fieldset disabled={isPastSession} className={cn(isPastSession && "opacity-60 pointer-events-none")}>
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <RichTextEditor value={field.value} onChange={field.onChange} placeholder={t("form.descPlaceholder")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </fieldset>
          </FormSection>

          <FormSection title={tt("section")} description={tt("sectionDesc")}>
            <TranslationsEditor
              fields={[
                { name: "title", label: tt("title") },
                { name: "description", label: tt("description"), kind: "textarea", rows: 5 },
              ]}
              value={translationsValue}
              onChange={(next) => form.setValue("translations", next, { shouldDirty: true })}
              english={{ title: titleValue, description: descriptionValue }}
            />
          </FormSection>

          <FormSection title={t("form.pricingAccess")}>
            <fieldset disabled={isPastSession} className={cn(isPastSession && "opacity-60 pointer-events-none space-y-4")}>
              <div className="space-y-4">
                <FormField control={form.control} name="isFree" render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-3">
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      <FormLabel>{t("form.freeSession")}</FormLabel>
                    </div>
                  </FormItem>
                )} />
                {!isFree && (
                  <DualCurrencyInput
                    label={t("colPrice")}
                    madField="priceMadCents"
                    usdField="priceUsdCents"
                  />
                )}
                <FormField control={form.control} name="isFeatured" render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-3">
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      <FormLabel>{t("form.featured")}</FormLabel>
                    </div>
                  </FormItem>
                )} />
              </div>
            </fieldset>
          </FormSection>

          <FormSection title={t("form.meetingRecording")} description={t("form.meetingRecordingDesc")}>
            <fieldset disabled={isPastSession && false} className="space-y-4">
              {!isPastSession && (
                <FormField control={form.control} name="meetingUrl" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.meetingUrl")}</FormLabel>
                    <FormControl><Input {...field} value={field.value ?? ""} placeholder="https://zoom.us/j/…" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              )}
              <FormField control={form.control} name="recordingUrl" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.recordingUrl")}</FormLabel>
                  <FormControl><Input {...field} value={field.value ?? ""} placeholder="https://youtube.com/watch?v=…" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </fieldset>
          </FormSection>
        </div>
      </form>

      <ConfirmDialog
        open={deleteConfirm}
        onOpenChange={setDeleteConfirm}
        title={t("form.deleteTitle")}
        description={t("form.deleteDescription")}
        confirmLabel={t("delete")}
        destructive
        onConfirm={async () => {
          if (!session) return;
          const result = await deleteLiveSession(session.id);
          if (result.ok) {
            toast.success(t("deleted"));
            router.push("/admin/live");
          } else {
            toast.error(result.error);
          }
        }}
      />
    </Form>
  );
}
