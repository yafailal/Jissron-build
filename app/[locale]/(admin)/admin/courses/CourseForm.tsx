"use client";

import { useForm, useFieldArray, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "@/i18n/navigation";
import { Fragment, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { FormSection } from "@/components/admin/FormSection";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { TranslationsEditor, type TranslatableField, type TranslationsValue } from "@/components/admin/TranslationsEditor";
import { CourseSchema, type CourseFormValues, type ModuleFormValues, type LessonFormValues, type FAQFormValues } from "./schema";
import { DualCurrencyInput } from "@/components/admin/DualCurrencyInput";
import { createCourse, updateCourse } from "./actions";
import { GripVertical, ChevronDown, ChevronRight, ChevronUp, Plus, Trash2, Upload, Loader2, CheckCircle2, HelpCircle } from "lucide-react";
import { useUploadThing } from "@/lib/uploadthing";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Category, User, Course, Module, Lesson, CourseFAQ, Quiz, QuizQuestion, Assignment } from "@prisma/client";

type LessonWithExtras = Lesson & {
  quiz: (Quiz & { questions: QuizQuestion[] }) | null;
  assignment: Assignment | null;
};

type CourseWithModules = Course & {
  modules: (Module & { lessons: LessonWithExtras[] })[];
  faqs: CourseFAQ[];
};

interface Props {
  course?: CourseWithModules;
  categories: Category[];
  instructors: Pick<User, "id" | "name" | "email">[];
}

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function CourseForm({ course, categories, instructors }: Props) {
  const t = useTranslations("AdminCourses");
  const tr = useTranslations("AdminTrCourse");
  const router = useRouter();
  const [publishConfirm, setPublishConfirm] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<"DRAFT" | "PUBLISHED" | "ARCHIVED" | null>(null);
  const isEdit = !!course;

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(CourseSchema),
    defaultValues: course
      ? {
          title: course.title,
          slug: course.slug,
          subtitle: course.subtitle ?? "",
          categoryId: course.categoryId,
          level: course.level,
          language: course.language,
          description: course.description,
          modules: course.modules.map((m) => ({
            id: m.id,
            title: m.title,
            order: m.order,
            translations: (m.translations as TranslationsValue | null) ?? null,
            lessons: m.lessons.map((l) => ({
              id: l.id,
              title: l.title,
              type: l.type,
              videoGuid: l.videoGuid ?? "",
              videoUrl: l.videoUrl ?? "",
              audioUrl: l.audioUrl ?? "",
              pdfUrl: l.pdfUrl ?? "",
              htmlContent: l.htmlContent ?? "",
              textContent: l.textContent ?? "",
              durationSeconds: l.durationSeconds,
              isPreview: l.isPreview,
              order: l.order,
              translations: (l.translations as TranslationsValue | null) ?? null,
              quiz: l.quiz
                ? {
                    id: l.quiz.id,
                    title: l.quiz.title,
                    description: l.quiz.description ?? "",
                    passThreshold: l.quiz.passThreshold,
                    maxRetries: l.quiz.maxRetries,
                    showCorrectAnswers: l.quiz.showCorrectAnswers,
                    shuffleQuestions: l.quiz.shuffleQuestions,
                    questions: l.quiz.questions.map((q) => ({
                      id: q.id,
                      type: q.type,
                      prompt: q.prompt,
                      points: q.points,
                      order: q.order,
                      options: Array.isArray(q.options)
                        ? (q.options as string[])
                        : [],
                      correctAnswer: q.correctAnswer ?? "",
                      explanation: q.explanation ?? "",
                    })),
                  }
                : null,
              assignment: l.assignment
                ? {
                    id: l.assignment.id,
                    title: l.assignment.title,
                    instructions: l.assignment.instructions,
                    maxFileSizeMb: l.assignment.maxFileSizeMb,
                    allowedFileTypes: l.assignment.allowedFileTypes,
                    dueOffsetDays: l.assignment.dueOffsetDays ?? null,
                    passingGrade: l.assignment.passingGrade,
                  }
                : null,
            })),
          })),
          stripePriceId: course.stripePriceId ?? "",
          priceMadCents: course.priceMadCents,
          priceUsdCents: course.priceUsdCents,
          oldPriceMadCents: course.oldPriceMadCents ?? null,
          oldPriceUsdCents: course.oldPriceUsdCents ?? null,
          thumbnailUrl: course.thumbnailUrl ?? "",
          previewVideoUrl: course.previewVideoUrl ?? "",
          isBestseller: course.isBestseller,
          isFeatured: course.isFeatured,
          badge: course.badge ?? "",
          seoTitle: course.seoTitle ?? "",
          seoDescription: course.seoDescription ?? "",
          status: course.status,
          instructorId: course.instructorId,
          faqs: course.faqs.map((f) => ({
            id: f.id,
            question: f.question,
            answer: f.answer,
            translations: (f.translations as TranslationsValue | null) ?? null,
          })),
          translations: (course.translations as TranslationsValue | null) ?? null,
        }
      : {
          title: "",
          slug: "",
          subtitle: "",
          categoryId: "",
          level: "BEGINNER",
          language: "en",
          description: "",
          modules: [],
          stripePriceId: "",
          priceMadCents: 0,
          priceUsdCents: 0,
          oldPriceMadCents: null,
          oldPriceUsdCents: null,
          thumbnailUrl: "",
          previewVideoUrl: "",
          isBestseller: false,
          isFeatured: false,
          badge: "",
          seoTitle: "",
          seoDescription: "",
          status: "DRAFT",
          instructorId: instructors[0]?.id ?? "",
          faqs: [],
          translations: null,
        },
  });

  const { isSubmitting, isDirty } = form.formState;

  // Auto-slug from title (only on create)
  const titleValue = form.watch("title");
  useEffect(() => {
    if (!isEdit) {
      form.setValue("slug", slugify(titleValue));
    }
  }, [titleValue, isEdit, form]);

  // Cmd/Ctrl+S to save
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

  async function onSubmit(values: CourseFormValues) {
    try {
      if (isEdit) {
        const result = await updateCourse(course.id, values);
        if (result.ok) {
          toast.success(t("form.saved"));
        } else {
          toast.error(result.error ?? t("form.saveFailed"));
        }
      } else {
        const result = await createCourse(values);
        if (result.ok && result.data) {
          toast.success(t("form.created"));
          router.push(`/admin/courses/${result.data.id}`);
        } else {
          toast.error((result as { ok: false; error: string }).error ?? t("form.createFailed"));
        }
      }
    } catch {
      toast.error(t("form.unexpected"));
    }
  }

  function onInvalid(errors: object) {
    const fields = Object.keys(errors).join(", ");
    toast.error(t("form.fixFields", { fields }));
  }

  function handleStatusChange(next: "DRAFT" | "PUBLISHED" | "ARCHIVED") {
    if (next === "PUBLISHED" && form.getValues("status") !== "PUBLISHED") {
      setPendingStatus(next);
      setPublishConfirm(true);
    } else {
      form.setValue("status", next);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onInvalid)}>
        {/* Sticky save bar — matches Site Settings */}
        <div className="sticky top-0 z-10 flex items-center justify-between bg-bg-soft/90 backdrop-blur-sm border-b border-line py-2.5 mb-4 -mx-6 px-6">
          <p className="text-[13px] text-muted">
            {isEdit
              ? isDirty
                ? t("form.unsaved")
                : t("form.allSaved")
              : t("form.newHint")}
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => router.push("/admin/courses")}>
              {t("form.cancel")}
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting || (isEdit && !isDirty)}>
              {isSubmitting ? t("form.saving") : isEdit ? t("form.saveChanges") : t("form.createCourse")}
            </Button>
          </div>
        </div>

        {/* 2-column layout: tabs on left (~70%), core details sidebar on right (~30%) */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">

          {/* ── LEFT: tab bar + tab content ── */}
          <div className="min-w-0">
            <Tabs defaultValue="description" className="flex flex-col gap-0">
              <TabsList
                variant="line"
                className="w-full flex flex-nowrap overflow-x-auto h-auto gap-1 bg-[#142A5A] rounded-lg p-1.5 mb-4 justify-start"
              >
                {[
                  { value: "description", label: t("form.tabs.description") },
                  { value: "curriculum", label: t("form.tabs.curriculum") },
                  { value: "pricing", label: t("form.tabs.pricing") },
                  { value: "faq", label: t("form.tabs.faq") },
                  { value: "media", label: t("form.tabs.media") },
                  { value: "badges", label: t("form.tabs.badges") },
                  { value: "seo", label: t("form.tabs.seo") },
                  { value: "translations", label: tr("tab") },
                  { value: "publish", label: t("form.tabs.publish") },
                ].map((tab, i, arr) => (
                  <Fragment key={tab.value}>
                    <TabsTrigger
                      value={tab.value}
                      className="shrink-0 text-[12.5px] font-semibold capitalize px-3.5 py-2 rounded-md text-white hover:bg-white/10 data-[active]:bg-primary-bright data-[active]:text-white data-[active]:shadow-sm transition-colors"
                    >
                      {tab.label}
                    </TabsTrigger>
                    {i < arr.length - 1 && (
                      <span aria-hidden className="shrink-0 self-center w-px h-5 bg-white/20" />
                    )}
                  </Fragment>
                ))}
              </TabsList>

          {/* ── DESCRIPTION ── */}
          <TabsContent value="description">
            <FormSection title={t("form.descTitle")} description={t("form.descDesc")} className="max-w-none">
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <RichTextEditor
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={t("form.descPlaceholder")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </FormSection>
          </TabsContent>

          {/* ── CURRICULUM ── */}
          <TabsContent value="curriculum">
            <FormSection title={t("form.curriculumTitle")} description={t("form.curriculumDesc")} className="max-w-none">
              <CurriculumBuilder />
            </FormSection>
          </TabsContent>

          {/* ── PRICING ── */}
          <TabsContent value="pricing">
            <FormSection title={t("form.pricingTitle")} description={t("form.pricingDesc")} className="max-w-none">
              <div className="space-y-5">
                <DualCurrencyInput
                  label={t("form.price")}
                  madField="priceMadCents"
                  usdField="priceUsdCents"
                />
                <DualCurrencyInput
                  label={t("form.comparePrice")}
                  madField="oldPriceMadCents"
                  usdField="oldPriceUsdCents"
                  optional
                  description={t("form.comparePriceDesc")}
                />
              </div>
            </FormSection>
            <FormSection title={t("form.usdTitle")} description={t("form.usdDesc")} className="max-w-none">
              <FormField control={form.control} name="stripePriceId" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.variantId")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder={t("form.variantPlaceholder")}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("form.variantHelp")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
            </FormSection>
          </TabsContent>

          {/* ── FAQ ── */}
          <TabsContent value="faq">
            <FormSection title={t("form.faqTitle")} description={t("form.faqDesc")} className="max-w-none">
              <FAQBuilder />
            </FormSection>
          </TabsContent>

          {/* ── MEDIA ── */}
          <TabsContent value="media">
            <FormSection title={t("form.thumbTitle")} description={t("form.thumbDesc")} className="max-w-none">
              <FormField control={form.control} name="thumbnailUrl" render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <ImageUploadField
                      endpoint="courseThumbnail"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </FormSection>
            <FormSection title={t("form.previewTitle")} description={t("form.previewDesc")} className="max-w-none">
              <FormField control={form.control} name="previewVideoUrl" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.previewUrl")}</FormLabel>
                  <FormControl><Input {...field} value={field.value ?? ""} placeholder="https://youtube.com/embed/…" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </FormSection>
          </TabsContent>

          {/* ── BADGES ── */}
          <TabsContent value="badges">
            <FormSection title={t("form.badgesTitle")} description={t("form.badgesDesc")} className="max-w-none">
              <div className="space-y-4">
                <FormField control={form.control} name="isBestseller" render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-3">
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      <FormLabel>{t("form.bestseller")}</FormLabel>
                    </div>
                  </FormItem>
                )} />
                <FormField control={form.control} name="isFeatured" render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-3">
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      <FormLabel>{t("form.featured")}</FormLabel>
                    </div>
                  </FormItem>
                )} />
                <FormField control={form.control} name="badge" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.badgeLabel")}</FormLabel>
                    <FormControl>
                      <select {...field} value={field.value ?? ""} className="w-full h-9 rounded-lg border border-line bg-white px-2.5 text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/20">
                        <option value="">{t("form.none")}</option>
                        <option value="BESTSELLER">{t("form.badgeOptions.BESTSELLER")}</option>
                        <option value="NEW">{t("form.badgeOptions.NEW")}</option>
                        <option value="HOT">{t("form.badgeOptions.HOT")}</option>
                        <option value="ON SALE">{t("form.badgeOptions.ON_SALE")}</option>
                        <option value="LAST CHANCE">{t("form.badgeOptions.LAST_CHANCE")}</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </FormSection>
          </TabsContent>

          {/* ── SEO ── */}
          <TabsContent value="seo">
            <FormSection title={t("form.seoTitleSection")} description={t("form.seoDesc")} className="max-w-none">
              <FormField control={form.control} name="seoTitle" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.seoTitle")}</FormLabel>
                  <FormControl><Input {...field} value={field.value ?? ""} placeholder={t("form.seoTitlePlaceholder")} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="seoDescription" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.seoDescription")}</FormLabel>
                  <FormControl><Textarea {...field} value={field.value ?? ""} rows={3} placeholder={t("form.seoDescPlaceholder")} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </FormSection>
          </TabsContent>

          {/* ── TRANSLATIONS ── */}
          <TabsContent value="translations">
            <FormSection title={tr("sectionTitle")} description={tr("sectionDesc")} className="max-w-none">
              <CourseTranslations />
            </FormSection>
          </TabsContent>

          {/* ── PUBLISH ── */}
          <TabsContent value="publish">
            <FormSection title={t("form.publishTitle")} description={t("form.publishDesc")} className="max-w-none">
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.status")}</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {([
                        {
                          value: "DRAFT" as const,
                          label: t("form.status_draft"),
                          hint: t("form.status_draft_hint"),
                          icon: "✏️",
                          activeCls: "border-orange-500 bg-orange-50 text-orange-700 ring-2 ring-orange-200",
                          inactiveCls: "border-line hover:border-orange-300 hover:bg-orange-50/40 text-muted",
                        },
                        {
                          value: "PUBLISHED" as const,
                          label: t("form.status_published"),
                          hint: t("form.status_published_hint"),
                          icon: "🟢",
                          activeCls: "border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-200",
                          inactiveCls: "border-line hover:border-emerald-300 hover:bg-emerald-50/40 text-muted",
                        },
                        {
                          value: "ARCHIVED" as const,
                          label: t("form.status_archived"),
                          hint: t("form.status_archived_hint"),
                          icon: "📦",
                          activeCls: "border-slate-400 bg-slate-100 text-slate-700 ring-2 ring-slate-200",
                          inactiveCls: "border-line hover:border-slate-300 hover:bg-slate-50/40 text-muted",
                        },
                      ]).map((s) => {
                        const isActive = field.value === s.value;
                        return (
                          <button
                            key={s.value}
                            type="button"
                            onClick={() => handleStatusChange(s.value)}
                            className={cn(
                              "px-5 py-4 rounded-lg border-2 text-left transition-all duration-150",
                              isActive ? s.activeCls : s.inactiveCls
                            )}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[18px] leading-none">{s.icon}</span>
                              <span className="text-[14px] font-bold uppercase tracking-wide">{s.label}</span>
                            </div>
                            <p className="text-[11.5px] leading-snug opacity-80">{s.hint}</p>
                          </button>
                        );
                      })}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </FormSection>
          </TabsContent>
            </Tabs>
          </div>{/* end left column */}

          {/* ── RIGHT: Core Details sidebar ── */}
          <div className="sticky top-[73px] flex flex-col gap-4">
            <div className="bg-white rounded-xl border border-line px-6 py-5 space-y-4">
              <h3 className="text-[13px] font-bold text-ink border-b border-line pb-3">{t("form.coreDetails")}</h3>

              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[12px]">{t("form.title")}</FormLabel>
                  <FormControl><Input {...field} placeholder={t("form.titlePlaceholder")} className="text-[13px]" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="slug" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[12px]">{t("form.slug")}</FormLabel>
                  <FormControl><Input {...field} placeholder="complete-python-bootcamp" className="font-mono text-[12px]" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="subtitle" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[12px]">{t("form.subtitle")}</FormLabel>
                  <FormControl><Input {...field} value={field.value ?? ""} placeholder={t("form.subtitlePlaceholder")} className="text-[13px]" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="categoryId" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[12px]">{t("colCategory")}</FormLabel>
                  <FormControl>
                    <select {...field} className="w-full h-9 rounded-lg border border-line bg-white px-2.5 text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/20">
                      <option value="">{t("form.selectCategory")}</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="level" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[12px]">{t("form.level")}</FormLabel>
                  <FormControl>
                    <select {...field} className="w-full h-9 rounded-lg border border-line bg-white px-2.5 text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/20">
                      <option value="BEGINNER">{t("form.levelBeginner")}</option>
                      <option value="INTERMEDIATE">{t("form.levelIntermediate")}</option>
                      <option value="ADVANCED">{t("form.levelAdvanced")}</option>
                      <option value="ALL_LEVELS">{t("form.levelAll")}</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="instructorId" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[12px]">{t("colInstructor")}</FormLabel>
                  <FormControl>
                    <select {...field} className="w-full h-9 rounded-lg border border-line bg-white px-2.5 text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/20">
                      <option value="">{t("form.selectInstructor")}</option>
                      {instructors.map((u) => (
                        <option key={u.id} value={u.id}>{u.name ?? u.email}</option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </div>{/* end right sidebar */}

        </div>{/* end 2-col grid */}
      </form>

      <ConfirmDialog
        open={publishConfirm}
        onOpenChange={setPublishConfirm}
        title={t("form.publishConfirmTitle")}
        description={t("form.publishConfirmDesc")}
        confirmLabel={t("form.publishConfirmLabel")}
        onConfirm={() => {
          if (pendingStatus) {
            form.setValue("status", pendingStatus);
            setPendingStatus(null);
          }
          setPublishConfirm(false);
        }}
      />
    </Form>
  );
}

// ─── Curriculum Builder ───────────────────────────────────────────────────────

function CourseTranslations() {
  const tr = useTranslations("AdminTrCourse");
  const form = useFormContext<CourseFormValues>();
  const value = form.watch("translations") as TranslationsValue | null | undefined;
  const fields: TranslatableField[] = [
    { name: "title", label: tr("title") },
    { name: "subtitle", label: tr("subtitle") },
    { name: "description", label: tr("description"), kind: "richtext" },
    { name: "badge", label: tr("badge") },
    { name: "seoTitle", label: tr("seoTitle") },
    { name: "seoDescription", label: tr("seoDescription"), kind: "textarea", rows: 3 },
  ];
  return (
    <TranslationsEditor
      fields={fields}
      value={value}
      onChange={(next) => form.setValue("translations", next, { shouldDirty: true })}
      english={{
        title: form.watch("title"),
        subtitle: form.watch("subtitle"),
        description: (form.watch("description") ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(),
        badge: form.watch("badge"),
        seoTitle: form.watch("seoTitle"),
        seoDescription: form.watch("seoDescription"),
      }}
    />
  );
}

/** Collapsible per-row translations (FAQ / module / lesson). `base` is the form path of the row. */
function RowTranslations({
  base,
  fields,
  english,
}: {
  base: string;
  fields: TranslatableField[];
  english: Record<string, string | null | undefined>;
}) {
  const tr = useTranslations("AdminTrCourse");
  const form = useFormContext<CourseFormValues>();
  const [open, setOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const value = form.watch(`${base}.translations` as any) as TranslationsValue | null | undefined;
  return (
    <div className="mt-1">
      <button
        type="button"
        aria-expanded={open}
        aria-label={tr("rowToggleAria")}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 text-[11px] font-medium text-muted hover:text-ink"
      >
        {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        {tr("rowToggle")}
      </button>
      {open && (
        <TranslationsEditor
          className="mt-2"
          fields={fields}
          value={value}
          english={english}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onChange={(next) => form.setValue(`${base}.translations` as any, next as any, { shouldDirty: true })}
        />
      )}
    </div>
  );
}

function CurriculumBuilder() {
  const t = useTranslations("AdminCourses");
  const form = useFormContext<CourseFormValues>();
  const { fields: modules, append, remove, move } = useFieldArray({
    control: form.control,
    name: "modules",
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = modules.findIndex((m) => m.id === active.id);
      const newIndex = modules.findIndex((m) => m.id === over.id);
      move(oldIndex, newIndex);
      // Update order values
      modules.forEach((_, i) => {
        form.setValue(`modules.${i}.order`, i);
      });
    }
  }

  return (
    <div className="space-y-3">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={modules.map((m) => m.id!)} strategy={verticalListSortingStrategy}>
          {modules.map((module, modIdx) => (
            <SortableModule
              key={module.id}
              id={module.id!}
              modIdx={modIdx}
              onRemove={() => remove(modIdx)}
            />
          ))}
        </SortableContext>
      </DndContext>

      {modules.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-line rounded-lg">
          <p className="text-[13px] text-muted">{t("form.noModules")}</p>
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() =>
          append({ title: "New module", order: modules.length, lessons: [] })
        }
      >
        <Plus className="w-3.5 h-3.5" /> {t("form.addModule")}
      </Button>
    </div>
  );
}

function SortableModule({ id, modIdx, onRemove }: { id: string; modIdx: number; onRemove: () => void }) {
  const t = useTranslations("AdminCourses");
  const tr = useTranslations("AdminTrCourse");
  const form = useFormContext<CourseFormValues>();
  const [collapsed, setCollapsed] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const { fields: lessons, append: appendLesson, remove: removeLesson, move: moveLesson } = useFieldArray({
    control: form.control,
    name: `modules.${modIdx}.lessons`,
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleLessonDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = lessons.findIndex((l) => l.id === active.id);
      const newIndex = lessons.findIndex((l) => l.id === over.id);
      moveLesson(oldIndex, newIndex);
    }
  }

  return (
    <div ref={setNodeRef} style={style} className="border border-line rounded-lg overflow-hidden bg-white">
      {/* Module header */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-bg-soft border-b border-line">
        <button type="button" {...attributes} {...listeners} className="text-muted hover:text-ink cursor-grab active:cursor-grabbing">
          <GripVertical className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => setCollapsed((c) => !c)} className="text-muted hover:text-ink">
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        <Input
          {...form.register(`modules.${modIdx}.title`)}
          placeholder={t("form.moduleTitle")}
          className="flex-1 h-7 text-[13px] font-semibold border-0 bg-transparent shadow-none focus-visible:ring-0 px-0"
        />
        <span className="text-[11px] text-muted">{t("form.lessonCount", { count: lessons.length })}</span>
        <button
          type="button"
          onClick={onRemove}
          className="text-muted hover:text-red-500 transition-colors ml-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {!collapsed && (
        <div className="px-3 pt-2">
          <RowTranslations
            base={`modules.${modIdx}`}
            fields={[{ name: "title", label: tr("moduleTitle") }]}
            english={{ title: form.watch(`modules.${modIdx}.title`) }}
          />
        </div>
      )}

      {/* Lessons */}
      {!collapsed && (
        <div className="p-3 space-y-1.5">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleLessonDragEnd}>
            <SortableContext items={lessons.map((l) => l.id!)} strategy={verticalListSortingStrategy}>
              {lessons.map((lesson, lessonIdx) => (
                <SortableLesson
                  key={lesson.id}
                  id={lesson.id!}
                  modIdx={modIdx}
                  lessonIdx={lessonIdx}
                  onRemove={() => removeLesson(lessonIdx)}
                />
              ))}
            </SortableContext>
          </DndContext>
          {lessons.length === 0 && (
            <p className="text-[12px] text-muted py-2">{t("form.noLessons")}</p>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-[12px] gap-1 mt-1"
            onClick={() =>
              appendLesson({
                title: "New lesson",
                type: "VIDEO",
                videoGuid: "",
                videoUrl: "",
                audioUrl: "",
                pdfUrl: "",
                htmlContent: "",
                textContent: "",
                durationSeconds: 0,
                isPreview: false,
                order: lessons.length,
                quiz: null,
                assignment: null,
              })
            }
          >
            <Plus className="w-3 h-3" /> {t("form.addLesson")}
          </Button>
        </div>
      )}
    </div>
  );
}

const LESSON_TYPES: Array<{ value: string; label: string; disabled?: boolean }> = [
  { value: "VIDEO", label: "Video" },
  { value: "AUDIO", label: "Audio" },
  { value: "TEXT", label: "Text" },
  { value: "PDF", label: "PDF" },
  { value: "HTML", label: "HTML" },
  { value: "QUIZ", label: "Quiz" },
  { value: "ASSIGNMENT", label: "Assignment" },
];

function SortableLesson({
  id,
  modIdx,
  lessonIdx,
  onRemove,
}: {
  id: string;
  modIdx: number;
  lessonIdx: number;
  onRemove: () => void;
}) {
  const t = useTranslations("AdminCourses");
  const tr = useTranslations("AdminTrCourse");
  const form = useFormContext<CourseFormValues>();
  const [expanded, setExpanded] = useState(false);
  const [typeChangeConfirm, setTypeChangeConfirm] = useState(false);
  const [pendingType, setPendingType] = useState<string | null>(null);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lessonVal = form.watch(`modules.${modIdx}.lessons.${lessonIdx}` as any) as LessonFormValues;
  const currentType = lessonVal?.type ?? "VIDEO";

  function requestTypeChange(newType: string) {
    if (newType === currentType) return;
    const hasContent =
      lessonVal?.videoGuid || lessonVal?.videoUrl || lessonVal?.audioUrl || lessonVal?.pdfUrl ||
      lessonVal?.htmlContent || lessonVal?.textContent;
    if (hasContent) {
      setPendingType(newType);
      setTypeChangeConfirm(true);
    } else {
      commitTypeChange(newType);
    }
  }

  function commitTypeChange(type: string) {
    const base = `modules.${modIdx}.lessons.${lessonIdx}`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const set = (field: string, val: unknown) => form.setValue(`${base}.${field}` as any, val as any, { shouldDirty: true });
    set("type", type);
    set("videoGuid", "");
    set("videoUrl", "");
    set("audioUrl", "");
    set("pdfUrl", "");
    set("htmlContent", "");
    set("textContent", "");
    if (type === "QUIZ") {
      set("quiz", {
        title: lessonVal?.title || "Quiz",
        description: "",
        passThreshold: 70,
        maxRetries: 3,
        showCorrectAnswers: true,
        shuffleQuestions: false,
        questions: [],
      });
      set("assignment", null);
    } else if (type === "ASSIGNMENT") {
      set("assignment", {
        title: lessonVal?.title || "Assignment",
        instructions: "",
        maxFileSizeMb: 10,
        allowedFileTypes: ["pdf", "doc", "docx"],
        dueOffsetDays: null,
        passingGrade: 70,
      });
      set("quiz", null);
    } else {
      set("quiz", null);
      set("assignment", null);
    }
  }

  return (
    <div ref={setNodeRef} style={style} className="border border-line rounded-md bg-white">
      {/* Header row */}
      <div className="flex items-center gap-2 px-2 py-1.5">
        <button type="button" {...attributes} {...listeners} className="text-muted/60 hover:text-muted cursor-grab active:cursor-grabbing">
          <GripVertical className="w-3.5 h-3.5" />
        </button>
        <Input
          {...form.register(`modules.${modIdx}.lessons.${lessonIdx}.title`)}
          placeholder={t("form.lessonTitle")}
          className="flex-1 h-6 text-[12.5px] border-0 bg-transparent shadow-none focus-visible:ring-0 px-0"
        />
        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-muted bg-bg-soft px-1.5 py-0.5 rounded">
          {t(`form.lessonTypes.${currentType}`)}
        </span>
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="shrink-0 text-[11px] text-muted hover:text-ink"
        >
          {expanded ? t("form.less") : t("form.more")}
        </button>
        <button type="button" onClick={onRemove} className="shrink-0 text-muted/60 hover:text-red-400">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div className="px-3 pb-3 pt-2 border-t border-line/50 space-y-3">
          {/* Type picker */}
          <div>
            <p className="text-[11px] font-medium text-muted mb-1.5">{t("form.contentType")}</p>
            <div className="flex flex-wrap gap-1">
              {LESSON_TYPES.map(({ value, disabled }) => (
                <button
                  key={value}
                  type="button"
                  disabled={disabled ?? false}
                  onClick={() => !(disabled ?? false) && requestTypeChange(value)}
                  title={disabled ? t("form.comingSoon") : undefined}
                  className={cn(
                    "px-2.5 py-1 text-[11px] font-semibold rounded-md border transition-colors",
                    value === currentType
                      ? "border-primary bg-primary text-white"
                      : (disabled ?? false)
                      ? "border-line/50 text-muted/40 bg-bg-soft cursor-not-allowed"
                      : "border-line text-muted hover:border-primary/40 hover:text-ink cursor-pointer"
                  )}
                >
                  {t(`form.lessonTypes.${value}`)}
                  {disabled && <span className="ml-0.5 text-[9px] opacity-60">{t("form.soon")}</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Content field — conditional */}
          {currentType === "VIDEO" && (
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-muted">{t("form.bunnyGuid")}</label>
                <Input
                  {...form.register(`modules.${modIdx}.lessons.${lessonIdx}.videoGuid`)}
                  placeholder={t("form.guidPlaceholder")}
                  className="h-7 text-[12px] mt-0.5 font-mono"
                />
                <p className="text-[11px] text-muted mt-1">
                  {t("form.bunnyHelp")}
                </p>
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted">{t("form.legacyUrl")}</label>
                <Input
                  {...form.register(`modules.${modIdx}.lessons.${lessonIdx}.videoUrl`)}
                  placeholder="https://iframe.mediadelivery.net/embed/…"
                  className="h-7 text-[12px] mt-0.5"
                />
                <p className="text-[11px] text-muted mt-1">
                  {t("form.legacyHelp")}
                </p>
              </div>
            </div>
          )}

          {currentType === "AUDIO" && (
            <AudioUploadField
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              value={(form.watch(`modules.${modIdx}.lessons.${lessonIdx}.audioUrl` as any) as string) ?? ""}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onChange={(url) => form.setValue(`modules.${modIdx}.lessons.${lessonIdx}.audioUrl` as any, url)}
            />
          )}

          {currentType === "TEXT" && (
            <div>
              <label className="text-[11px] font-medium text-muted block mb-1">{t("form.textContent")}</label>
              <RichTextEditor
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                value={(form.watch(`modules.${modIdx}.lessons.${lessonIdx}.textContent` as any) as string) ?? ""}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onChange={(html) => form.setValue(`modules.${modIdx}.lessons.${lessonIdx}.textContent` as any, html)}
                placeholder={t("form.textPlaceholder")}
              />
            </div>
          )}

          {currentType === "PDF" && (
            <PdfUploadField
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              value={(form.watch(`modules.${modIdx}.lessons.${lessonIdx}.pdfUrl` as any) as string) ?? ""}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onChange={(url) => form.setValue(`modules.${modIdx}.lessons.${lessonIdx}.pdfUrl` as any, url)}
            />
          )}

          {currentType === "HTML" && (
            <div>
              <label className="text-[11px] font-medium text-muted block mb-1">{t("form.htmlContent")}</label>
              <textarea
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                value={(form.watch(`modules.${modIdx}.lessons.${lessonIdx}.htmlContent` as any) as string) ?? ""}
                onChange={(e) =>
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  form.setValue(`modules.${modIdx}.lessons.${lessonIdx}.htmlContent` as any, e.target.value)
                }
                rows={8}
                placeholder={t("form.htmlPlaceholder")}
                className="w-full font-mono text-[12px] border border-line rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
              />
            </div>
          )}

          {currentType === "QUIZ" && (
            <QuizEditor modIdx={modIdx} lessonIdx={lessonIdx} />
          )}

          {currentType === "ASSIGNMENT" && (
            <AssignmentEditor modIdx={modIdx} lessonIdx={lessonIdx} />
          )}

          <RowTranslations
            base={`modules.${modIdx}.lessons.${lessonIdx}`}
            fields={[{ name: "title", label: tr("lessonTitle") }]}
            english={{ title: lessonVal?.title }}
          />

          {/* Duration + preview — always shown */}
          <div className="grid sm:grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-medium text-muted">{t("form.duration")}</label>
              <Input
                {...form.register(`modules.${modIdx}.lessons.${lessonIdx}.durationSeconds`, { valueAsNumber: true })}
                type="number"
                min={0}
                placeholder="0"
                className="h-7 text-[12px] mt-0.5"
              />
            </div>
            <div className="flex items-end pb-1">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`preview-${modIdx}-${lessonIdx}`}
                  {...form.register(`modules.${modIdx}.lessons.${lessonIdx}.isPreview`)}
                  className="rounded border-line"
                />
                <label htmlFor={`preview-${modIdx}-${lessonIdx}`} className="text-[12px] text-muted">
                  {t("form.freePreview")}
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={typeChangeConfirm}
        onOpenChange={setTypeChangeConfirm}
        title={t("form.changeTypeTitle")}
        description={t("form.changeTypeDesc")}
        confirmLabel={t("form.changeTypeLabel")}
        onConfirm={() => {
          if (pendingType) {
            commitTypeChange(pendingType);
            setPendingType(null);
          }
          setTypeChangeConfirm(false);
        }}
      />
    </div>
  );
}

// ─── FAQ Builder ─────────────────────────────────────────────────────────────

function FAQBuilder() {
  const t = useTranslations("AdminCourses");
  const tr = useTranslations("AdminTrCourse");
  const form = useFormContext<CourseFormValues>();
  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "faqs",
  });

  const [deleteIdx, setDeleteIdx] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      {fields.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-10 border-2 border-dashed border-line rounded-xl">
          <HelpCircle className="w-8 h-8 text-muted/50 mb-3" />
          <p className="text-[13px] font-600 text-ink mb-1">{t("form.noFaqs")}</p>
          <p className="text-[12px] text-muted mb-4 max-w-[300px]">
            {t("form.noFaqsDesc")}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => append({ question: "", answer: "" })}
          >
            <Plus className="w-3.5 h-3.5" /> {t("form.addFirstFaq")}
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {fields.map((field, idx) => (
              <div key={field.id} className="border border-line rounded-xl overflow-hidden bg-white">
                {/* Row header with controls */}
                <div className="flex items-center gap-2 px-3 py-2 bg-bg-soft border-b border-line">
                  <span className="text-[11px] font-700 text-muted w-5 text-center shrink-0">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <FormField
                      control={form.control}
                      name={`faqs.${idx}.question`}
                      render={({ field: f }) => (
                        <FormItem className="space-y-0">
                          <FormControl>
                            <Input
                              {...f}
                              placeholder={t("form.faqQuestionPlaceholder")}
                              className="h-7 text-[13px] font-600 border-0 bg-transparent shadow-none focus-visible:ring-0 px-0"
                            />
                          </FormControl>
                          <FormMessage className="text-[11px]" />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => move(idx, idx - 1)}
                      className="p-1 text-muted hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      aria-label={t("form.moveUp")}
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === fields.length - 1}
                      onClick={() => move(idx, idx + 1)}
                      className="p-1 text-muted hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      aria-label={t("form.moveDown")}
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteIdx(idx)}
                      className="p-1 text-muted hover:text-red-500 transition-colors ml-0.5"
                      aria-label={t("form.deleteFaq")}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Answer textarea */}
                <div className="px-4 py-3">
                  <FormField
                    control={form.control}
                    name={`faqs.${idx}.answer`}
                    render={({ field: f }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-[11px] text-muted">{t("form.answer")}</FormLabel>
                        <FormControl>
                          <Textarea
                            {...f}
                            rows={3}
                            placeholder={t("form.answerPlaceholder")}
                            className="text-[13px] resize-y"
                          />
                        </FormControl>
                        <FormMessage className="text-[11px]" />
                      </FormItem>
                    )}
                  />
                  <RowTranslations
                    base={`faqs.${idx}`}
                    fields={[
                      { name: "question", label: tr("question") },
                      { name: "answer", label: tr("answer"), kind: "textarea", rows: 3 },
                    ]}
                    english={{ question: form.watch(`faqs.${idx}.question`), answer: form.watch(`faqs.${idx}.answer`) }}
                  />
                </div>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => append({ question: "", answer: "" })}
          >
            <Plus className="w-3.5 h-3.5" /> {t("form.addFaq")}
          </Button>
        </>
      )}

      <ConfirmDialog
        open={deleteIdx !== null}
        onOpenChange={(open) => { if (!open) setDeleteIdx(null); }}
        title={t("form.deleteFaqTitle")}
        description={t("form.deleteFaqDesc")}
        confirmLabel={t("delete")}
        onConfirm={() => {
          if (deleteIdx !== null) {
            remove(deleteIdx);
            setDeleteIdx(null);
          }
        }}
      />
    </div>
  );
}

