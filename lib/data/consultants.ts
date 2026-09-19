import { db } from "@/lib/db";
import { cache } from "react";

export const getAllConsultants = cache(async () => {
  return db.consultant.findMany({
    include: { user: true },
    orderBy: [{ isFeatured: "desc" }, { avgRating: "desc" }],
  });
});

export const getConsultantByUserId = cache(async (userId: string) => {
  return db.consultant.findUnique({
    where: { userId },
    include: { user: true },
  });
});
