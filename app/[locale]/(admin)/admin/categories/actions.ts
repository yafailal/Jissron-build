"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { cleanTranslations, type TranslationsValue } from "@/components/admin/TranslationsEditor";

/** Saves the French / Arabic / Spanish name and description of one category. */
export async function saveCategoryTranslations(
  id: string,
  translations: TranslationsValue
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") return { ok: false, error: "Unauthorized" };

  const cleaned = cleanTranslations(translations);
  try {
    await db.category.update({
      where: { id },
      data: { translations: cleaned ? (cleaned as Prisma.InputJsonValue) : Prisma.DbNull },
    });
  } catch {
    return { ok: false, error: "Could not save" };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}