// ─── Upload helpers ───────────────────────────────────────────────────────────

function AudioUploadField({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const t = useTranslations("AdminCourses");
  const { startUpload, isUploading } = useUploadThing("lessonAudio", {
    onClientUploadComplete: (res) => {
      if (res?.[0]) onChange(res[0].url);
    },
    onUploadError: (err) => { toast.error(err.message); },
  });

  return (
    <div>
      <label className="text-[11px] font-medium text-muted block mb-1">{t("form.audioFile")}</label>
      <div className="flex items-center gap-2 flex-wrap">
        <label
          className={cn(
            "cursor-pointer inline-flex items-center gap-1.5 h-7 px-2.5 text-[12px] font-medium rounded-md border border-line hover:bg-bg-hover transition-colors",
            isUploading && "opacity-50 pointer-events-none"
          )}
        >
          <input
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) startUpload([f]);
            }}
          />
          {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
          {isUploading ? t("form.uploading") : t("form.uploadAudio")}
        </label>
        {value && (
          <span className="text-[11px] text-green-600 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> {t("form.uploaded")}
          </span>
        )}
      </div>
      {value && <p className="text-[10px] font-mono text-muted mt-1 truncate max-w-full">{value}</p>}
    </div>
  );
}

function PdfUploadField({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const t = useTranslations("AdminCourses");
  const { startUpload, isUploading } = useUploadThing("lessonPdf", {
    onClientUploadComplete: (res) => {
      if (res?.[0]) onChange(res[0].url);
    },
    onUploadError: (err) => { toast.error(err.message); },
  });

  return (
    <div>
      <label className="text-[11px] font-medium text-muted block mb-1">{t("form.pdfFile")}</label>
      <div className="flex items-center gap-2 flex-wrap">
        <label
          className={cn(
            "cursor-pointer inline-flex items-center gap-1.5 h-7 px-2.5 text-[12px] font-medium rounded-md border border-line hover:bg-bg-hover transition-colors",
            isUploading && "opacity-50 pointer-events-none"
          )}
        >
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) startUpload([f]);
            }}
          />
          {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
          {isUploading ? t("form.uploading") : t("form.uploadPdf")}
        </label>
        {value && (
          <span className="text-[11px] text-green-600 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> {t("form.uploaded")}
          </span>
        )}
      </div>
      {value && <p className="text-[10px] font-mono text-muted mt-1 truncate max-w-full">{value}</p>}
    </div>
  );
}

