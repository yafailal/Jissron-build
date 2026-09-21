import { z } from "zod";

export const LESSON_TYPE_VALUES = ["VIDEO", "AUDIO", "TEXT", "PDF", "HTML", "QUIZ", "ASSIGNMENT"] as const;
export type LessonType = (typeof LESSON_TYPE_VALUES)[number];

export const QUESTION_TYPE_VALUES = ["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER"] as const;
export type QuestionType = (typeof QUESTION_TYPE_VALUES)[number];

export const QuizQuestionSchema = z.object({
  id: z.string().optional(),
  type: z.enum(QUESTION_TYPE_VALUES),
  prompt: z.string().min(1, "Question prompt required"),
  points: z.coerce.number().int().min(1),
  order: z.number().int(),
  options: z.array(z.string()),
  correctAnswer: z.string().nullable().optional(),
  explanation: z.string().nullable().optional(),
});

export type QuizQuestionFormValues = z.infer<typeof QuizQuestionSchema>;

export const QuizSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Quiz title required"),
  description: z.string().nullable().optional(),
  passThreshold: z.coerce.number().int().min(0).max(100),
  maxRetries: z.coerce.number().int().min(0).max(99),
  showCorrectAnswers: z.boolean(),
  shuffleQuestions: z.boolean(),
  questions: z.array(QuizQuestionSchema),
});

export type QuizFormValues = z.infer<typeof QuizSchema>;

export const AssignmentSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Assignment title required"),
  instructions: z.string().min(1, "Instructions required"),
  maxFileSizeMb: z.coerce.number().int().min(1).max(100),
  allowedFileTypes: z.array(z.string()),
  dueOffsetDays: z.coerce.number().int().min(0).nullable().optional(),
  passingGrade: z.coerce.number().int().min(0).max(100),
});

export type AssignmentFormValues = z.infer<typeof AssignmentSchema>;

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
    quiz: QuizSchema.nullable().optional(),
    assignment: AssignmentSchema.nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "QUIZ") {
      if (!data.quiz) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Quiz configuration required",
          path: ["quiz"],
        });
        return;
      }
      data.quiz.questions.forEach((q, i) => {
        if (q.type === "MULTIPLE_CHOICE") {
          if (q.options.length < 2) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "At least 2 options required",
              path: ["quiz", "questions", i, "options"],
            });
          }
          if (!q.correctAnswer || !q.options.includes(q.correctAnswer)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Pick the correct option",
              path: ["quiz", "questions", i, "correctAnswer"],
            });
          }
        }
        if (q.type === "TRUE_FALSE") {
          if (q.correctAnswer !== "true" && q.correctAnswer !== "false") {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Pick True or False",
              path: ["quiz", "questions", i, "correctAnswer"],
            });
          }
        }
      });
    }
    if (data.type === "ASSIGNMENT" && !data.assignment) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Assignment configuration required",
        path: ["assignment"],
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
  stripePriceId: z.string().optional().nullable(),

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
