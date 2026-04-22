# 03 — Data Model

Everything the public site displays must be driven by the database. Below is the full schema.

Implement this as `prisma/schema.prisma`.

## Core principle

There are two categories of editable content:

1. **Site settings** — one-off fields (hero text, logo URL, brand colors, footer, SEO defaults). Stored in a `SiteSettings` singleton table with a fixed `id = "default"`.
2. **Collections** — repeating entities (courses, live sessions, consultants, instructors, categories, FAQs, testimonials). Stored in their own tables.

## Prisma schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============== AUTH & USERS ==============

enum Role {
  STUDENT
  INSTRUCTOR
  ADMIN
}

model User {
  id              String    @id @default(cuid())
  email           String    @unique
  emailVerified   DateTime?
  name            String?
  image           String?
  role            Role      @default(STUDENT)
  bio             String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  accounts        Account[]
  sessions        Session[]

  // as instructor
  coursesTeaching Course[]
  liveSessions    LiveSession[]
  consultant      Consultant?

  // as student
  enrollments     Enrollment[]
  bookings        Booking[]
  consultBookings ConsultBooking[]
  reviews         Review[]
}

model Account {
  // standard NextAuth fields
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  @@unique([identifier, token])
}

// ============== SITE SETTINGS (singleton) ==============

model SiteSettings {
  id                    String   @id @default("default")

  // Brand
  siteName              String   @default("JissrON")
  tagline               String   @default("Learning Management System | EdTech Platform")
  logoUrl               String?
  logoDarkUrl           String?
  faviconUrl            String?

  // Colors (stored as hex, admin can override)
  colorPrimary          String   @default("#003d80")
  colorPrimaryHover     String   @default("#0058b8")
  colorPrimaryBright    String   @default("#0071e3")
  colorInk              String   @default("#081a36")

  // Hero section
  heroKicker            String   @default("12,482 learners joined this week")
  heroTitleLine1        String   @default("Learn anything.")
  heroTitleLine2        String   @default("Live, on-demand,")
  heroTitleLine3        String   @default("or one-on-one.")
  heroSubtitle          String   @default("Master new skills with 1,200+ expert-led courses, weekly live sessions, and private mentorship.")
  heroSearchPlaceholder String   @default("What do you want to learn today?")
  heroPopularTerms      Json     @default("[\"Python\", \"Excel\", \"ChatGPT\", \"Design\", \"Data Analytics\"]")

  // Urgency banner
  urgencyEnabled        Boolean  @default(true)
  urgencyTag            String   @default("FLASH SALE")
  urgencyMessage        String   @default("Courses from $9.99")
  urgencyEndsAt         DateTime?
  urgencyCtaLabel       String   @default("Shop now →")
  urgencyCtaUrl         String   @default("#")

  // Trust strip (partner logos)
  trustStripLabel       String   @default("Trusted by learners at the world's leading companies")
  trustStripLogos       Json     @default("[]") // [{name, logoUrl}]

  // Mid-CTA banner
  midCtaTitle           String   @default("Unlock every course with JissrON Plus")
  midCtaDescription     String   @default("Get unlimited access to all courses, live sessions, and priority booking.")
  midCtaPrimaryLabel    String   @default("Start 7-day free trial")
  midCtaPrimaryUrl      String   @default("/pricing")
  midCtaSecondaryLabel  String   @default("See plans & pricing")
  midCtaSecondaryUrl    String   @default("/pricing")
  midCtaStats           Json     @default("[]") // [{number, label}]

  // Final CTA
  finalCtaTitle         String   @default("Start learning for free today")
  finalCtaDescription   String   @default("Join 2.4M learners growing their skills.")

  // Footer
  footerColumns         Json     @default("[]") // [{heading, links: [{label, url}]}]
  footerSocial          Json     @default("[]") // [{platform, url}]
  footerCopyright       String   @default("© JissrON Inc.")

  // Global SEO defaults
  seoTitle              String   @default("JissrON — Learning Management System")
  seoDescription        String?
  seoOgImageUrl         String?

  // Legal / compliance
  cookieConsentEnabled  Boolean  @default(true)

  // System
  updatedAt             DateTime @updatedAt
  updatedBy             String?
}

// ============== COURSES ==============

enum CourseLevel {
  BEGINNER
  INTERMEDIATE
  ADVANCED
  ALL_LEVELS
}

enum CourseStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

model Category {
  id          String   @id @default(cuid())
  slug        String   @unique
  name        String
  description String?
  iconUrl     String?
  order       Int      @default(0)
  courses     Course[]
  createdAt   DateTime @default(now())
}

model Course {
  id              String        @id @default(cuid())
  slug            String        @unique
  title           String
  subtitle        String?
  description     String        @db.Text // Markdown or HTML
  thumbnailUrl    String?
  previewVideoUrl String?
  level           CourseLevel   @default(BEGINNER)
  status          CourseStatus  @default(DRAFT)
  priceCents      Int           @default(0)
  oldPriceCents   Int?
  durationMinutes Int           @default(0)
  language        String        @default("en")

  badge           String?       // "BESTSELLER", "NEW", "HOT"
  isBestseller    Boolean       @default(false)
  isFeatured      Boolean       @default(false)

  categoryId      String
  category        Category      @relation(fields: [categoryId], references: [id])

  instructorId    String
  instructor      User          @relation(fields: [instructorId], references: [id])

  modules         Module[]
  enrollments     Enrollment[]
  reviews         Review[]

  // SEO per course
  seoTitle        String?
  seoDescription  String?

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  publishedAt     DateTime?
}