// ─── Quiz Editor ─────────────────────────────────────────────────────────────

function QuizEditor({ modIdx, lessonIdx }: { modIdx: number; lessonIdx: number }) {
  const t = useTranslations("AdminCourses");
  const form = useFormContext<CourseFormValues>();
  const base = `modules.${modIdx}.lessons.${lessonIdx}.quiz` as const;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const quiz = form.watch(base as any) as CourseFormValues["modules"][number]["lessons"][number]["quiz"];

  if (!quiz) return null;

  const questions = quiz.questions ?? [];

  function update<K extends keyof NonNullable<typeof quiz>>(key: K, val: NonNullable<typeof quiz>[K]) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    form.setValue(`${base}.${String(key)}` as any, val as any, { shouldDirty: true });
  }

  function addQuestion(type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER") {
    const newQ = {
      type,
      prompt: "",
      points: 1,
      order: questions.length,
      options: type === "MULTIPLE_CHOICE" ? ["", ""] : type === "TRUE_FALSE" ? ["true", "false"] : [],
      correctAnswer: "",
      explanation: "",
    };
    update("questions", [...questions, newQ]);
  }

  function updateQuestion(i: number, patch: Partial<typeof questions[number]>) {
    const next = questions.map((q, idx) => (idx === i ? { ...q, ...patch } : q));
    update("questions", next);
  }

  function removeQuestion(i: number) {
    update("questions", questions.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-3 p-3 bg-bg-soft/40 rounded-lg border border-line">
      <div className="flex items-center gap-2">
        <HelpCircle className="w-4 h-4 text-primary" />
        <p className="text-[12px] font-semibold text-ink">{t("form.quizSettings")}</p>
      </div>

      <div>
        <label className="text-[11px] font-medium text-muted">{t("form.quizTitle")}</label>
        <Input
          value={quiz.title}
          onChange={(e) => update("title", e.target.value)}
          placeholder={t("form.quizTitlePlaceholder")}
          className="h-7 text-[12px] mt-0.5"
        />
      </div>

      <div>
        <label className="text-[11px] font-medium text-muted">{t("form.quizDescription")}</label>
        <textarea
          value={quiz.description ?? ""}
          onChange={(e) => update("description", e.target.value)}
          rows={2}
          placeholder={t("form.quizDescPlaceholder")}
          className="w-full text-[12px] border border-line rounded-md px-2 py-1.5 mt-0.5 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[11px] font-medium text-muted">{t("form.passThreshold")}</label>
          <Input
            type="number"
            min={0}
            max={100}
            value={quiz.passThreshold}
            onChange={(e) => update("passThreshold", Number(e.target.value))}
            className="h-7 text-[12px] mt-0.5"
          />
        </div>
        <div>
          <label className="text-[11px] font-medium text-muted">{t("form.maxRetries")}</label>
          <Input
            type="number"
            min={0}
            max={99}
            value={quiz.maxRetries}
            onChange={(e) => update("maxRetries", Number(e.target.value))}
            className="h-7 text-[12px] mt-0.5"
          />
        </div>
      </div>

      <div className="flex gap-4">
        <label className="flex items-center gap-1.5 text-[12px] text-muted">
          <input
            type="checkbox"
            checked={quiz.showCorrectAnswers}
            onChange={(e) => update("showCorrectAnswers", e.target.checked)}
            className="rounded border-line"
          />
          {t("form.showCorrect")}
        </label>
        <label className="flex items-center gap-1.5 text-[12px] text-muted">
          <input
            type="checkbox"
            checked={quiz.shuffleQuestions}
            onChange={(e) => update("shuffleQuestions", e.target.checked)}
            className="rounded border-line"
          />
          {t("form.shuffle")}
        </label>
      </div>

      <div className="border-t border-line pt-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[12px] font-semibold text-ink">
            {t("form.questions")} <span className="text-muted font-normal">({questions.length})</span>
          </p>
          <div className="flex gap-1">
            <Button type="button" size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => addQuestion("MULTIPLE_CHOICE")}>
              {t("form.addMc")}
            </Button>
            <Button type="button" size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => addQuestion("TRUE_FALSE")}>
              {t("form.addTf")}
            </Button>
            <Button type="button" size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => addQuestion("SHORT_ANSWER")}>
              {t("form.addShort")}
            </Button>
          </div>
        </div>

        {questions.length === 0 && (
          <p className="text-[11px] text-muted py-2">{t("form.noQuestions")}</p>
        )}

        <div className="space-y-2">
          {questions.map((q, i) => (
            <div key={i} className="bg-white border border-line rounded-md p-2.5 space-y-2">
              <div className="flex items-start gap-2">
                <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-primary bg-primary-soft px-1.5 py-0.5 rounded mt-1">
                  {q.type === "MULTIPLE_CHOICE" ? t("form.typeMc") : q.type === "TRUE_FALSE" ? t("form.typeTf") : t("form.typeShort")}
                </span>
                <textarea
                  value={q.prompt}
                  onChange={(e) => updateQuestion(i, { prompt: e.target.value })}
                  rows={2}
                  placeholder={t("form.questionPrompt", { n: i + 1 })}
                  className="flex-1 text-[12.5px] border border-line rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
                />
                <button type="button" onClick={() => removeQuestion(i)} className="shrink-0 text-muted/60 hover:text-red-500 mt-1">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>

              {q.type === "MULTIPLE_CHOICE" && (
                <div className="pl-7 space-y-1">
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`correct-${modIdx}-${lessonIdx}-${i}`}
                        checked={q.correctAnswer === opt && opt !== ""}
                        onChange={() => updateQuestion(i, { correctAnswer: opt })}
                        className="border-line"
                        title={t("form.markCorrect")}
                      />
                      <Input
                        value={opt}
                        onChange={(e) => {
                          const wasCorrect = q.correctAnswer === opt;
                          const nextOpts = q.options.map((o, j) => (j === oi ? e.target.value : o));
                          updateQuestion(i, {
                            options: nextOpts,
                            correctAnswer: wasCorrect ? e.target.value : q.correctAnswer,
                          });
                        }}
                        placeholder={t("form.option", { n: oi + 1 })}
                        className="h-7 text-[12px] flex-1"
                      />
                      {q.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => {
                            const nextOpts = q.options.filter((_, j) => j !== oi);
                            updateQuestion(i, {
                              options: nextOpts,
                              correctAnswer: q.correctAnswer === opt ? "" : q.correctAnswer,
                            });
                          }}
                          className="text-muted/60 hover:text-red-500"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => updateQuestion(i, { options: [...q.options, ""] })}
                    className="text-[11px] text-primary font-semibold hover:underline ml-5"
                  >
                    {t("form.addOption")}
                  </button>
                </div>
              )}

              {q.type === "TRUE_FALSE" && (
                <div className="pl-7 flex gap-3">
                  <label className="flex items-center gap-1.5 text-[12px]">
                    <input
                      type="radio"
                      name={`tf-${modIdx}-${lessonIdx}-${i}`}
                      checked={q.correctAnswer === "true"}
                      onChange={() => updateQuestion(i, { correctAnswer: "true" })}
                    />
                    {t("form.true")}
                  </label>
                  <label className="flex items-center gap-1.5 text-[12px]">
                    <input
                      type="radio"
                      name={`tf-${modIdx}-${lessonIdx}-${i}`}
                      checked={q.correctAnswer === "false"}
                      onChange={() => updateQuestion(i, { correctAnswer: "false" })}
                    />
                    {t("form.false")}
                  </label>
                </div>
              )}

              {q.type === "SHORT_ANSWER" && (
                <div className="pl-7">
                  <label className="text-[11px] font-medium text-muted">{t("form.expectedAnswer")}</label>
                  <Input
                    value={q.correctAnswer ?? ""}
                    onChange={(e) => updateQuestion(i, { correctAnswer: e.target.value })}
                    placeholder={t("form.expectedPlaceholder")}
                    className="h-7 text-[12px] mt-0.5"
                  />
                </div>
              )}

              <div className="pl-7 grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-muted">{t("form.points")}</label>
                  <Input
                    type="number"
                    min={1}
                    value={q.points}
                    onChange={(e) => updateQuestion(i, { points: Math.max(1, Number(e.target.value)) })}
                    className="h-7 text-[12px] mt-0.5"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted">{t("form.explanation")}</label>
                  <Input
                    value={q.explanation ?? ""}
                    onChange={(e) => updateQuestion(i, { explanation: e.target.value })}
                    placeholder={t("form.explanationPlaceholder")}
                    className="h-7 text-[12px] mt-0.5"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Assignment Editor ───────────────────────────────────────────────────────

const FILE_TYPE_OPTIONS = ["pdf", "doc", "docx", "txt", "ppt", "pptx", "xls", "xlsx", "zip", "png", "jpg"];

function AssignmentEditor({ modIdx, lessonIdx }: { modIdx: number; lessonIdx: number }) {
  const t = useTranslations("AdminCourses");
  const form = useFormContext<CourseFormValues>();
  const base = `modules.${modIdx}.lessons.${lessonIdx}.assignment` as const;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const assignment = form.watch(base as any) as CourseFormValues["modules"][number]["lessons"][number]["assignment"];

  if (!assignment) return null;

  function update<K extends keyof NonNullable<typeof assignment>>(key: K, val: NonNullable<typeof assignment>[K]) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    form.setValue(`${base}.${String(key)}` as any, val as any, { shouldDirty: true });
  }

  function toggleFileType(ext: string) {
    const current = assignment!.allowedFileTypes ?? [];
    const next = current.includes(ext) ? current.filter((t) => t !== ext) : [...current, ext];
    update("allowedFileTypes", next);
  }

  return (
    <div className="space-y-3 p-3 bg-bg-soft/40 rounded-lg border border-line">
      <div className="flex items-center gap-2">
        <Upload className="w-4 h-4 text-primary" />
        <p className="text-[12px] font-semibold text-ink">{t("form.assignmentSettings")}</p>
      </div>

      <div>
        <label className="text-[11px] font-medium text-muted">{t("form.assignmentTitle")}</label>
        <Input
          value={assignment.title}
          onChange={(e) => update("title", e.target.value)}
          placeholder={t("form.assignmentTitlePlaceholder")}
          className="h-7 text-[12px] mt-0.5"
        />
      </div>

      <div>
        <label className="text-[11px] font-medium text-muted">{t("form.instructions")}</label>
        <textarea
          value={assignment.instructions}
          onChange={(e) => update("instructions", e.target.value)}
          rows={5}
          placeholder={t("form.instructionsPlaceholder")}
          className="w-full text-[12px] border border-line rounded-md px-2 py-1.5 mt-0.5 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
        />
      </div>

      <div>
        <label className="text-[11px] font-medium text-muted block mb-1">{t("form.allowedTypes")}</label>
        <div className="flex flex-wrap gap-1">
          {FILE_TYPE_OPTIONS.map((ext) => {
            const active = assignment.allowedFileTypes?.includes(ext) ?? false;
            return (
              <button
                key={ext}
                type="button"
                onClick={() => toggleFileType(ext)}
                className={cn(
                  "px-2 py-0.5 text-[10.5px] font-semibold uppercase rounded-md border transition-colors",
                  active
                    ? "border-primary bg-primary text-white"
                    : "border-line text-muted hover:border-primary/40 hover:text-ink"
                )}
              >
                .{ext}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-[11px] font-medium text-muted">{t("form.maxSize")}</label>
          <Input
            type="number"
            min={1}
            max={100}
            value={assignment.maxFileSizeMb}
            onChange={(e) => update("maxFileSizeMb", Number(e.target.value))}
            className="h-7 text-[12px] mt-0.5"
          />
        </div>
        <div>
          <label className="text-[11px] font-medium text-muted">{t("form.dueOffset")}</label>
          <Input
            type="number"
            min={0}
            value={assignment.dueOffsetDays ?? ""}
            onChange={(e) =>
              update("dueOffsetDays", e.target.value === "" ? null : Number(e.target.value))
            }
            placeholder={t("form.optional")}
            className="h-7 text-[12px] mt-0.5"
          />
        </div>
        <div>
          <label className="text-[11px] font-medium text-muted">{t("form.passingGrade")}</label>
          <Input
            type="number"
            min={0}
            max={100}
            value={assignment.passingGrade}
            onChange={(e) => update("passingGrade", Number(e.target.value))}
            className="h-7 text-[12px] mt-0.5"
          />
        </div>
      </div>
    </div>
  );
}
