---

# Security Plan — JissrON LMS

## Context
Based on a layer-by-layer security audit comparing JissrON to a benchmark production LMS (Firebase + Cloudflare + Stripe stack). This document captures the gaps, priorities, and implementation notes for Phase 7 (pre-launch hardening) and Phase 6 (Stripe integration).

## Audit summary

JissrON foundation (NextAuth + Prisma + server actions) is solid — equal to or better than the benchmark on authentication and entitlement logic. Gaps are primarily in perimeter (Cloudflare/WAF), HTTP security headers, rate limiting, and video streaming protection.

After Phase 7, expected parity: ~90% with benchmark. The remaining 10% is full DRM (Widevine/FairPlay), which requires paid video infrastructure ($500-2000/month) and is only justified at scale.

## Prioritized implementation list

### 🟢 Easy wins — add in Phase 7

1. **Strict HTTP security headers** in next.config.js:
   - Content-Security-Policy (script-src restricted to own domain + Cloudflare Turnstile + Stripe; no inline scripts except with nonce)
   - Cross-Origin-Embedder-Policy: require-corp
   - Cross-Origin-Opener-Policy: same-origin
   - Cross-Origin-Resource-Policy: same-origin
   - X-Frame-Options: SAMEORIGIN (explicit, not default)
   - X-Content-Type-Options: nosniff
   - Referrer-Policy: same-origin
   - Permissions-Policy: disable camera, microphone, geolocation, clipboard-write, screen-wake-lock, USB, payment (except on checkout route), Bluetooth, XR
   - Strict-Transport-Security (HSTS): max-age=31536000; includeSubDomains; preload

2. **Cloudflare in front of Vercel**:
   - Free tier sufficient
   - Enables: DDoS protection, bot challenges, IP reputation filtering, basic rate limiting
   - DNS setup: point domain to Cloudflare, Cloudflare proxies to Vercel
   - Enable "Under Attack Mode" toggle for emergencies

3. **Rate limiting** on sensitive endpoints:
   - Upstash Redis free tier
   - Protect: /api/auth/* (login), /api/checkout/*, /api/uploadthing/*, password reset endpoints
   - Limits: 5 login attempts / 15 min / IP; 10 checkout attempts / hour / user

4. **Bunny Stream Token Authentication**:
   - Enable in Bunny dashboard for the video library
   - Server action generates a signed URL with short expiry (5 minutes typical)
   - Student video player fetches a fresh signed URL on each lesson load
   - Never expose the raw Bunny URL to the client
   - Reference: Bunny docs on "Token Authentication"

5. **HTTPS-only cookies**:
   - Verify NextAuth session cookie is Secure, HttpOnly, SameSite=Lax
   - Already the default but confirm in production config

### 🟡 Medium complexity — Phase 6 or Phase 7

6. **Stripe chargeback handler** (part of Phase 6):
   - Webhook subscribes to charge.refunded, charge.dispute.created
   - On chargeback: set Enrollment.status to REVOKED, log to ActivityLog, notify admin via email
   - Student loses access immediately

7. **Email alerts on unusual logins**:
   - After Resend integration, send email on:
     - New device fingerprint
     - New country (IP geolocation)
     - Password change
     - Multiple failed login attempts
   - Soft signal — don't block, just alert user

8. **Download-attempt monitoring**:
   - Log every signed video URL fetch to ActivityLog
   - Detect abnormal patterns (100+ fetches in 10 min from one user)
   - Flag account for manual review, temporarily throttle

9. **Short session lifetime**:
   - NextAuth session: currently 30 days default
   - Consider reducing to 7 days for production, with refresh-on-activity
   - Force logout on password change

10. **Device fingerprinting** (optional):
    - FingerprintJS free tier
    - Attach fingerprint to sessions, detect shared accounts
    - Enforce max 2 concurrent devices per user (configurable)

### 🔴 High cost — defer until revenue justifies

11. **Full DRM (Widevine + FairPlay + PlayReady)**:
    - Requires upgrading video provider: Mux ($500+/month), Cloudflare Stream ($5/1000 min), or Vimeo Pro
    - Benefit: prevents even OBS-level screen recording (somewhat)
    - Industry reality: screen recording is never fully preventable; DRM raises the bar, doesn't eliminate the threat
    - Threshold: consider when monthly video revenue > $5,000 or when theft evidence surfaces

12. **Cloudflare paid tier (Pro or Business)**:
    - $20-200/month
    - Adds: advanced bot management, image optimization, enhanced WAF rules
    - Threshold: when hitting rate limit caps on free tier, or experiencing sustained attacks

## Already implemented or planned

- ✅ Server-side entitlement checks (server actions + Prisma)
- ✅ Role-based middleware (STUDENT, INSTRUCTOR, ADMIN)
- ✅ HttpOnly session cookies (NextAuth default)
- ✅ Google OAuth with verified email enforcement
- ✅ Stripe webhook → DB-backed Enrollment (Phase 6 plan)
- ✅ UploadThing auth guards on admin-only uploads

## Industry realities (not gaps to close)

- **Screen recording cannot be prevented in software.** Even Netflix, Disney+, and paid LMS benchmarks accept this. DRM raises the bar, doesn't eliminate.
- **Leaked credentials are a user-side problem.** Device fingerprinting and session limits mitigate but don't eliminate account sharing.
- **Determined attackers will always find a way.** Security is about raising cost to attackers above the value of theft. 90% parity with a benchmark is sufficient for a pre-launch LMS.

## Implementation order at Phase 7

Suggested sequence:
1. Security headers (15 min)
2. Cloudflare DNS setup (30 min)
3. Bunny Token Authentication (1-2 hours)
4. Rate limiting via Upstash (1 hour)
5. Email login alerts via Resend (2 hours)
6. Chargeback webhook (included in Phase 6 Stripe work)

Total additional work at Phase 7: approximately 4-6 hours.

---
