import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { withLocale } from "@/lib/localize";

// Shared by every page layout (menu categories + featured course links). Same data for all
// visitors, so it is cached across requests for a minute instead of hitting the database on every page view.

const getNavCategoriesRaw = unstable_cache(
  async () =>
    db.category.findMany({
      orderBy: { order: "asc" },
      select: { id: true, name: true, slug: true, translations: true },
      take: 10,
    }),
  ["nav-categories"],
  { revalidate: 60, tags: ["courses"] }
);

const getNavFeaturedCoursesRaw = unstable_cache(
  async () =>
    db.course.findMany({
      where: { status: "PUBLISHED", OR: [{ isFeatured: true }, { isBestseller: true }] },
      orderBy: [{ isFeatured: "desc" }, { isBestseller: "desc" }, { createdAt: "desc" }],
      select: { id: true, title: true, slug: true, translations: true },
      take: 6,
    }),
  ["nav-featured-courses"],
  { revalidate: 60, tags: ["courses"] }
);

export const getNavCategories = withLocale(getNavCategoriesRaw);
export const getNavFeaturedCourses = withLocale(getNavFeaturedCoursesRaw);
