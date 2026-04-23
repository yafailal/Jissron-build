import { z } from "zod";

// When creating, admin can either pick an existing user or create a new one
export const ConsultantSchema = z.object({
  // User: pick existing OR create new
  userId: z.string().optional(),
  newUserName: z.string().optional(),
  newUserEmail: z.string().email("Invalid email").optional(),

  // Consultant profile
  tagline: z.string().optional().nullable(),
  bio: z.string().min(1, "Bio required"),
  ratePerSession: z.coerce.number().int().min(0, "Rate must be >= 0"),
  durationMins: z.coerce.number().int().min(15).max(240),
  skills: z.array(z.string()),
  avatarUrl: z.string().optional().nullable(),
  acceptsNew: z.boolean(),
  isFeatured: z.boolean(),

  // Availability (simplified)
  availableDays: z.array(z.string()), // ["mon","tue",...]
  typicalHours: z.string().optional().nullable(), // "09:00-17:00 UTC"
}).refine(
  (data) => data.userId || (data.newUserName && data.newUserEmail),
  { message: "Either select an existing user or provide name + email for a new one", path: ["userId"] }
);

export type ConsultantFormValues = z.infer<typeof ConsultantSchema>;

export const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export const DAY_LABELS: Record<string, string> = {
  mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun",
};
