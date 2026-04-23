import { z } from "zod";

export const LiveSessionSchema = z.object({
  title: z.string().min(1, "Title required"),
  slug: z.string().min(1, "Slug required").regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, hyphens only"),
  description: z.string().min(1, "Description required"),
  kind: z.enum(["AMA", "WORKSHOP", "SEMINAR", "COHORT"]),
  status: z.enum(["SCHEDULED", "LIVE", "ENDED", "CANCELLED"]),
  hostId: z.string().min(1, "Host required"),
  startsAt: z.string().min(1, "Start date/time required"),
  durationMins: z.coerce.number().int().min(1),
  seatsTotal: z.coerce.number().int().min(1),
  isFree: z.boolean(),
  priceCents: z.coerce.number().int().min(0),
  meetingUrl: z.string().optional().nullable(),
  isFeatured: z.boolean(),
  recordingUrl: z.string().optional().nullable(),
});

export type LiveSessionFormValues = z.infer<typeof LiveSessionSchema>;
