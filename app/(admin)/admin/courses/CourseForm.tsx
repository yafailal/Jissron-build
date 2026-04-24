"use client";

import { useForm, useFieldArray, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useCallback } from "react";
import { toast } from "sonner";
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
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { FormSection } from "@/components/admin/FormSection";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { CourseSchema, type CourseFormValues, type ModuleFormValues, type LessonFormValues, type FAQFormValues } from "./schema";
import { DualCurrencyInput } from "@/components/admin/DualCurrencyInput";
import { createCourse, updateCourse } from "./actions";
import { GripVertical, ChevronDown, ChevronRight, ChevronUp, Plus, Trash2, Upload, Loader2, CheckCircle2, HelpCircle } from "lucide-react";
import { useUploadThing } from "@/lib/uploadthing";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Category, User, Course, Module, Lesson, CourseFAQ } from "@prisma/client";

type CourseWithModules = Course & {
  modules: (Module & { lessons: Lesson[] })[];
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
            })),
          })),
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
          })),
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
        },
  });

  const { isSubmitting } = form.formState;

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
          toast.success("Course saved");
        } else {
          toast.error(result.error ?? "Failed to save");
        }
      } else {
        const result = await createCourse(values);
        if (result.ok && result.data) {
          toast.success("Course created");
          router.push(`/admin/courses/${result.data.id}`);
        } else {
          toast.error((result as { ok: false; error: string }).error ?? "Failed to create");
        }
      }
    } catch {
      toast.error("Unexpected error");
    }
  }

  function onInvalid(errors: object) {
    const fields = Object.keys(errors).join(", ");
    toast.error(`Fix required fields: ${fields}`);
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
        {/* Sticky save bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between bg-bg-soft/90 backdrop-blur-sm border-b border-line py-3 mb-6 -mx-6 px-6">
          <p className="text-[12px] text-muted">
            {isEdit ? "Editing course" : "New course"} · Press ⌘S to save
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => router.push("/admin/courses")}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : isEdit ? "Save changes" : "Create course"}
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
                className="w-full flex flex-wrap h-auto gap-x-1 gap-y-1 bg-transparent border-b border-line rounded-none pb-1 mb-6 justify-start"
              >
                {[
                  { value: "description", label: "Description" },
                  { value: "curriculum", label: "Curriculum" },
                  { value: "pricing", label: "Pricing" },
                  { value: "faq", label: "FAQ" },
                  { value: "media", label: "Media" },
                  { value: "badges", label: "Badges" },
                  { value: "seo", label: "SEO" },
                  { value: "publish", label: "Publish" },
                ].map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="text-[12px] font-semibold px-3 py-1.5 rounded-md data-[active]:bg-primary data-[active]:text-white text-muted hover:text-ink hover:bg-bg-hover transition-colors capitalize"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

          {/* ── DESCRIPTION ── */}
          <TabsContent value="description">
            <FormSection title="Course description" description="Shown on the course detail page. Supports rich formatting.">
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <RichTextEditor
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Describe what students will learn…"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </FormSection>
          </TabsContent>

          {/* ── CURRICULUM ── */}
          <TabsContent value="curriculum">
            <FormSection title="Curriculum" description="Drag to reorder modules and lessons.">
              <CurriculumBuilder />
            </FormSection>
          </TabsContent>

          {/* ── PRICING ── */}
          <TabsContent value="pricing">
            <FormSection title="Pricing" description="Set both to 0 for a free course.">
              <div className="space-y-5">
                <DualCurrencyInput
                  label="Price"
                  madField="priceMadCents"
                  usdField="priceUsdCents"
                />
                <DualCurrencyInput
                  label="Compare-at price (optional)"
                  madField="oldPriceMadCents"
                  usdField="oldPriceUsdCents"
                  optional
                  description="Shows as strikethrough. Drives the sale badge percentage."
                />
              </div>
            </FormSection>
          </TabsContent>

          {/* ── FAQ ── */}
          <TabsContent value="faq">
            <FormSection title="Frequently asked questions" description="Help students decide by answering common questions. FAQs appear as an accordion on the course detail page.">
              <FAQBuilder />
            </FormSection>
          </TabsContent>

          {/* ── MEDIA ── */}
          <TabsContent value="media">
            <FormSection title="Thumbnail" description="Shown on course cards. Recommended: 16:9, min 800×450px.">
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
            <FormSection title="Preview video" description="Short teaser video URL (YouTube embed, Vimeo, etc.)">
              <FormField control={form.control} name="previewVideoUrl" render={({ field }) => (
                <FormItem>
                  <FormLabel>Preview video URL</FormLabel>
                  <FormControl><Input {...field} value={field.value ?? ""} placeholder="https://youtube.com/embed/…" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </FormSection>
          </TabsContent>

          {/* ── BADGES ── */}
          <TabsContent value="badges">
            <FormSection title="Badges & visibility" description="Control how this course appears in listings.">
              <div className="space-y-4">
                <FormField control={form.control} name="isBestseller" render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-3">
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      <FormLabel>Bestseller</FormLabel>
                    </div>
                  </FormItem>
                )} />
                <FormField control={form.control} name="isFeatured" render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-3">
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      <FormLabel>Featured on homepage</FormLabel>
                    </div>
                  </FormItem>
                )} />
                <FormField control={form.control} name="badge" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Badge label (optional)</FormLabel>
                    <FormControl>
                      <select {...field} value={field.value ?? ""} className="w-full h-9 rounded-lg border border-line bg-white px-2.5 text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/20">
                        <option value="">None</option>
                        <option value="BESTSELLER">BESTSELLER</option>
                        <option value="NEW">NEW</option>
                        <option value="HOT">HOT</option>
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
            <FormSection title="SEO" description="Overrides the global SEO defaults for this course's page.">
              <FormField control={form.control} name="seoTitle" render={({ field }) => (
                <FormItem>
                  <FormLabel>SEO title</FormLabel>
                  <FormControl><Input {...field} value={field.value ?? ""} placeholder="Leave blank to use course title" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="seoDescription" render={({ field }) => (
                <FormItem>
                  <FormLabel>SEO description</FormLabel>
                  <FormControl><Textarea {...field} value={field.value ?? ""} rows={3} placeholder="Leave blank to use course subtitle" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </FormSection>
          </TabsContent>

          {/* ── PUBLISH ── */}
          <TabsContent value="publish">
            <FormSection title="Publishing status" description="Only published courses appear on the public site.">
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <div className="flex gap-3">
                      {(["DRAFT", "PUBLISHED", "ARCHIVED"] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => handleStatusChange(s)}
                          className={cn(
                            "flex-1 py-3 rounded-lg border-2 text-[13px] font-semibold transition-colors",
                            field.value === s
                              ? s === "PUBLISHED"
                                ? "border-green-500 bg-green-50 text-green-700"
                                : s === "ARCHIVED"
                                ? "border-gray-400 bg-gray-50 text-gray-600"
                                : "border-primary bg-primary/5 text-primary"
                              : "border-line text-muted hover:border-primary/30 hover:text-ink"
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <p className="text-[12px] text-muted mt-2">
                {form.watch("status") === "PUBLISHED"
                  ? "This course is live and visible to students."
                  : form.watch("status") === "ARCHIVED"
                  ? "Archived courses are hidden from students but not deleted."
                  : "Draft courses are only visible to admins."}
              </p>
            </FormSection>
          </TabsContent>
            </Tabs>
          </div>{/* end left column */}

          {/* ── RIGHT: Core Details sidebar ── */}
          <div className="sticky top-[73px] flex flex-col gap-4">
            <div className="bg-white rounded-xl border border-line px-6 py-5 space-y-4">
              <h3 className="text-[13px] font-bold text-ink border-b border-line pb-3">Core Details</h3>

              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[12px]">Title</FormLabel>
                  <FormControl><Input {...field} placeholder="e.g. Complete Python Bootcamp" className="text-[13px]" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="slug" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[12px]">Slug</FormLabel>
                  <FormControl><Input {...field} placeholder="complete-python-bootcamp" className="font-mono text-[12px]" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="subtitle" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[12px]">Subtitle</FormLabel>
                  <FormControl><Input {...field} value={field.value ?? ""} placeholder="One-line tagline" className="text-[13px]" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="categoryId" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[12px]">Category</FormLabel>
                  <FormControl>
                    <select {...field} className="w-full h-9 rounded-lg border border-line bg-white px-2.5 text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/20">
                      <option value="">Select category…</option>
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
                  <FormLabel className="text-[12px]">Level</FormLabel>
                  <FormControl>
                    <select {...field} className="w-full h-9 rounded-lg border border-line bg-white px-2.5 text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/20">
                      <option value="BEGINNER">Beginner</option>
                      <option value="INTERMEDIATE">Intermediate</option>
                      <option value="ADVANCED">Advanced</option>
                      <option value="ALL_LEVELS">All levels</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="instructorId" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[12px]">Instructor</FormLabel>
                  <FormControl>
                    <select {...field} className="w-full h-9 rounded-lg border border-line bg-white px-2.5 text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/20">
                      <option value="">Select instructor…</option>
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
        title="Publish this course?"
        description="Once published, this course will be visible to all students on the public site."
        confirmLabel="Yes, publish"
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

function CurriculumBuilder() {
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
          <p className="text-[13px] text-muted">No modules yet. Add your first module below.</p>
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
        <Plus className="w-3.5 h-3.5" /> Add module
      </Button>
    </div>
  );
}

function SortableModule({ id, modIdx, onRemove }: { id: string; modIdx: number; onRemove: () => void }) {
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
          placeholder="Module title"
          className="flex-1 h-7 text-[13px] font-semibold border-0 bg-transparent shadow-none focus-visible:ring-0 px-0"
        />
        <span className="text-[11px] text-muted">{lessons.length} lesson{lessons.length !== 1 ? "s" : ""}</span>
        <button
          type="button"
          onClick={onRemove}
          className="text-muted hover:text-red-500 transition-colors ml-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

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
            <p className="text-[12px] text-muted py-2">No lessons yet.</p>
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
              })
            }
          >
            <Plus className="w-3 h-3" /> Add lesson
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
  { value: "QUIZ", label: "Quiz", disabled: true },
  { value: "ASSIGNMENT", label: "Assignment", disabled: true },
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
    const set = (field: string, val: unknown) => form.setValue(`${base}.${field}` as any, val as any);
    set("type", type);
    set("videoGuid", "");
    set("videoUrl", "");
    set("audioUrl", "");
    set("pdfUrl", "");
    set("htmlContent", "");
    set("textContent", "");
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
          placeholder="Lesson title"
          className="flex-1 h-6 text-[12.5px] border-0 bg-transparent shadow-none focus-visible:ring-0 px-0"
        />
        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-muted bg-bg-soft px-1.5 py-0.5 rounded">
          {currentType}
        </span>
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="shrink-0 text-[11px] text-muted hover:text-ink"
        >
          {expanded ? "less" : "more"}
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
            <p className="text-[11px] font-medium text-muted mb-1.5">Content type</p>
            <div className="flex flex-wrap gap-1">
              {LESSON_TYPES.map(({ value, label, disabled }) => (
                <button
                  key={value}
                  type="button"
                  disabled={disabled ?? false}
                  onClick={() => !(disabled ?? false) && requestTypeChange(value)}
                  title={disabled ? "Coming soon" : undefined}
                  className={cn(
                    "px-2.5 py-1 text-[11px] font-semibold rounded-md border transition-colors",
                    value === currentType
                      ? "border-primary bg-primary text-white"
                      : (disabled ?? false)
                      ? "border-line/50 text-muted/40 bg-bg-soft cursor-not-allowed"
                      : "border-line text-muted hover:border-primary/40 hover:text-ink cursor-pointer"
                  )}
                >
                  {label}
                  {disabled && <span className="ml-0.5 text-[9px] opacity-60">soon</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Content field — conditional */}
          {currentType === "VIDEO" && (
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-muted">Bunny Video GUID (required for video lessons)</label>
                <Input
                  {...form.register(`modules.${modIdx}.lessons.${lessonIdx}.videoGuid`)}
                  placeholder="e.g. a1b2c3d4-e5f6-…"
                  className="h-7 text-[12px] mt-0.5 font-mono"
                />
                <p className="text-[11px] text-muted mt-1">
                  Paste the video GUID from your Bunny Stream library. This generates signed URLs for secure playback.
                </p>
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted">Legacy embed URL (optional — for non-Bunny videos or migration)</label>
                <Input
                  {...form.register(`modules.${modIdx}.lessons.${lessonIdx}.videoUrl`)}
                  placeholder="https://iframe.mediadelivery.net/embed/…"
                  className="h-7 text-[12px] mt-0.5"
                />
                <p className="text-[11px] text-muted mt-1">
                  Only fill this if the video isn&apos;t hosted on Bunny Stream. Ignored if videoGuid is set.
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
              <label className="text-[11px] font-medium text-muted block mb-1">Text content</label>
              <RichTextEditor
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                value={(form.watch(`modules.${modIdx}.lessons.${lessonIdx}.textContent` as any) as string) ?? ""}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onChange={(html) => form.setValue(`modules.${modIdx}.lessons.${lessonIdx}.textContent` as any, html)}
                placeholder="Write the lesson content…"
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
              <label className="text-[11px] font-medium text-muted block mb-1">HTML content</label>
              <textarea
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                value={(form.watch(`modules.${modIdx}.lessons.${lessonIdx}.htmlContent` as any) as string) ?? ""}
                onChange={(e) =>
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  form.setValue(`modules.${modIdx}.lessons.${lessonIdx}.htmlContent` as any, e.target.value)
                }
                rows={8}
                placeholder={"<h1>Lesson title</h1>\n<p>Content here...</p>"}
                className="w-full font-mono text-[12px] border border-line rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
              />
            </div>
          )}

          {/* Duration + preview — always shown */}
          <div className="grid sm:grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-medium text-muted">Duration (seconds)</label>
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
                  Free preview
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={typeChangeConfirm}
        onOpenChange={setTypeChangeConfirm}
        title="Change content type?"
        description="Changing the type will clear the existing content for this lesson. This cannot be undone."
        confirmLabel="Change type"
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
          <p className="text-[13px] font-600 text-ink mb-1">No FAQs yet</p>
          <p className="text-[12px] text-muted mb-4 max-w-[300px]">
            Add frequently asked questions to help students decide whether this course is right for them.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => append({ question: "", answer: "" })}
          >
            <Plus className="w-3.5 h-3.5" /> Add your first FAQ
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
                              placeholder="e.g. What language is this course taught in?"
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
                      aria-label="Move up"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === fields.length - 1}
                      onClick={() => move(idx, idx + 1)}
                      className="p-1 text-muted hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      aria-label="Move down"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteIdx(idx)}
                      className="p-1 text-muted hover:text-red-500 transition-colors ml-0.5"
                      aria-label="Delete FAQ"
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
                        <FormLabel className="text-[11px] text-muted">Answer</FormLabel>
                        <FormControl>
                          <Textarea
                            {...f}
                            rows={3}
                            placeholder="Write a clear, helpful answer…"
                            className="text-[13px] resize-y"
                          />
                        </FormControl>
                        <FormMessage className="text-[11px]" />
                      </FormItem>
                    )}
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
            <Plus className="w-3.5 h-3.5" /> Add FAQ
          </Button>
        </>
      )}

      <ConfirmDialog
        open={deleteIdx !== null}
        onOpenChange={(open) => { if (!open) setDeleteIdx(null); }}
        title="Delete this FAQ?"
        description="This will remove the question and its answer. This cannot be undone."
        confirmLabel="Delete"
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
  const { startUpload, isUploading } = useUploadThing("lessonAudio", {
    onClientUploadComplete: (res) => {
      if (res?.[0]) onChange(res[0].url);
    },
    onUploadError: (err) => { toast.error(err.message); },
  });

  return (
    <div>
      <label className="text-[11px] font-medium text-muted block mb-1">Audio file</label>
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
          {isUploading ? "Uploading…" : "Upload audio"}
        </label>
        {value && (
          <span className="text-[11px] text-green-600 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Uploaded
          </span>
        )}
      </div>
      {value && <p className="text-[10px] font-mono text-muted mt-1 truncate max-w-full">{value}</p>}
    </div>
  );
}

function PdfUploadField({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const { startUpload, isUploading } = useUploadThing("lessonPdf", {
    onClientUploadComplete: (res) => {
      if (res?.[0]) onChange(res[0].url);
    },
    onUploadError: (err) => { toast.error(err.message); },
  });

  return (
    <div>
      <label className="text-[11px] font-medium text-muted block mb-1">PDF file</label>
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
          {isUploading ? "Uploading…" : "Upload PDF"}
        </label>
        {value && (
          <span className="text-[11px] text-green-600 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Uploaded
          </span>
        )}
      </div>
      {value && <p className="text-[10px] font-mono text-muted mt-1 truncate max-w-full">{value}</p>}
    </div>
  );
}
