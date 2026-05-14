import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "JissrON <onboarding@resend.dev>";

// ── Email 1: Order received ───────────────────────────────────────────────────

interface OrderReceivedParams {
  to: string;
  name: string;
  orderReference: string;
  courseTitle: string;
  amountMad: number;
  orderId: string;
}

export async function sendOrderReceived(p: OrderReceivedParams) {
  const checkoutUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/checkout/${p.orderId}`;

  await resend.emails.send({
    from: FROM,
    to: p.to,
    subject: `Your JissrON order ${p.orderReference} — transfer instructions inside`,
    html: orderReceivedHtml({ ...p, checkoutUrl }),
  });
}

function orderReceivedHtml(p: OrderReceivedParams & { checkoutUrl: string }) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">

        <!-- Header -->
        <tr>
          <td style="background:#003d80;padding:28px 32px;">
            <p style="margin:0;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">JissrON</p>
            <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,.7);">Your order is confirmed</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 12px;font-size:16px;color:#081a36;font-weight:600;">Hi ${escHtml(p.name)},</p>
            <p style="margin:0 0 24px;font-size:14px;color:#4a5568;line-height:1.6;">
              Thank you for your order! To complete your enrollment in <strong>${escHtml(p.courseTitle)}</strong>,
              please transfer <strong>${p.amountMad} MAD</strong> to our bank account using the details on your checkout page.
            </p>

            <!-- Order reference box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f5ff;border-radius:8px;margin:0 0 24px;">
              <tr>
                <td style="padding:20px 24px;">
                  <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#6b7280;">Your order reference</p>
                  <p style="margin:0;font-size:26px;font-weight:800;color:#003d80;letter-spacing:1px;">${escHtml(p.orderReference)}</p>
                  <p style="margin:8px 0 0;font-size:12px;color:#6b7280;">Include this in your transfer description so we can match your payment.</p>
                </td>
              </tr>
            </table>

            <!-- Amount -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;margin:0 0 28px;">
              <tr>
                <td style="padding:16px 20px;font-size:13px;color:#4a5568;">Amount to transfer</td>
                <td style="padding:16px 20px;font-size:15px;font-weight:700;color:#081a36;text-align:right;">${p.amountMad} MAD</td>
              </tr>
              <tr style="border-top:1px solid #e2e8f0;">
                <td style="padding:16px 20px;font-size:13px;color:#4a5568;">Course</td>
                <td style="padding:16px 20px;font-size:13px;color:#081a36;text-align:right;">${escHtml(p.courseTitle)}</td>
              </tr>
            </table>

            <!-- CTA -->
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
              <tr>
                <td style="background:#003d80;border-radius:8px;">
                  <a href="${p.checkoutUrl}" style="display:block;padding:14px 32px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">View transfer details →</a>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.5;">
              We'll send you a confirmation email as soon as we verify your transfer — usually within 1-2 business days.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 32px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">© JissrON. All rights reserved.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Email 2: Payment confirmed ────────────────────────────────────────────────

interface PaymentConfirmedParams {
  to: string;
  name: string;
  orderReference: string;
  courseTitle: string;
  courseSlug: string;
}

export async function sendPaymentConfirmed(p: PaymentConfirmedParams) {
  const learnUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/courses/${p.courseSlug}/learn`;

  await resend.emails.send({
    from: FROM,
    to: p.to,
    subject: `You're enrolled in ${p.courseTitle} — start learning`,
    html: paymentConfirmedHtml({ ...p, learnUrl }),
  });
}