model Module {
  id        String   @id @default(cuid())
  courseId  String
  title     String
  order     Int
  course    Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  lessons   Lesson[]
}

model Lesson {
  id              String   @id @default(cuid())
  moduleId        String
  title           String
  videoUrl        String?
  durationSeconds Int      @default(0)
  order           Int
  isPreview       Boolean  @default(false)
  transcript      String?  @db.Text
  module          Module   @relation(fields: [moduleId], references: [id], onDelete: Cascade)
  progress        LessonProgress[]
}

model Enrollment {
  id          String   @id @default(cuid())
  userId      String
  courseId    String
  progressPct Int      @default(0)
  completedAt DateTime?
  createdAt   DateTime @default(now())
  user        User     @relation(fields: [userId], references: [id])
  course      Course   @relation(fields: [courseId], references: [id])
  progress    LessonProgress[]
  @@unique([userId, courseId])
}

model LessonProgress {
  id           String   @id @default(cuid())
  enrollmentId String
  lessonId     String
  watchedSecs  Int      @default(0)
  completed    Boolean  @default(false)
  updatedAt    DateTime @updatedAt
  enrollment   Enrollment @relation(fields: [enrollmentId], references: [id], onDelete: Cascade)
  lesson       Lesson     @relation(fields: [lessonId], references: [id])
  @@unique([enrollmentId, lessonId])
}

model Review {
  id        String   @id @default(cuid())
  userId    String
  courseId  String
  rating    Int      // 1-5
  comment   String?  @db.Text
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
  course    Course   @relation(fields: [courseId], references: [id])
  @@unique([userId, courseId])
}

// ============== LIVE SESSIONS ==============

enum LiveSessionKind {
  AMA
  WORKSHOP
  SEMINAR
  COHORT
}

enum LiveSessionStatus {
  SCHEDULED
  LIVE
  ENDED
  CANCELLED
}

model LiveSession {
  id             String            @id @default(cuid())
  slug           String            @unique
  title          String
  description    String            @db.Text
  kind           LiveSessionKind
  status         LiveSessionStatus @default(SCHEDULED)
  startsAt       DateTime
  durationMins   Int               @default(60)
  seatsTotal     Int               @default(50)
  priceCents     Int               @default(0)
  meetingUrl     String?
  isFree         Boolean           @default(false)
  isFeatured     Boolean           @default(false)

  hostId         String
  host           User              @relation(fields: [hostId], references: [id])

  bookings       Booking[]
  createdAt      DateTime          @default(now())
  updatedAt      DateTime          @updatedAt
}

model Booking {
  id             String      @id @default(cuid())
  userId         String
  liveSessionId  String
  status         String      @default("CONFIRMED")
  createdAt      DateTime    @default(now())
  user           User        @relation(fields: [userId], references: [id])
  liveSession    LiveSession @relation(fields: [liveSessionId], references: [id])
  @@unique([userId, liveSessionId])
}

// ============== CONSULTANTS & 1:1 ==============

model Consultant {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id])

  tagline         String?
  bio             String   @db.Text
  ratePerSession  Int      // price in cents for 30 min
  durationMins    Int      @default(30)
  skills          String[] // array of tag strings
  avatarGradient  String?  // CSS gradient string for placeholder avatar
  availability    Json     @default("[]") // [{day: "mon", slots: ["09:00", ...]}]
  totalSessions   Int      @default(0)
  avgRating       Float    @default(0)
  isFeatured      Boolean  @default(false)
  acceptsNew      Boolean  @default(true)

  bookings        ConsultBooking[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model ConsultBooking {
  id           String     @id @default(cuid())
  studentId    String
  consultantId String
  scheduledFor DateTime
  durationMins Int        @default(30)
  status       String     @default("CONFIRMED") // CONFIRMED, CANCELLED, COMPLETED, NO_SHOW
  notes        String?    @db.Text
  student      User       @relation(fields: [studentId], references: [id])
  consultant   Consultant @relation(fields: [consultantId], references: [id])
  createdAt    DateTime   @default(now())
}

// ============== CMS / CONTENT PAGES ==============

model Page {
  id              String   @id @default(cuid())
  slug            String   @unique
  title           String
  content         String   @db.Text // Markdown or rich JSON
  metaTitle       String?
  metaDescription String?
  published       Boolean  @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model FAQ {
  id        String   @id @default(cuid())
  question  String
  answer    String   @db.Text
  category  String   @default("general")
  order     Int      @default(0)
  published Boolean  @default(true)
}

// ============== ACTIVITY LOG (audit) ==============

model ActivityLog {
  id        String   @id @default(cuid())
  userId    String?
  action    String   // e.g. "COURSE_UPDATED"
  entity    String   // e.g. "Course"
  entityId  String?
  metadata  Json?
  createdAt DateTime @default(now())
  @@index([userId, createdAt])
  @@index([entity, entityId])
}
```

## Seed data

After running `npx prisma db push`, seed the database with:

- 1 `SiteSettings` row (the defaults above are fine)
- 8 sample `Course` records matching the reference design (titles and details pulled from the HTML reference)
- 4 sample `LiveSession` records
- 3 sample `Consultant` records (plus their `User` records)
- Categories: Design, AI & ML, Business, Product, Engineering, Marketing, Data Science, Programming, AI Tools

Create a `prisma/seed.ts` file and wire it into `package.json`:

```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

## Environment variables needed

```env
DATABASE_URL=
NEXTAUTH_URL=
NEXTAUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
UPLOADTHING_SECRET=
UPLOADTHING_APP_ID=
RESEND_API_KEY=
```
