/**
 * prisma/seed.ts
 * Seeds the database with initial data matching homepage-reference.html.
 * Run with: pnpm prisma db seed
 */

import { PrismaClient, Role, CourseLevel, CourseStatus, LiveSessionKind, LiveSessionStatus, LessonType, OrderStatus, PaymentMethod } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Seeding JissrON database…");

  // ===================================================
  // 1. SITE SETTINGS (singleton)
  // ===================================================
  await db.siteSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      defaultCurrency: "MAD",
      siteName: "JissrON",
      tagline: "Learning Management System | EdTech Platform",

      colorPrimary: "#003d80",
      colorPrimaryHover: "#0058b8",
      colorPrimaryBright: "#0071e3",
      colorInk: "#081a36",

      navLinks: [
        { label: "For Business", url: "/business" },
        { label: "Teach on JissrON", url: "/teach" },
      ],

      heroKicker: "12,482 learners joined this week",
      heroTitleLine1: "Learn anything.",
      heroTitleLine2: "Live, on-demand,",
      heroTitleLine3: "or one-on-one.",
      heroSubtitle:
        "Master new skills with 1,200+ expert-led courses, weekly live sessions, and private mentorship from practitioners at top companies.",
      heroSearchPlaceholder: "What do you want to learn today?",
      heroPopularTerms: ["Python", "Excel", "ChatGPT", "Design", "Data Analytics"],
      heroTrustBullets: ["30-day money-back", "Certificates of completion", "Learn at your own pace"],

      urgencyEnabled: true,
      urgencyTag: "FLASH SALE",
      urgencyMessage: "Courses from $9.99",
      urgencyCtaLabel: "Shop now →",
      urgencyCtaUrl: "/courses",

      trustStripLabel: "Trusted by learners at the world's leading companies",
      trustStripLogos: [
        { name: "Google" },
        { name: "Meta" },
        { name: "Stanford" },
        { name: "Figma" },
        { name: "Stripe" },
        { name: "Netflix" },
        { name: "MIT" },
      ],

      midCtaTitle: "Unlock every course with JissrON Plus",
      midCtaDescription:
        "Get unlimited access to all 1,200+ courses, live sessions, and priority booking for consults. Start your 7-day free trial today.",
      midCtaPrimaryLabel: "Start 7-day free trial",
      midCtaPrimaryUrl: "/pricing",
      midCtaSecondaryLabel: "See plans & pricing",
      midCtaSecondaryUrl: "/pricing",
      midCtaStats: [
        { number: "2.4M", label: "Active learners" },
        { number: "184", label: "Expert instructors" },
        { number: "4.9★", label: "180k+ reviews" },
        { number: "140+", label: "Countries" },
      ],

      finalCtaTitle: "Start learning for free today",
      finalCtaDescription: "Join 2.4M learners growing their skills.",
      finalCtaCtaLabel: "Get started free",
      finalCtaCtaUrl: "/signup",

      footerColumns: [
        {
          heading: "Offerings",
          links: [
            { label: "On-Demand Courses", url: "/courses" },
            { label: "Live Sessions", url: "/live" },
            { label: "1-on-1 Consults", url: "/consults" },
            { label: "JissrON Plus", url: "/pricing" },
          ],
        },
        {
          heading: "Company",
          links: [
            { label: "About", url: "/about" },
            { label: "Careers", url: "/careers" },
            { label: "Blog", url: "/blog" },
            { label: "Press", url: "/press" },
          ],
        },
        {
          heading: "Teach",
          links: [
            { label: "Become an Instructor", url: "/teach" },
            { label: "Instructor Hub", url: "/instructor" },
            { label: "Become a Consultant", url: "/consult/apply" },
          ],
        },
        {
          heading: "Support",
          links: [
            { label: "Help Center", url: "/help" },
            { label: "Contact Us", url: "/contact" },
            { label: "Privacy Policy", url: "/privacy" },
            { label: "Terms of Service", url: "/terms" },
          ],
        },
      ],
      footerSocial: [
        { platform: "twitter", url: "https://twitter.com/jissron" },
        { platform: "linkedin", url: "https://linkedin.com/company/jissron" },
        { platform: "youtube", url: "https://youtube.com/@jissron" },
        { platform: "instagram", url: "https://instagram.com/jissron" },
      ],
      footerCopyright: `© ${new Date().getFullYear()} JissrON Inc. All rights reserved.`,

      seoTitle: "JissrON — Learning Management System | EdTech Platform",
      seoDescription:
        "Master new skills with 1,200+ expert-led courses, weekly live sessions, and private mentorship.",

      cookieConsentEnabled: true,

      // Bank details are configured via admin UI, never seeded
      bankName: "",
      bankAccountName: "",
      bankIBAN: "",
      bankRIB: "",
      bankSwift: "",
      bankInstructions: "",
    },
    update: {}, // keep existing settings if already seeded
  });

  console.log("  ✓ SiteSettings");

  // ===================================================
  // Counter — order reference sequence
  // ===================================================
  await db.counter.upsert({
    where: { id: "order_reference" },
    create: { id: "order_reference", value: 0 },
    update: {}, // never reset an existing counter
  });

  console.log("  ✓ Counter (order_reference)");

  // ===================================================
  // 2. CATEGORIES
  // ===================================================
  const categoryData = [
    { slug: "product-strategy", name: "Product Strategy", order: 1 },
    { slug: "design", name: "Design", order: 2 },
    { slug: "ai-ml", name: "AI & Machine Learning", order: 3 },
    { slug: "programming", name: "Programming", order: 4 },
    { slug: "data-science", name: "Data Science", order: 5 },
    { slug: "marketing", name: "Marketing", order: 6 },
    { slug: "business", name: "Business", order: 7 },
    { slug: "communication", name: "Communication", order: 8 },
    { slug: "ai-tools", name: "AI Tools", order: 9 },
    { slug: "engineering", name: "Engineering", order: 10 },
  ];

  const categories: Record<string, string> = {};
  for (const cat of categoryData) {
    const record = await db.category.upsert({
      where: { slug: cat.slug },
      create: cat,
      update: { name: cat.name },
    });
    categories[cat.slug] = record.id;
  }

  console.log(`  ✓ ${categoryData.length} categories`);

  // ===================================================
  // 3. INSTRUCTOR USERS (seeded with INSTRUCTOR role)
  // ===================================================
  const instructorData = [
    {
      email: "maya@jissron.dev",
      name: "Maya Okonkwo",
      role: Role.INSTRUCTOR,
      bio: "Senior PM at Stripe. Helped 40+ PMs transition into senior roles. Specializes in product strategy, roadmapping, and stakeholder management at scale.",
    },
    {
      email: "priya@jissron.dev",
      name: "Priya Raman",
      role: Role.INSTRUCTOR,
      bio: "ML Engineer · ex-OpenAI. Shipping production ML since 2018. Best for teams stuck on data pipelines, evaluation, model selection, or fine-tuning strategy.",
    },
    {
      email: "aisha@jissron.dev",
      name: "Aisha Nakamura",
      role: Role.INSTRUCTOR,
      bio: "Harvard Negotiation Project researcher. Specializes in communication strategies for introverts and quiet professionals in high-stakes environments.",
    },
    {
      email: "diego@jissron.dev",
      name: "Diego Vargas",
      role: Role.INSTRUCTOR,
      bio: "ex-Figma Senior Designer. Design systems lead with 10+ years experience scaling design at category-defining companies.",
    },
    {
      email: "chen@jissron.dev",
      name: "Chen Wei",
      role: Role.INSTRUCTOR,
      bio: "Data Scientist with expertise in business intelligence, analytics engineering, and translating data into executive decisions.",
    },
    {
      email: "marcus@jissron.dev",
      name: "Marcus Johnson",
      role: Role.INSTRUCTOR,
      bio: "Full-stack Python developer and educator. Created the most-enrolled Python bootcamp on JissrON with 24k+ students.",
    },
    {
      email: "elena@jissron.dev",
      name: "Elena Petrov",
      role: Role.INSTRUCTOR,
      bio: "AI researcher and prompt engineering specialist. Former NLP engineer helping teams integrate LLMs into production workflows.",
    },
    {
      email: "sofia@jissron.dev",
      name: "Sofia Ramirez",
      role: Role.INSTRUCTOR,
      bio: "Digital marketing consultant with 12 years experience across SEO, paid media, content, and conversion rate optimization.",
    },
  ];

  const instructors: Record<string, string> = {};
  for (const instr of instructorData) {
    const record = await db.user.upsert({
      where: { email: instr.email },
      create: instr,
      update: { name: instr.name },
    });
    instructors[instr.email] = record.id;
  }

  console.log(`  ✓ ${instructorData.length} instructor users`);

  // ===================================================
  // 4. COURSES (8 courses from reference design)
  // ===================================================
  const courseData = [
    {
      slug: "digital-transformation-intro-ai",
      title: "Digital Transformation | Introduction to AI",
      subtitle: "A practical guide for product managers and business leaders navigating the AI era",
      description:
        "Learn how AI is reshaping industries and how to lead digital transformation initiatives at your company. Covers AI strategy, implementation frameworks, stakeholder alignment, and real-world case studies from Stripe, Shopify, and more.",
      level: CourseLevel.INTERMEDIATE,
      status: CourseStatus.PUBLISHED,
      priceCents: 999,       priceMadCents: 9900,   priceUsdCents: 999,
      oldPriceCents: 8999,   oldPriceMadCents: 89900, oldPriceUsdCents: 8999,
      durationMinutes: 32 * 60,
      badge: "BESTSELLER",
      isBestseller: true,
      isFeatured: true,
      categorySlug: "product-strategy",
      instructorEmail: "maya@jissron.dev",
      publishedAt: new Date("2024-01-15"),
    },
    {
      slug: "marketing-analytics-python-business",
      title: "Marketing Analytics | Python for Business",
      subtitle: "Data-driven marketing decisions using Python, pandas, and real campaign data",
      description:
        "Master marketing analytics using Python. Build attribution models, analyze funnel performance, run A/B tests, and automate reporting. Uses real datasets from e-commerce and SaaS businesses.",
      level: CourseLevel.INTERMEDIATE,
      status: CourseStatus.PUBLISHED,
      priceCents: 1299,      priceMadCents: 12900,  priceUsdCents: 1299,
      oldPriceCents: 9499,   oldPriceMadCents: 94900, oldPriceUsdCents: 9499,
      durationMinutes: 28 * 60,
      badge: "NEW",
      isBestseller: false,
      isFeatured: true,
      categorySlug: "marketing",
      instructorEmail: "priya@jissron.dev",
      publishedAt: new Date("2024-03-01"),
    },
    {
      slug: "negotiation-skills-quiet-professionals",
      title: "Negotiation Skills for Quiet Professionals",
      subtitle: "How introverts close deals, earn raises, and lead rooms without performing",
      description:
        "A Harvard-backed negotiation framework designed for people who hate 'playing games'. Learn preparation tactics, silence strategies, written negotiation techniques, and how to anchor without aggression.",
      level: CourseLevel.ALL_LEVELS,
      status: CourseStatus.PUBLISHED,
      priceCents: 999,       priceMadCents: 9900,   priceUsdCents: 999,
      oldPriceCents: 7999,   oldPriceMadCents: 79900, oldPriceUsdCents: 7999,
      durationMinutes: 18 * 60,
      badge: "BESTSELLER",
      isBestseller: true,
      isFeatured: true,
      categorySlug: "communication",
      instructorEmail: "aisha@jissron.dev",
      publishedAt: new Date("2023-09-10"),
    },
    {
      slug: "advanced-design-systems-at-scale",
      title: "Advanced Design Systems at Scale",
      subtitle: "Build, document, and govern design systems used by teams of 10 to 1,000",
      description:
        "Go beyond component libraries. Learn how to architect tokens, governance workflows, versioning strategy, and cross-platform implementation. Includes the Figma system Diego built at scale.",
      level: CourseLevel.ADVANCED,
      status: CourseStatus.PUBLISHED,
      priceCents: 1199,      priceMadCents: 11900,  priceUsdCents: 1199,
      oldPriceCents: 9999,   oldPriceMadCents: 99900, oldPriceUsdCents: 9999,
      durationMinutes: 24 * 60,
      badge: "BESTSELLER",
      isBestseller: true,
      isFeatured: false,
      categorySlug: "design",
      instructorEmail: "diego@jissron.dev",
      publishedAt: new Date("2023-11-20"),
    },
    {
      slug: "data-analytics-business-intelligence",
      title: "Data Analytics & Business Intelligence",
      subtitle: "From raw data to executive dashboards — complete BI engineering workflow",
      description:
        "Learn the modern BI stack: SQL, dbt, Looker/Metabase, and Python. Build a complete analytics pipeline from raw events to polished executive dashboards. Covers data modeling, metrics definition, and self-serve analytics culture.",
      level: CourseLevel.BEGINNER,
      status: CourseStatus.PUBLISHED,
      priceCents: 1499,      priceMadCents: 14900,  priceUsdCents: 1499,
      oldPriceCents: 8499,   oldPriceMadCents: 84900, oldPriceUsdCents: 8499,
      durationMinutes: 22 * 60,
      badge: "NEW",
      isBestseller: false,
      isFeatured: false,
      categorySlug: "data-science",
      instructorEmail: "chen@jissron.dev",
      publishedAt: new Date("2024-04-01"),
    },
    {
      slug: "python-for-everybody-complete-bootcamp",
      title: "Python for Everybody: Complete Bootcamp",
      subtitle: "Zero to job-ready Python developer in 40 hours — no experience required",
      description:
        "The most comprehensive Python course on the platform. Covers Python fundamentals, OOP, file handling, APIs, web scraping, data analysis with pandas, and a capstone project. Loved by 24k+ students.",
      level: CourseLevel.BEGINNER,
      status: CourseStatus.PUBLISHED,
      priceCents: 999,       priceMadCents: 9900,   priceUsdCents: 999,
      oldPriceCents: 9999,   oldPriceMadCents: 99900, oldPriceUsdCents: 9999,
      durationMinutes: 40 * 60,
      badge: "BESTSELLER",
      isBestseller: true,
      isFeatured: true,
      categorySlug: "programming",
      instructorEmail: "marcus@jissron.dev",
      publishedAt: new Date("2023-06-15"),
    },
    {
      slug: "chatgpt-prompt-engineering-mastery",
      title: "ChatGPT & Prompt Engineering Mastery",
      subtitle: "Write prompts that actually work — for marketing, coding, research, and business",
      description:
        "Go from vague prompts to precision outputs. Learn chain-of-thought prompting, few-shot examples, system prompts, RAG patterns, and how to build reliable AI workflows for your work. Includes 200+ prompt templates.",
      level: CourseLevel.BEGINNER,
      status: CourseStatus.PUBLISHED,
      priceCents: 1099,      priceMadCents: 10900,  priceUsdCents: 1099,
      oldPriceCents: 7999,   oldPriceMadCents: 79900, oldPriceUsdCents: 7999,
      durationMinutes: 14 * 60,
      badge: "HOT",
      isBestseller: false,
      isFeatured: false,
      categorySlug: "ai-tools",
      instructorEmail: "elena@jissron.dev",
      publishedAt: new Date("2024-02-14"),
    },
    {
      slug: "complete-digital-marketing-course",
      title: "The Complete Digital Marketing Course",
      subtitle: "SEO, paid ads, email, social, content — master every channel in one course",
      description:
        "The only digital marketing course you need. Covers SEO fundamentals, Google & Meta Ads, email marketing, content strategy, social media, CRO, and analytics. Includes real campaign case studies with actual budgets and results.",
      level: CourseLevel.ALL_LEVELS,
      status: CourseStatus.PUBLISHED,
      priceCents: 1199,      priceMadCents: 11900,  priceUsdCents: 1199,
      oldPriceCents: 8999,   oldPriceMadCents: 89900, oldPriceUsdCents: 8999,
      durationMinutes: 30 * 60,
      badge: "BESTSELLER",
      isBestseller: true,
      isFeatured: false,
      categorySlug: "marketing",
      instructorEmail: "sofia@jissron.dev",
      publishedAt: new Date("2023-08-01"),
    },
  ];

  const courseIds: Record<string, string> = {};
  for (const course of courseData) {
    const { categorySlug, instructorEmail, ...rest } = course;
    const record = await db.course.upsert({
      where: { slug: rest.slug },
      create: {
        ...rest,
        categoryId: categories[categorySlug],
        instructorId: instructors[instructorEmail],
      },
      update: {
        title: rest.title,
        priceMadCents: rest.priceMadCents,
        priceUsdCents: rest.priceUsdCents,
        oldPriceMadCents: rest.oldPriceMadCents,
        oldPriceUsdCents: rest.oldPriceUsdCents,
      },
    });
    courseIds[rest.slug] = record.id;
  }

  console.log(`  ✓ ${courseData.length} courses`);

  // ===================================================
  // 4b. MODULES & LESSONS (3 featured courses, mixed types)
  // ===================================================
  type LessonSeed = {
    title: string;
    type: LessonType;
    videoUrl?: string;
    audioUrl?: string;
    pdfUrl?: string;
    htmlContent?: string;
    textContent?: string;
    durationSeconds: number;
    isPreview: boolean;
  };

  const courseModules: Array<{
    courseSlug: string;
    modules: Array<{ title: string; lessons: LessonSeed[] }>;
  }> = [
    {
      courseSlug: "python-for-everybody-complete-bootcamp",
      modules: [
        {
          title: "Getting Started with Python",
          lessons: [
            { title: "Welcome & Course Overview", type: LessonType.VIDEO, videoUrl: "", durationSeconds: 312, isPreview: true },
            { title: "What is Python and Why Learn It?", type: LessonType.TEXT, textContent: "<h2>Why Python?</h2><p>Python is a high-level, readable programming language used in web development, data science, AI, and automation. Its simple syntax makes it the ideal first language.</p>", durationSeconds: 0, isPreview: true },
            { title: "Installing Python & VS Code", type: LessonType.VIDEO, videoUrl: "", durationSeconds: 490, isPreview: false },
          ],
        },
        {
          title: "Python Fundamentals",
          lessons: [
            { title: "Variables & Data Types", type: LessonType.VIDEO, videoUrl: "", durationSeconds: 720, isPreview: false },
            { title: "Python Reference Sheet", type: LessonType.PDF, pdfUrl: "", durationSeconds: 0, isPreview: false },
            { title: "Control Flow: if / else / loops", type: LessonType.VIDEO, videoUrl: "", durationSeconds: 640, isPreview: false },
            { title: "Module Summary & Practice Exercises", type: LessonType.TEXT, textContent: "<h2>What you learned</h2><ul><li>Variables and types</li><li>Conditionals</li><li>Loops</li></ul><p>Complete the exercises in the attached PDF before the next module.</p>", durationSeconds: 0, isPreview: false },
          ],
        },
      ],
    },
    {
      courseSlug: "digital-transformation-intro-ai",
      modules: [
        {
          title: "Introduction to AI in Business",
          lessons: [
            { title: "AI Today: Myths vs. Reality", type: LessonType.VIDEO, videoUrl: "", durationSeconds: 480, isPreview: true },
            { title: "AI Transformation Playbook", type: LessonType.PDF, pdfUrl: "", durationSeconds: 0, isPreview: false },
            { title: "Case Study: How Stripe Uses AI", type: LessonType.TEXT, textContent: "<h2>Stripe's AI Strategy</h2><p>Stripe uses ML models across fraud detection, revenue optimization, and developer tooling. This case study breaks down their approach.</p>", durationSeconds: 0, isPreview: false },
          ],
        },
        {
          title: "Implementation Frameworks",
          lessons: [
            { title: "The 5-Step AI Adoption Framework", type: LessonType.VIDEO, videoUrl: "", durationSeconds: 620, isPreview: false },
            { title: "Stakeholder Alignment Workshop", type: LessonType.HTML, htmlContent: "<h2>Workshop Instructions</h2><ol><li>Map your key stakeholders using the grid below.</li><li>Identify resistance points.</li><li>Draft your change narrative.</li></ol><p><em>Complete this worksheet and upload to the discussion board.</em></p>", durationSeconds: 0, isPreview: false },
            { title: "Building Your AI Roadmap", type: LessonType.VIDEO, videoUrl: "", durationSeconds: 540, isPreview: false },
          ],
        },
      ],
    },
    {
      courseSlug: "chatgpt-prompt-engineering-mastery",
      modules: [
        {
          title: "Foundations of Prompting",
          lessons: [
            { title: "How LLMs Actually Work", type: LessonType.VIDEO, videoUrl: "", durationSeconds: 360, isPreview: true },
            { title: "The Anatomy of a Great Prompt", type: LessonType.TEXT, textContent: "<h2>Four elements of an effective prompt</h2><ol><li><strong>Role</strong> — Tell the model who it is</li><li><strong>Context</strong> — Give relevant background</li><li><strong>Task</strong> — Be specific about what you want</li><li><strong>Format</strong> — Specify the output structure</li></ol>", durationSeconds: 0, isPreview: true },
            { title: "Your First 10 Power Prompts", type: LessonType.VIDEO, videoUrl: "", durationSeconds: 510, isPreview: false },
          ],
        },
        {
          title: "Advanced Techniques",
          lessons: [
            { title: "Chain-of-Thought & Few-Shot Prompting", type: LessonType.VIDEO, videoUrl: "", durationSeconds: 680, isPreview: false },
            { title: "200+ Prompt Templates", type: LessonType.PDF, pdfUrl: "", durationSeconds: 0, isPreview: false },
            { title: "Building a Prompt Library (HTML Template)", type: LessonType.HTML, htmlContent: "<h2>Your Prompt Library</h2><p>Copy this template into Notion or your preferred tool to build a reusable prompt library.</p><table><thead><tr><th>Category</th><th>Prompt</th><th>Use Case</th></tr></thead><tbody><tr><td>Writing</td><td>Act as a senior editor…</td><td>Content review</td></tr></tbody></table>", durationSeconds: 0, isPreview: false },
          ],
        },
      ],
    },
  ];

  for (const { courseSlug, modules } of courseModules) {
    const courseId = courseIds[courseSlug];
    if (!courseId) continue;
    const existing = await db.module.count({ where: { courseId } });
    if (existing > 0) continue; // idempotent
    for (let i = 0; i < modules.length; i++) {
      const mod = modules[i];
      const moduleRecord = await db.module.create({
        data: { courseId, title: mod.title, order: i },
      });
      for (let j = 0; j < mod.lessons.length; j++) {
        const { title, type, durationSeconds, isPreview, ...content } = mod.lessons[j];
        await db.lesson.create({
          data: { moduleId: moduleRecord.id, title, type, durationSeconds, isPreview, order: j, ...content },
        });
      }
    }
  }

  console.log("  ✓ Modules & lessons seeded for 3 courses");

  // ===================================================
  // 5. LIVE SESSIONS (4 sessions from reference design)
  // ===================================================
  // Use future dates relative to seed time so they're always "upcoming"
  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;

  const liveSessionData = [
    {
      slug: "portfolio-critique-case-studies",
      title: "Portfolio critique: case studies that land interviews",
      description:
        "Diego will review 3-4 real portfolios live, with detailed feedback on structure, narrative, and presentation. Walk away with an actionable critique framework you can apply to your own work.",
      kind: LiveSessionKind.WORKSHOP,
      status: LiveSessionStatus.LIVE,
      startsAt: new Date(now.getTime() + 2 * dayMs),
      durationMins: 60,
      seatsTotal: 50,
      priceCents: 2999, priceMadCents: 29900, priceUsdCents: 2999,
      isFree: false,
      isFeatured: true,
      hostEmail: "diego@jissron.dev",
    },
    {
      slug: "ama-startup-lessons-learned",
      title: "AMA: What I wish I knew before launching my startup",
      description:
        "Maya Okonkwo opens up about the hardest lessons from launching two products at Stripe and one solo. Ask anything — from fundraising to roadmap prioritization to managing stakeholders.",
      kind: LiveSessionKind.AMA,
      status: LiveSessionStatus.SCHEDULED,
      startsAt: new Date(now.getTime() + 4 * dayMs),
      durationMins: 90,
      seatsTotal: 300,
      priceCents: 0, priceMadCents: 0, priceUsdCents: 0,
      isFree: true,
      isFeatured: true,
      hostEmail: "maya@jissron.dev",
    },
    {
      slug: "fine-tuning-small-models-beat-gpt4",
      title: "Fine-tuning small models to beat GPT-4",
      description:
        "Priya walks through the end-to-end workflow for fine-tuning Llama-3 and Mistral on domain-specific data. Covers dataset curation, training setup on RunPod, evaluation metrics, and cost vs. performance tradeoffs.",
      kind: LiveSessionKind.WORKSHOP,
      status: LiveSessionStatus.SCHEDULED,
      startsAt: new Date(now.getTime() + 8 * dayMs),
      durationMins: 120,
      seatsTotal: 40,
      priceCents: 4999, priceMadCents: 49900, priceUsdCents: 4999,
      isFree: false,
      isFeatured: false,
      hostEmail: "priya@jissron.dev",
    },
    {
      slug: "grammar-of-short-form-negotiation",
      title: "The grammar of short-form negotiation",
      description:
        "Most negotiation happens in 3-sentence emails and 2-minute conversations, not boardrooms. Aisha teaches you how to structure micro-negotiations — salary bumps, project scopes, vendor terms — with precision language.",
      kind: LiveSessionKind.SEMINAR,
      status: LiveSessionStatus.SCHEDULED,
      startsAt: new Date(now.getTime() + 11 * dayMs),
      durationMins: 75,
      seatsTotal: 30,
      priceCents: 1999, priceMadCents: 19900, priceUsdCents: 1999,
      isFree: false,
      isFeatured: false,
      hostEmail: "aisha@jissron.dev",
    },
  ];

  for (const session of liveSessionData) {
    const { hostEmail, ...rest } = session;
    await db.liveSession.upsert({
      where: { slug: rest.slug },
      create: {
        ...rest,
        hostId: instructors[hostEmail],
      },
      update: {
        title: rest.title,
        priceMadCents: rest.priceMadCents,
        priceUsdCents: rest.priceUsdCents,
      },
    });
  }

  console.log(`  ✓ ${liveSessionData.length} live sessions`);

  // ===================================================
  // 6. CONSULTANTS (3 from reference design)
  // ===================================================
  const consultantData = [
    {
      email: "maya@jissron.dev",
      tagline: "Senior PM at Stripe · ex-Notion",
      bio: "Helped 40+ PMs transition into senior roles. Specializes in product strategy, roadmapping, and stakeholder management at scale.",
      ratePerSession: 18000,             // $180 USD
      ratePerSessionMadCents: 180000,    // 1800 MAD
      ratePerSessionUsdCents: 18000,
      durationMins: 30,
      skills: ["Product Strategy", "Roadmapping", "Career"],
      avatarGradient: "linear-gradient(135deg, #003d80, #66b5ff)",
      totalSessions: 284,
      avgRating: 4.9,
      isFeatured: true,
      acceptsNew: true,
      availability: [
        { day: "mon", slots: ["09:00", "11:00", "14:00"] },
        { day: "wed", slots: ["10:00", "15:00"] },
        { day: "fri", slots: ["09:00", "13:00", "16:00"] },
      ],
    },
    {
      email: "priya@jissron.dev",
      tagline: "ML Engineer · ex-OpenAI",
      bio: "Shipping production ML since 2018. Best for teams stuck on data pipelines, evaluation, model selection, or fine-tuning strategy.",
      ratePerSession: 24000,             // $240 USD
      ratePerSessionMadCents: 240000,    // 2400 MAD
      ratePerSessionUsdCents: 24000,
      durationMins: 30,
      skills: ["LLMs", "MLOps", "Evaluation"],
      avatarGradient: "linear-gradient(135deg, #002a5a, #0071e3)",
      totalSessions: 156,
      avgRating: 4.9,
      isFeatured: true,
      acceptsNew: true,
      availability: [
        { day: "tue", slots: ["11:00", "14:00"] },
        { day: "thu", slots: ["10:00", "15:00", "17:00"] },
      ],
    },
    {
      email: "diego@jissron.dev",
      tagline: "Senior Designer · ex-Figma",
      bio: "10 years building design systems and leading design teams at scale. Best for design critiques, career transitions into senior design, and design system architecture.",
      ratePerSession: 15000,             // $150 USD
      ratePerSessionMadCents: 150000,    // 1500 MAD
      ratePerSessionUsdCents: 15000,
      durationMins: 30,
      skills: ["Design Systems", "Figma", "Career"],
      avatarGradient: "linear-gradient(135deg, #003d80, #99c7ff)",
      totalSessions: 203,
      avgRating: 4.8,
      isFeatured: false,
      acceptsNew: true,
      availability: [
        { day: "mon", slots: ["14:00", "16:00"] },
        { day: "wed", slots: ["10:00", "13:00"] },
        { day: "fri", slots: ["11:00"] },
      ],
    },
  ];

  for (const consultant of consultantData) {
    const { email, ...rest } = consultant;
    const userId = instructors[email];
    await db.consultant.upsert({
      where: { userId },
      create: { ...rest, userId },
      update: {
        ratePerSession: rest.ratePerSession,
        ratePerSessionMadCents: rest.ratePerSessionMadCents,
        ratePerSessionUsdCents: rest.ratePerSessionUsdCents,
      },
    });
  }

  console.log(`  ✓ ${consultantData.length} consultants`);

  // ===================================================
  // 7. TEST ENROLLMENTS (admin user — y.afailal@gmail.com)
  // ===================================================
  const adminUser = await db.user.findUnique({
    where: { email: "y.afailal@gmail.com" },
    select: { id: true },
  });

  if (adminUser) {
    const enrolledSlugs = [
      { slug: "python-for-everybody-complete-bootcamp", enrolledAt: new Date("2026-03-10") },
      { slug: "chatgpt-prompt-engineering-mastery", enrolledAt: new Date("2026-04-01") },
      { slug: "negotiation-skills-quiet-professionals", enrolledAt: new Date("2026-04-20") },
    ];

    let enrollmentCount = 0;
    for (const { slug, enrolledAt } of enrolledSlugs) {
      const courseId = courseIds[slug];
      if (!courseId) continue;

      const existing = await db.enrollment.findUnique({
        where: { userId_courseId: { userId: adminUser.id, courseId } },
        select: { id: true },
      });

      if (!existing) {
        const order = await db.order.create({
          data: {
            userId: adminUser.id,
            courseId,
            status: OrderStatus.PAID,
            paymentMethod: PaymentMethod.NONE,
            amountCents: 0,
            currency: "MAD",
            paidAt: enrolledAt,
          },
        });

        await db.enrollment.create({
          data: {
            userId: adminUser.id,
            courseId,
            orderId: order.id,
            status: "ACTIVE",
            method: "FREE",
            enrolledAt,
          },
        });
        enrollmentCount++;
      }
    }

    console.log(`  ✓ ${enrollmentCount} test enrollment(s) for admin user (${enrolledSlugs.length - enrollmentCount} already existed)`);
  } else {
    console.log("  ⚠ Admin user y.afailal@gmail.com not found — skipping test enrollments");
  }

  // ===================================================
  // 8. COURSE FAQs
  // NOTE: re-running this seed wipes and replaces all FAQs for seeded courses.
  // Any FAQs added manually via the admin panel will be lost. This is an
  // acceptable tradeoff since seed.ts is a dev tool, not a prod data manager.
  // ===================================================
  const faqData: Record<string, Array<{ question: string; answer: string }>> = {
    "digital-transformation-intro-ai": [
      {
        question: "What language is this course taught in?",
        answer: "This course is taught in English with French subtitles available on all video lessons.",
      },
      {
        question: "Can I pay by bank transfer?",
        answer: "Yes — all MAD-priced courses accept bank transfer to our Moroccan bank account. You'll receive payment instructions during checkout.",
      },
      {
        question: "Do I get a certificate when I finish?",
        answer: "Yes. Once you complete 100% of the lessons, JissrON auto-generates a PDF certificate you can download and share on LinkedIn.",
      },
    ],
    "marketing-analytics-python-business": [
      {
        question: "Do I need to know Python before starting?",
        answer: "Basic Python familiarity helps, but the course starts from the fundamentals. If you can read a script and run a cell in Jupyter, you'll be fine.",
      },
      {
        question: "What language is this course taught in?",
        answer: "This course is taught in English. Slides and code comments are bilingual (English/French).",
      },
      {
        question: "Can I pay by bank transfer?",
        answer: "Yes — all MAD-priced courses accept bank transfer to our Moroccan bank account. You'll receive payment instructions during checkout.",
      },
    ],
    "negotiation-skills-quiet-professionals": [
      {
        question: "What language is this course taught in?",
        answer: "This course is taught in English. It's designed for professionals working in international environments.",
      },
      {
        question: "Is this course useful if I'm not in sales?",
        answer: "Absolutely. The frameworks here apply to salary negotiations, project scoping with your manager, freelance contracts, and even personal relationships. Negotiation is a life skill.",
      },
      {
        question: "Do I get a certificate when I finish?",
        answer: "Yes. Once you complete 100% of the lessons, JissrON auto-generates a PDF certificate you can download and share on LinkedIn.",
      },
    ],
    "advanced-design-systems-at-scale": [
      {
        question: "What language is this course taught in?",
        answer: "This course is taught in French with English subtitles. All diagrams, code samples, and Figma files are in English.",
      },
      {
        question: "Do I need Figma experience before starting?",
        answer: "Yes — this is an advanced course. You should already be comfortable with Figma components and auto-layout. Beginners will be lost from module 2.",
      },
      {
        question: "Can I pay by bank transfer?",
        answer: "Yes — all MAD-priced courses accept bank transfer to our Moroccan bank account. You'll receive payment instructions during checkout.",
      },
    ],
    "data-analytics-business-intelligence": [
      {
        question: "What language is this course taught in?",
        answer: "This course is taught in English. SQL queries and code samples include inline comments in both English and French.",
      },
      {
        question: "Do I get a certificate when I finish?",
        answer: "Yes. Once you complete 100% of the lessons, JissrON auto-generates a PDF certificate you can download and share on LinkedIn.",
      },
      {
        question: "Can I pay by bank transfer?",
        answer: "Yes — all MAD-priced courses accept bank transfer to our Moroccan bank account. You'll receive payment instructions during checkout.",
      },
    ],
    "python-for-everybody-complete-bootcamp": [
      {
        question: "What language is this course taught in?",
        answer: "This course is taught in Darija (Moroccan Arabic) with English technical terms. All written materials, code, and exercises are in English.",
      },
      {
        question: "Do I need any prior coding experience?",
        answer: "No. This course is built for absolute beginners. If you can use a web browser, you can start this course today.",
      },
      {
        question: "Do I get a certificate when I finish?",
        answer: "Yes. Once you complete 100% of the lessons, JissrON auto-generates a PDF certificate you can download and share on LinkedIn.",
      },
    ],
    "chatgpt-prompt-engineering-mastery": [
      {
        question: "What language is this course taught in?",
        answer: "This course is taught in English and includes examples in both English and Arabic prompts — useful if you work in bilingual environments.",
      },
      {
        question: "Will this course stay up to date as AI evolves?",
        answer: "Yes. Enrolled students get lifetime access and receive updates when the course content is revised. We refresh the prompt templates at least quarterly.",
      },
      {
        question: "Can I pay by bank transfer?",
        answer: "Yes — all MAD-priced courses accept bank transfer to our Moroccan bank account. You'll receive payment instructions during checkout.",
      },
    ],
    "complete-digital-marketing-course": [
      {
        question: "What language is this course taught in?",
        answer: "This course is taught in French with English subtitles. All practical exercises, ad accounts, and tools are set up in English.",
      },
      {
        question: "Do I need a marketing budget to practice?",
        answer: "No. All paid ad exercises use a simulator with fake budgets so you can practice campaign setup without spending money. The SEO and email modules require no budget at all.",
      },
      {
        question: "Do I get a certificate when I finish?",
        answer: "Yes. Once you complete 100% of the lessons, JissrON auto-generates a PDF certificate you can download and share on LinkedIn.",
      },
    ],
  };

  let faqCount = 0;
  for (const [slug, faqs] of Object.entries(faqData)) {
    const courseId = courseIds[slug];
    if (!courseId) continue;

    await db.courseFAQ.deleteMany({ where: { courseId } });
    await db.courseFAQ.createMany({
      data: faqs.map((faq, i) => ({
        courseId,
        question: faq.question,
        answer: faq.answer,
        order: i,
      })),
    });
    faqCount += faqs.length;
  }

  console.log(`  ✓ ${faqCount} FAQs across ${Object.keys(faqData).length} courses`);

  console.log("\n✅ Seed complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
