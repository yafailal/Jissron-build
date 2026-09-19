/**
 * Sample live sessions + consultants only. Idempotent (upserts by slug / email) and touches
 * nothing else — unlike prisma/seed.ts, which also rewrites SiteSettings and creates course modules.
 * Run: pnpm exec tsx prisma/seed-offerings.ts   (with DATABASE_URL in the environment)
 * All sample users use @ailearn.dev emails so they are easy to find and delete.
 */
import { PrismaClient, Role, LiveSessionKind, LiveSessionStatus } from "@prisma/client";

const db = new PrismaClient();
const dayMs = 24 * 60 * 60 * 1000;

const people = [
  { email: "amina.benali@ailearn.dev", name: "Amina Benali" },
  { email: "youssef.alaoui@ailearn.dev", name: "Youssef Alaoui" },
  { email: "sara.idrissi@ailearn.dev", name: "Sara Idrissi" },
];

const consultants = [
  {
    email: "amina.benali@ailearn.dev",
    tagline: "Product strategy coach",
    bio: "Helps product managers sharpen roadmaps, prioritisation and stakeholder communication. Best for PMs preparing for a senior role or a new product launch.",
    skills: ["Product Strategy", "Roadmapping", "Career"],
    mad: 150000, usd: 15000, rating: 4.9, sessions: 120, featured: true,
    availability: [
      { day: "mon", slots: ["09:00", "11:00", "14:00"] },
      { day: "wed", slots: ["10:00", "15:00"] },
    ],
  },
  {
    email: "youssef.alaoui@ailearn.dev",
    tagline: "Machine learning engineer",
    bio: "Practical guidance on data pipelines, model evaluation and putting ML into production. Bring a real problem and leave with a concrete plan.",
    skills: ["Machine Learning", "MLOps", "Data Pipelines"],
    mad: 200000, usd: 20000, rating: 4.8, sessions: 86, featured: true,
    availability: [
      { day: "tue", slots: ["11:00", "14:00"] },
      { day: "thu", slots: ["10:00", "15:00", "17:00"] },
    ],
  },
  {
    email: "sara.idrissi@ailearn.dev",
    tagline: "Design systems lead",
    bio: "Design critiques, portfolio reviews and design-system architecture for designers moving into senior and lead roles.",
    skills: ["Design Systems", "Figma", "Portfolio"],
    mad: 120000, usd: 12000, rating: 4.7, sessions: 64, featured: false,
    availability: [
      { day: "mon", slots: ["14:00", "16:00"] },
      { day: "fri", slots: ["11:00"] },
    ],
  },
];

const sessions = [
  {
    slug: "intro-to-ai-tools-for-work", title: "Intro to AI tools for everyday work",
    description: "A live walkthrough of the AI tools that save the most time at work, with real examples and Q&A. No technical background needed.",
    kind: LiveSessionKind.AMA, inDays: 3, durationMins: 60, seats: 100, mad: 0, usd: 0, free: true, host: "youssef.alaoui@ailearn.dev",
  },
  {
    slug: "build-a-product-roadmap", title: "Build a product roadmap that gets buy-in",
    description: "Hands-on workshop: turn a messy backlog into a clear roadmap and learn how to present it to stakeholders.",
    kind: LiveSessionKind.WORKSHOP, inDays: 6, durationMins: 120, seats: 40, mad: 29900, usd: 2999, free: false, host: "amina.benali@ailearn.dev",
  },
  {
    slug: "design-systems-in-practice", title: "Design systems in practice",
    description: "How to start, grow and govern a design system — with examples of what works and what quietly fails.",
    kind: LiveSessionKind.SEMINAR, inDays: 9, durationMins: 75, seats: 30, mad: 19900, usd: 1999, free: false, host: "sara.idrissi@ailearn.dev",
  },
];

async function main() {
  const ids: Record<string, string> = {};
  for (const p of people) {
    const u = await db.user.upsert({
      where: { email: p.email },
      create: { email: p.email, name: p.name, role: Role.INSTRUCTOR, emailVerified: new Date() },
      update: {},
    });
    ids[p.email] = u.id;
  }

  for (const c of consultants) {
    const userId = ids[c.email];
    await db.consultant.upsert({
      where: { userId },
      create: {
        userId, tagline: c.tagline, bio: c.bio, skills: c.skills, durationMins: 30,
        ratePerSession: c.usd, ratePerSessionMadCents: c.mad, ratePerSessionUsdCents: c.usd,
        avgRating: c.rating, totalSessions: c.sessions, isFeatured: c.featured, acceptsNew: true,
        avatarGradient: "linear-gradient(135deg, #064e3b, #0e7a5a)", availability: c.availability,
      },
      update: {},
    });
  }

  const now = Date.now();
  for (const s of sessions) {
    const startsAt = new Date(now + s.inDays * dayMs);
    startsAt.setUTCHours(15, 0, 0, 0);
    await db.liveSession.upsert({
      where: { slug: s.slug },
      create: {
        slug: s.slug, title: s.title, description: s.description, kind: s.kind,
        status: LiveSessionStatus.SCHEDULED, startsAt, durationMins: s.durationMins, seatsTotal: s.seats,
        priceCents: s.usd, priceMadCents: s.mad, priceUsdCents: s.usd, isFree: s.free, isFeatured: false,
        hostId: ids[s.host],
      },
      update: {},
    });
  }
  console.log(`✓ ${consultants.length} consultants, ${sessions.length} live sessions`);
}

main().finally(() => db.$disconnect());
