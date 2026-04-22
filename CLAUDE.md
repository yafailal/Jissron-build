# JissrON — Project Instructions

You are building **JissrON**, a full-stack Learning Management System (LMS) with three offerings: on-demand courses, live sessions, and 1-on-1 consultations.

## Architecture decisions (already made)

- **Framework**: Next.js 15 (App Router, TypeScript, Server Actions)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Database**: PostgreSQL via Prisma ORM
- **Auth**: NextAuth.js (email + Google OAuth to start)
- **File uploads**: UploadThing or a Supabase-compatible setup
- **Payments**: Stripe (test mode initially)
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

1. **Match the design reference exactly.** `reference/homepage-reference.html` is the source of truth for the homepage visual design. Use the same colors, typography (Montserrat), layout, and spacing. Rebuild it as proper Next.js components — don't copy HTML wholesale.

2. **Every piece of content on the public site must be editable from the admin panel.** No hardcoded text, no hardcoded colors, no hardcoded logos. Everything flows from the database.

3. **Role-based access control** is required:
   - `STUDENT` — default role; can enroll, watch, book
   - `INSTRUCTOR` — can create/edit their own courses
   - `ADMIN` — can edit everything including site settings

4. **Follow the design system** in `docs/02-design-system.md` strictly. Don't invent new colors or fonts.

5. **When in doubt, ask me first.** Don't install random libraries or change architecture without a short confirmation.

## Workflow I prefer

- Work one phase at a time (see `docs/05-first-prompts.md`)
- After each phase, stop and show me what's done before moving on
- Commit to git after every working feature
- Write tests only when I ask — ship fast first, harden later

## Brand colors (quick reference — full system in docs/02-design-system.md)

- Primary: `#003d80` (deep Atlas Blue)
- Primary hover: `#0058b8`
- Primary accent: `#0071e3`
- Ink (text): `#081a36`
- No yellow/amber anywhere. Mono-blue brand.

## Typography

- Font family: **Montserrat** (400, 500, 600, 700, 800)
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
