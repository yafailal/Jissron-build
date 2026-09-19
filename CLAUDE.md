# AILearn — Project Instructions

You are building **AILearn**, a full-stack Learning Management System (LMS) with three offerings: on-demand courses, live sessions, and 1-on-1 consultations.

## Architecture decisions (already made)

- **Framework**: Next.js 15 (App Router, TypeScript, Server Actions)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Database**: PostgreSQL via Prisma ORM
- **Auth**: NextAuth.js (email + Google OAuth to start)
- **File uploads**: UploadThing or a Supabase-compatible setup
- **Payments**: Bank transfer (MAD, manual admin confirmation), CMI (MAD card payments) and Stripe (USD card payments). Lemon Squeezy was removed (2026-09-19).
- **Hosting target**: Vercel for the app, Supabase or Neon for the database
- **Package manager**: pnpm

## Project structure

```
/
├── app/
│   ├── (marketing)/           ← public homepage and public pages
│   ├── (dashboard)/           ← student dashboard (logged in)
│   ├── (admin)/               ← admin panel (admin role only)
│   ├── api/
│   └── auth/
├── components/
│   ├── ui/                    ← shadcn primitives
│   ├── marketing/             ← homepage sections (Hero, Courses, Live, etc.)
│   ├── dashboard/             ← student-facing components
│   └── admin/                 ← admin-facing components
├── lib/
│   ├── db.ts                  ← Prisma client
│   ├── auth.ts                ← NextAuth config
│   └── utils.ts
├── prisma/
│   └── schema.prisma
└── docs/                      ← keep a copy of our spec docs here
```

## Critical rules

1. **The homepage is catalog-first, not a marketing hero (2026-09-19).** It opens with a slim search strip (one line, search box, category chips), then "Continue learning" for logged-in learners, then horizontal course rows (Featured, New, Free, one per category), then live sessions and consultants. `reference/homepage-reference.html` predates this and the rebrand — its hero layout, colors and typography are stale; don't follow it. For colors and type follow `docs/02-design-system.md` (Deep Green + Emerald, Inter). Rebuild as proper Next.js components — don't copy HTML wholesale.

2. **Every piece of content on the public site must be editable from the admin panel.** No hardcoded text, no hardcoded colors, no hardcoded logos. Everything flows from the database.

3. **Role-based access control** is required:
   - `STUDENT` — default role; can enroll, watch, book
   - `INSTRUCTOR` — can create/edit their own courses
   - `ADMIN` — can edit everything including site settings

4. **Follow the design system** in `docs/02-design-system.md` strictly. Don't invent new colors or fonts.

5. **When in doubt, ask me first.** Don't install random libraries or change architecture without a short confirmation.

6. **Stay in scope. Don't make silent architectural or scoping decisions.**
   - If I give you a specific instruction (a schema change, a library choice, a feature to include), follow it exactly. Do not substitute your own judgment for mine without asking first.
   - If my instruction seems technically suboptimal or you see a better approach, PAUSE and ASK before changing direction. Phrase it as: "You asked for X. I'd recommend Y instead because [reason]. Shall I proceed with X as specified, or switch to Y?"
   - If a spec from docs/*.md conflicts with something you think is cleaner, follow the spec. Raise the concern after — don't just quietly deviate.
   - "I skipped this because it seemed unnecessary" is NOT acceptable. Either do it, or explicitly flag that you're not doing it and why, and wait for my go-ahead.
   - Examples of things to ALWAYS confirm before deviating from:
     - Database schema changes (adding/skipping tables, renaming fields, changing types)
     - Library substitutions (swapping auth providers, ORMs, UI libraries)
     - Feature scoping (deferring or skipping functionality spec'd for the current phase)
     - File/folder structure changes that diverge from what's in docs/
     - Changing which phase something belongs to
     - Copy changes that replace specified brand voice, hero text, taglines, or SEO metadata — treat copy the same as code
   - If unsure whether something counts as "in scope" — ask.

## Workflow I prefer

- Work one phase at a time (see `docs/05-first-prompts.md`)
- After each phase, stop and show me what's done before moving on
- Commit to git after every working feature
- Write tests only when I ask — ship fast first, harden later

## Brand colors (quick reference — full system in docs/02-design-system.md)

Rebranded 2026-09-19 from the old mono-blue AILearn identity to the AILearn brand kit (Deep Green + Emerald).

- Primary: `#064e3b` (Deep Green, kit "emerald" version — the lime version was discarded)
- Primary hover: `#0b6b53` (derived — not an explicit kit value)
- Primary accent: `#10b981` (Emerald)
- Primary mid: `#0e7a5a` (headline accent, e.g. "New Generation" in the hero)
- Ink (text): `#064e3b`
- Colors come only from this palette. Don't invent new ones.
- Buttons are pill-shaped (`rounded-full`), per the brand kit.
- Logo: `public/logo.png` (horizontal wordmark), `public/logo-icon.png` (mark only), `app/icon.png` (favicon). The nav reads it from `SiteSettings.logoUrl` (admin → Site). No light/reversed variant exists yet, so dark backgrounds (footer, admin sidebar) use text.

## Typography

- Font family: **Inter** (400, 500, 600, 700, 800) — replaced Montserrat as of the 2026-09-19 rebrand
- Use Google Fonts via `next/font`

## The three offerings

1. **Courses** — self-paced, video lessons, modules, quizzes, certificates
2. **Live sessions** — scheduled Zoom/Meet sessions with seat limits
3. **Consults** — 1-on-1 bookable 30-min calls with experts

Each offering has its own:
- Admin CRUD interface
- Public browse/detail pages
- Student enrollment/booking flow
- Instructor/consultant management tools