function paymentConfirmedHtml(p: PaymentConfirmedParams & { learnUrl: string }) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">

        <!-- Header -->
        <tr>
          <td style="background:#003d80;padding:28px 32px;">
            <p style="margin:0;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">JissrON</p>
            <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,.7);">Payment confirmed — you're in!</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 12px;font-size:16px;color:#081a36;font-weight:600;">Hi ${escHtml(p.name)},</p>
            <p style="margin:0 0 24px;font-size:14px;color:#4a5568;line-height:1.6;">
              Great news — we've confirmed your payment for <strong>${escHtml(p.courseTitle)}</strong>.
              You now have full access to the course. Start learning whenever you're ready!
            </p>

            <!-- Course box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f5ff;border-radius:8px;margin:0 0 28px;">
              <tr>
                <td style="padding:20px 24px;">
                  <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#6b7280;">Enrolled in</p>
                  <p style="margin:0;font-size:17px;font-weight:700;color:#003d80;">${escHtml(p.courseTitle)}</p>
                  <p style="margin:8px 0 0;font-size:12px;color:#6b7280;">Order ${escHtml(p.orderReference)} · Lifetime access</p>
                </td>
              </tr>
            </table>

            <!-- CTA -->
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
              <tr>
                <td style="background:#003d80;border-radius:8px;">
                  <a href="${p.learnUrl}" style="display:block;padding:14px 32px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">Start learning →</a>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.5;">
              If you have any questions, reply to this email and we'll be happy to help.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 32px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">© JissrON. All rights reserved.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Email 3: Order expired ────────────────────────────────────────────────────

interface OrderExpiredParams {
  to: string;
  name: string;
  orderReference: string;
  courseTitle: string;
  courseSlug: string;
}

