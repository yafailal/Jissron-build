<div class="cover">
<p class="wordmark">Jissr<span class="accent">ON</span></p>
<p class="subtitle">Learning Management System</p>
<p class="doc-title">For Instructors and Consultants</p>
<p class="doc-meta">May 2026</p>
</div>

# What JissrON offers you

JissrON is a learning platform where experts can earn money by teaching online. There are three independent ways to do it:

1. **Build a self-paced course** — record video lessons, write articles, add quizzes and assignments. Students enroll and learn at their own pace.
2. **Host live sessions** — schedule a workshop, AMA, or seminar on Zoom or Google Meet. Students reserve seats; you collect attendance fees.
3. **Offer 1-on-1 consultations** — students book private 30-minute calls with you at your published hourly rate.

You can do all three, or just one. Each works independently. Payments are handled by the platform; you receive your share via a periodic payout.

# How you become an instructor or consultant

You don't sign up as an instructor yourself. The platform administrator creates your account and assigns the role. This is intentional — it lets JissrON vet who appears on the public site.

Once your account is set up:

- **Instructors** appear as the author of courses and as the host of live sessions.
- **Consultants** have a public profile at `/consultants/[your-id]` with your bio, skills, rate, and availability calendar.

Both roles can be held by the same person.

# Your dashboard

When you log in, you'll be sent to your instructor area at `/instructor`. This is a read-only overview that shows:

- **Total students** across all your courses.
- **Your earnings** — your share of all paid orders. The platform's cut percentage (set by the administrator) is shown here. For example, if it's 30%, you keep 70% of every sale.
- **Pending payout** — earnings the administrator hasn't transferred to you yet, with the count of orders that contribute.
- **Awaiting grading** — number of quiz attempts and assignment submissions that need manual grading.
- A list of your **courses** with per-course revenue and student counts.
- A feed of **recent enrollments** so you can see who's joining what.

There's no editing happening in this area. Course content, prices, and scheduling are all currently managed by the administrator on your behalf. This keeps editorial oversight in one place and means you don't need to learn the editor.

# How courses work

A course is a container with three layers:

```
Course
 └── Module 1
      ├── Lesson 1 (Video)
      ├── Lesson 2 (PDF)
      └── Lesson 3 (Quiz)
 └── Module 2
      ├── Lesson 1 (Video)
      └── Lesson 2 (Assignment)
```

Modules are ordered groups of lessons. Lessons can be one of seven types:

| Type | What it is |
|---|---|
| **Video** | A streaming video hosted on Bunny.net. Students see their watched progress. |
| **Audio** | A streaming audio file. Useful for podcast-style lessons. |
| **PDF** | A downloadable document, also previewable in the browser. |
| **HTML** | A rich-text article — formatted text, headings, images, links. |
| **Text** | Plain text without formatting. |
| **Quiz** | A set of questions. Auto-graded. You set the passing threshold and how many retries are allowed. |
| **Assignment** | A file upload from the student. You grade it manually. |

You can mix any of these in any order within a course. Students are guided through them in sequence but can revisit anything they've already done.

## Course pricing

Courses can be free or paid. Paid courses have **two prices** stored separately:

- A price in Moroccan dirhams (MAD) — paid via CMI or bank transfer.
- A price in US dollars (USD) — paid via Stripe.

You're not required to set both. If you only want to sell in MAD, leave the USD price at zero — international users will see "USD payment unavailable" and can still browse the course.

## Course status

A course can be in one of three states:

- **Draft** — work in progress. Hidden from the public.
- **Published** — live, listed in the catalog, sellable.
- **Archived** — hidden from new sales but still accessible to existing students.

# How live sessions work

A live session is a scheduled event with a fixed seat capacity. You set:

- **Title and description** — what the session is about.
- **Kind** — AMA, Workshop, Seminar, or Cohort. Just a label that helps students filter.
- **Date and time** — UTC.
- **Duration** — typically 60 minutes.
- **Seats** — the maximum number of people who can attend.
- **Price** — free, or a price in MAD and/or USD.
- **Language** — the language the session will be conducted in.

## Meeting links

You provide the Zoom or Google Meet URL when you create the session. The platform keeps it hidden until **15 minutes before the start time**, then reveals it only to confirmed attendees. After the session ends, you can paste a recording URL — attendees will see it on the same page.

The platform sends a **reminder email one hour before** the session to every confirmed attendee. They don't need to remember.

## Capacity enforcement

When a session reaches its seat limit, the booking button is automatically replaced with "Sold out". For paid sessions, capacity is re-checked at payment confirmation time — if two people pay simultaneously for the last seat, only the first one through gets it; the second is refunded by the administrator.

# How 1-on-1 consultations work

If you're set up as a consultant, you have a public profile at `/consultants/[your-id]`. The profile shows:

- Your bio.
- Your skills (a list of short tags).
- Your tagline (a one-line summary).
- Your rate per session (MAD and/or USD).
- Your weekly availability — the hours and days you accept bookings.
- Your past rating and total sessions delivered (if any).

## Availability

You define your availability as a weekly recurring pattern. For example:

- **Monday**: 09:00–12:00 and 14:00–17:00
- **Tuesday, Thursday**: 10:00–18:00
- **Friday**: 09:00–13:00

The platform divides these ranges into 30-minute slots and shows the next 14 days of bookable times to potential clients. Bookings already taken disappear from the list automatically.

## The booking flow

A student picks a slot, optionally adds a note (e.g., "I want to discuss my React migration"), and pays through Stripe or CMI. Once payment is confirmed, the booking is locked in — they receive a confirmation, you receive a notification, and the slot becomes unavailable to other students.

