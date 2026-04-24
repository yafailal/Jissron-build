import { db } from "@/lib/db";

export async function nextOrderReference(): Promise<string> {
  const counter = await db.$transaction(async (tx) => {
    const updated = await tx.counter.upsert({
      where: { id: "order_reference" },
      create: { id: "order_reference", value: 1 },
      update: { value: { increment: 1 } },
    });
    return updated;
  });

  return "JIS-" + String(counter.value).padStart(6, "0");
}