export async function sendOrderExpired(p: OrderExpiredParams) {
  const courseUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/courses/${p.courseSlug}`;

  await resend.emails.send({
    from: FROM,
    to: p.to,
    subject: `Your JissrON order ${p.orderReference} has expired`,
    html: orderExpiredHtml({ ...p, courseUrl }),
  });
}

function orderExpiredHtml(p: OrderExpiredParams & { courseUrl: string }) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">

        <!-- Header -->
        <tr>
          <td style="background:#003d80;padding:28px 32px;">
            <p style="margin:0;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">JissrON</p>
            <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,.7);">Order update</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 12px;font-size:16px;color:#081a36;font-weight:600;">Hi ${escHtml(p.name)},</p>
            <p style="margin:0 0 24px;font-size:14px;color:#4a5568;line-height:1.6;">
              We're sorry — your order <strong>${escHtml(p.orderReference)}</strong> for
              <strong>${escHtml(p.courseTitle)}</strong> has expired because we didn't receive a
              matching bank transfer within 7 days.
            </p>
            <p style="margin:0 0 28px;font-size:14px;color:#4a5568;line-height:1.6;">
              If you'd still like to enroll, you're welcome to place a new order — it only takes a minute.
            </p>

            <!-- CTA -->
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
              <tr>
                <td style="background:#003d80;border-radius:8px;">
                  <a href="${p.courseUrl}" style="display:block;padding:14px 32px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">Start a new order →</a>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.5;">
              If you believe this is a mistake or you did complete the transfer, please reply to this email
              with your bank confirmation and we'll investigate.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 32px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">© JissrON. All rights reserved.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Email 4: Course completed ─────────────────────────────────────────────────

interface CourseCompletedParams {
  to: string;
  userName: string;
  courseTitle: string;
  courseSlug: string;
}

export async function sendCourseCompleted(p: CourseCompletedParams): Promise<void> {
  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const coursesUrl = `${base}/courses`;
  const reviewUrl = `${base}/courses/${p.courseSlug}?review=open`;
  const unsubscribeUrl = `${base}/unsubscribe`;

  await resend.emails.send({
    from: FROM,
    to: p.to,
    subject: `You completed ${p.courseTitle}! 🎉`,
    html: courseCompletedHtml({ ...p, coursesUrl, reviewUrl, unsubscribeUrl }),
  });
}

function courseCompletedHtml(
  p: CourseCompletedParams & {
    coursesUrl: string;
    reviewUrl: string;
    unsubscribeUrl: string;
  }
) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">

        <!-- Header -->
        <tr>
          <td style="background:#003d80;padding:28px 32px;">
            <p style="margin:0;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">JissrON</p>
            <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,.7);">Course completion</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 32px 32px;">

            <!-- Headline -->
            <p style="margin:0 0 24px;font-size:36px;font-weight:700;color:#003d80;line-height:1.15;font-style:italic;font-family:Georgia,serif;">You did it.</p>

            <p style="margin:0 0 16px;font-size:15px;color:#081a36;line-height:1.65;">
              Hi ${escHtml(p.userName)},
            </p>
            <p style="margin:0 0 16px;font-size:15px;color:#4a5568;line-height:1.65;">
              You completed <strong style="color:#081a36;">${escHtml(p.courseTitle)}</strong>. That's no small thing — finishing a course takes consistent effort, and you showed up.
            </p>
            <p style="margin:0 0 36px;font-size:15px;color:#4a5568;line-height:1.65;">
              Whatever you take from here, we hope this is just the start of something bigger for you.
            </p>

            <!-- CTAs -->
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 36px;">
              <tr>
                <td style="padding-right:12px;">
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="background:#003d80;border-radius:8px;">
                        <a href="${p.coursesUrl}" style="display:block;padding:13px 24px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;white-space:nowrap;">Browse more courses →</a>
                      </td>
                    </tr>
                  </table>
                </td>
                <td>
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="border:2px solid #003d80;border-radius:8px;">
                        <a href="${p.reviewUrl}" style="display:block;padding:11px 24px;font-size:14px;font-weight:700;color:#003d80;text-decoration:none;white-space:nowrap;">Leave a review →</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:14px;color:#4a5568;line-height:1.6;">— The JissrON team</p>

          </td>
        </tr>

        <!-- Divider -->
        <tr>
          <td style="padding:0 32px;">
            <div style="border-top:1px solid #e2e8f0;"></div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 32px;text-align:center;">
            <p style="margin:0 0 6px;font-size:12px;color:#9ca3af;">You received this because you finished a course on JissrON.</p>
            <p style="margin:0;font-size:12px;color:#9ca3af;"><a href="${p.unsubscribeUrl}" style="color:#6b7280;text-decoration:underline;">Unsubscribe</a></p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Email 5: Live session reminder (T-1h) ────────────────────────────────────

interface LiveSessionReminderParams {
  to: string;
  userName: string;
  sessionTitle: string;
  sessionSlug: string;
  hostName: string;
  startsAt: Date;
  durationMins: number;
}

export async function sendLiveSessionReminder(p: LiveSessionReminderParams): Promise<void> {
  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const sessionUrl = `${base}/live/${p.sessionSlug}`;

  await resend.emails.send({
    from: FROM,
    to: p.to,
    subject: `Starting soon: ${p.sessionTitle}`,
    html: liveSessionReminderHtml({ ...p, sessionUrl }),
  });
}

function liveSessionReminderHtml(
  p: LiveSessionReminderParams & { sessionUrl: string }
) {
  const startHuman = p.startsAt.toUTCString().replace(":00 GMT", " UTC");
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
        <tr>
          <td style="background:#003d80;padding:28px 32px;">
            <p style="margin:0;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">JissrON</p>
            <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,.7);">Live session reminder</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 12px;font-size:16px;color:#081a36;font-weight:600;">Hi ${escHtml(p.userName)},</p>
            <p style="margin:0 0 24px;font-size:14px;color:#4a5568;line-height:1.6;">
              Your session <strong>${escHtml(p.sessionTitle)}</strong> with <strong>${escHtml(p.hostName)}</strong>
              starts in about 1 hour — at <strong>${escHtml(startHuman)}</strong>.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f5ff;border-radius:8px;margin:0 0 28px;">
              <tr>
                <td style="padding:20px 24px;">
                  <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#6b7280;">Session</p>
                  <p style="margin:0;font-size:17px;font-weight:700;color:#003d80;">${escHtml(p.sessionTitle)}</p>
                  <p style="margin:8px 0 0;font-size:12px;color:#6b7280;">${p.durationMins} min · Meeting link opens 15 min before start</p>
                </td>
              </tr>
            </table>
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
              <tr>
                <td style="background:#003d80;border-radius:8px;">
                  <a href="${p.sessionUrl}" style="display:block;padding:14px 32px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">Open session page →</a>
                </td>
              </tr>
            </table>
            <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.5;">
              Can&apos;t make it? You can cancel your seat from the session page so someone else can join.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 32px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">© JissrON. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Shared helper ─────────────────────────────────────────────────────────────

function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
