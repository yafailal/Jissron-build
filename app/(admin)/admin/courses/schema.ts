import { z } from "zod";

export const LESSON_TYPE_VALUES = ["VIDEO", "AUDIO", "TEXT", "PDF", "HTML", "QUIZ", "ASSIGNMENT"] as const;
export type LessonType = (typeof LESSON_TYPE_VALUES)[number];

export const LessonSchema = z
  .object({
    id: z.string().optional(),
    title: z.string().min(1, "Title required"),
    type: z.enum(LESSON_TYPE_VALUES),
    videoGuid: z.string().optional().nullable(),
    videoUrl: z.string().optional().nullable(),
    audioUrl: z.string().optional().nullable(),
    pdfUrl: z.string().optional().nullable(),
    htmlContent: z.string().optional().nullable(),
    textContent: z.string().optional().nullable(),
    durationSeconds: z.coerce.number().int().min(0),
    isPreview: z.boolean(),
    order: z.number().int(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "QUIZ" || data.type === "ASSIGNMENT") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${data.type} lesson types are coming soon and cannot be saved yet`,
        path: ["type"],
      });
    }
  });

export const ModuleSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Module title required"),
  order: z.number().int(),
  lessons: z.array(LessonSchema),
});

export const FAQSchema = z.object({
  id: z.string().optional(),
  question: z.string().min(1, "Question required"),
  answer: z.string().min(1, "Answer required"),
});

export type FAQFormValues = z.infer<typeof FAQSchema>;

export const CourseSchema = z.object({
  // Basics
  title: z.string().min(1, "Title required"),
  slug: z.string().min(1, "Slug required").regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, hyphens only"),
  subtitle: z.string().optional().nullable(),
  categoryId: z.string().min(1, "Category required"),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "ALL_LEVELS"]),
  language: z.string(),

  // Description
  description: z.string().min(1, "Description required"),

  // Curriculum
  modules: z.array(ModuleSchema),

  // Lemon Squeezy
  lemonSqueezyVariantId: z.string().optional().nullable(),

  // Pricing (dual currency — MAD + USD stored as cents/centimes)
  priceMadCents: z.coerce.number().int().min(0),
  priceUsdCents: z.coerce.number().int().min(0),
  oldPriceMadCents: z.coerce.number().int().min(0).optional().nullable(),
  oldPriceUsdCents: z.coerce.number().int().min(0).optional().nullable(),

  // Media
  thumbnailUrl: z.string().optional().nullable(),
  previewVideoUrl: z.string().optional().nullable(),

  // Badges
  isBestseller: z.boolean(),
  isFeatured: z.boolean(),
  badge: z.string().optional().nullable(),

  // SEO
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),

  // Publish
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),

  // Instructor (admin sets this)
  instructorId: z.string().min(1, "Instructor required"),

  // FAQs
  faqs: z.array(FAQSchema),
});

export type CourseFormValues = z.infer<typeof CourseSchema>;
export type ModuleFormValues = z.infer<typeof ModuleSchema>;
export type LessonFormValues = z.infer<typeof LessonSchema>;