The actual meeting setup (sending the Zoom link, etc.) happens directly between you and the student through email or whatever channel you prefer. JissrON handles the booking and payment; you handle the conversation.

# Grading

Two lesson types require your attention after a student submits:

## Quiz attempts

Quizzes with text-answer questions can't be auto-graded — only multiple-choice and true/false are. Text questions appear in the grading queue at `/admin/grading` (administrator access).

The administrator reviews the student's answer, awards points, and the system marks the attempt as graded. The student gets an email letting them know.

In practice, an administrator handles this for you. If you want to grade your own quizzes, ask the administrator to give you admin access.

## Assignment submissions

When a student uploads a file for an assignment, it lands in the same grading queue. The grader:

- Downloads the file.
- Reviews it.
- Assigns a grade (a number out of the assignment's maximum).
- Optionally adds feedback for the student.
- Submits.

The student is notified and can see the grade and feedback on their lesson page.

# Lesson Q&A

Every lesson has a discussion thread attached. Students can post questions; you (and the administrator) can reply.

Replies you post are marked with an **"Instructor"** badge so students know it's an authoritative answer. There are no DMs — all discussion is public to anyone enrolled in the course.

# Revenue and payouts

## How earnings are calculated

When someone pays for one of your courses or live sessions, JissrON applies the **platform cut** to compute your share. The cut is a percentage that's set per-instructor by the administrator.

Example: If your platform cut is 30% and someone buys your course for 500 MAD:

- JissrON keeps **150 MAD** (the 30% cut).
- You earn **350 MAD** (the remaining 70%).

This appears in your dashboard immediately. It does **not** appear in your bank account immediately — see below.

## How and when you get paid

JissrON tracks every order with a `paid out yet?` flag. After a payment comes in, your earnings sit in a "pending payout" bucket. Periodically (typically monthly), the administrator:

1. Looks at how much each instructor is owed.
2. Sends the money via whatever banking method you've agreed on (separate from JissrON).
3. Marks the corresponding orders as paid out in the admin panel.

After that, the orders move from "pending payout" to "paid out" in your dashboard. The actual money movement happens outside the platform — JissrON only tracks who's been paid and who hasn't.

If you want a different payout cadence, that's a conversation with the administrator, not a system change.

## What you see

In your dashboard, four numbers tell you everything financial:

- **Total earnings** — everything you've earned to date.
- **Paid out** — what's already been transferred to you.
- **Pending payout** — what's owed but not yet transferred.
- **Pending payout count** — how many orders make up that pending amount.

# Refunds

Refunds are issued by the administrator. When a refund happens to one of your enrollments:

- The order's status flips to REFUNDED.
- The student's access to the course is revoked.
- If it was a live session, their seat is freed for someone else.
- Your earnings for that order are zeroed out — you don't keep the cut on refunded sales.

# What tools you'll use

You won't need to install anything to teach on JissrON. Here's what's involved in the day-to-day:

- **A web browser** for everything — checking your dashboard, replying to lesson Q&A, viewing students.
- **Zoom or Google Meet** for live sessions and consultations. You provide the meeting link; the platform reveals it to attendees at the right time.
- **A video recording tool** if you're making courses (your phone, ScreenFlow, OBS, Riverside, whatever you prefer). The administrator uploads your videos to Bunny.net for hosting.
- **Your bank account** for receiving payouts.

You don't need to know how the technology works. You don't need to manage hosting, payments, or refunds.

# What the platform handles for you

- Payment processing in MAD (via CMI cards or bank transfer) and USD (via Stripe).
- Issuing certificates to students who complete your courses.
- Sending reminder emails before your live sessions.
- Hosting and streaming your videos (no bandwidth charges to you).
- The discussion thread under every lesson.
- Tracking your earnings and showing you what you're owed.
- Refund processing.
- Customer support routing (students can use `/contact` to reach the administrator).

# What you handle yourself

- Creating content (recording videos, writing lessons, designing quizzes).
- Showing up for your scheduled live sessions and consultations.
- Replying to student questions on your lessons.
- Promoting yourself outside the platform if you want more students (social media, etc.).
- Tax reporting on your earnings (the platform doesn't issue tax forms).

# Frequently asked questions

**Can I price my courses however I want?**

Yes. You and the administrator agree on a price together, and the administrator sets it in the system. There's no platform-imposed minimum or maximum.

**Can students download my course videos?**

No. Videos are streaming-only. They can only be watched inside the JissrON player.

**What happens if a student cancels a live session booking?**

Free bookings: they can cancel any time before the session starts; the seat opens up again.

Paid bookings: the administrator decides whether to refund. By default, the published terms allow a full refund up to 24 hours before the session.

**What if a student gives me a bad review?**

Reviews appear publicly on the course page. You can't delete them, but the administrator can if a review violates the platform's acceptable-use rules (e.g., personal attacks).

**Can I see who bought my course?**

Yes. Your dashboard shows "Recent enrollments" with the student's name. The administrator's user panel has the full list.

**Can I message my students directly?**

Not yet. There is no DM system. You communicate through the public Q&A threads on lessons. The platform may add direct messaging in the future.

**Can I have multiple instructors on a course?**

Not yet. Each course currently has exactly one instructor of record. Co-teaching would need a platform update.

# Getting started

1. Tell the administrator what you want to offer (courses, live sessions, consultations, or all three).
2. Send them your bio, headshot, and skill list.
3. Agree on your revenue split and payout cadence.
4. Send them course materials, lesson scripts, video files, etc.
5. The administrator sets everything up and tells you when you're live.
6. Log in at jissron.com, head to `/instructor`, and watch the numbers move.
