/**
 * 15 dummy PUBLISHED courses so the homepage shop can be judged with a full grid.
 * Idempotent (upserts by slug). Every slug starts with "demo-" — remove them with:
 *   pnpm exec tsx prisma/seed-demo-courses.ts --delete
 * Run: pnpm exec tsx prisma/seed-demo-courses.ts   (DATABASE_URL in the environment)
 */
import { PrismaClient, CourseLevel } from "@prisma/client";

const db = new PrismaClient();

const instructors = ["amina.benali@ailearn.dev", "youssef.alaoui@ailearn.dev", "sara.idrissi@ailearn.dev"];
const levels: CourseLevel[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "ALL_LEVELS"];

// [title, category slug, price MAD (0 = free), old price MAD | null, badge | null]
const rows: [string, string, number, number | null, string | null][] = [
  ["Prompt Engineering for Everyone", "ai-tools", 49900, 79900, "Bestseller"],
  ["Machine Learning Foundations", "ai-ml", 89900, 129900, null],
  ["Python for Absolute Beginners", "programming", 0, null, "Free"],
  ["Product Roadmapping Masterclass", "product-strategy", 69900, null, null],
  ["UI Design Systems in Practice", "design", 59900, 89900, "New"],
  ["Data Analysis with SQL", "data-science", 44900, null, null],
  ["Digital Marketing Essentials", "marketing", 39900, 59900, null],
  ["Building a Startup from Zero", "business", 79900, null, "Bestseller"],
  ["Confident Public Speaking", "communication", 29900, null, null],
  ["Automate Work with AI Agents", "ai-tools", 64900, 99900, "New"],
  ["Deep Learning with PyTorch", "ai-ml", 109900, null, null],
  ["Full-Stack Web with Next.js", "programming", 94900, 139900, "Bestseller"],
  ["Software Architecture Basics", "engineering", 74900, null, null],
  ["Data Storytelling & Dashboards", "data-science", 0, null, "Free"],
  ["Brand & Growth Strategy", "marketing", 54900, null, null],
];

const slugify = (t: string) => "demo-" + t.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

async function main() {
  if (process.argv.includes("--delete")) {
    const r = await db.course.deleteMany({ where: { slug: { startsWith: "demo-" } } });
    console.log(`Deleted ${r.count} demo courses`);
    return;
  }
  const users = await db.user.findMany({ where: { email: { in: instructors } } });
  const cats = await db.category.findMany();
  if (!users.length) throw new Error("No sample instructors — run prisma/seed-offerings.ts first");

  for (const [i, [title, catSlug, mad, oldMad, badge]] of rows.entries()) {
    const category = cats.find((c) => c.slug === catSlug);
    if (!category) throw new Error(`Missing category ${catSlug}`);
    const data = {
      title,
      subtitle: "Sample course for previewing the catalog layout.",
      description: "Demo course created to preview the homepage. Safe to delete.",
      level: levels[i % levels.length],
      status: "PUBLISHED" as const,
      priceMadCents: mad,
      priceUsdCents: Math.round(mad / 10),
      oldPriceMadCents: oldMad,
      oldPriceUsdCents: oldMad ? Math.round(oldMad / 10) : null,
      priceCents: mad,
      oldPriceCents: oldMad,
      durationMinutes: 120 + i * 25,
      badge,
      isBestseller: badge === "Bestseller",
      isFeatured: i < 3,
      categoryId: category.id,
      instructorId: users[i % users.length].id,
    };
    await db.course.upsert({ where: { slug: slugify(title) }, update: data, create: { slug: slugify(title), ...data } });
  }
  console.log(`Upserted ${rows.length} demo courses`);
}

main().finally(() => db.$disconnect());
