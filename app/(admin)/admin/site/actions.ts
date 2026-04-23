"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { SiteSettingsSchema, type SiteSettingsFormValues } from "./schema";

export async function saveSiteSettings(
  values: SiteSettingsFormValues
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return { ok: false, error: "Unauthorized" };
  }

  const parsed = SiteSettingsSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Validation failed" };
  }

  const data = parsed.data;

  const current = await db.siteSettings.findUnique({ where: { id: "default" } });
  const changedFields: string[] = [];
  if (current) {
    for (const key of Object.keys(data) as (keyof typeof data)[]) {
      const newVal = JSON.stringify(data[key]);
      const oldVal = JSON.stringify((current as Record<string, unknown>)[key]);
      if (newVal !== oldVal) changedFields.push(key as string);
    }
  }

  await db.siteSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      ...data,
      urgencyEndsAt: data.urgencyEndsAt ? new Date(data.urgencyEndsAt) : null,
      updatedBy: session.user.id,
    },
    update: {
      ...data,
      urgencyEndsAt: data.urgencyEndsAt ? new Date(data.urgencyEndsAt) : null,
      updatedBy: session.user.id,
    },
  });

  // Isolated so an audit-log failure never rolls back the settings save.
  try {
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        action: "SITE_SETTINGS_UPDATED",
        entity: "SiteSettings",
        entityId: "default",
        metadata: { changedFields },
      },
    });
  } catch {
    // Non-fatal — settings are already saved above.
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/site");

  return { ok: true };
}
