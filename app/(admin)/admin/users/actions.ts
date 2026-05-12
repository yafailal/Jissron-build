"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import type { Role, UserStatus } from "@prisma/client";

type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized");
  return session;
}

async function logActivity(
  userId: string,
  action: string,
  entityId: string,
  metadata?: object
) {
  try {
    await db.activityLog.create({
      data: { userId, action, entity: "User", entityId, metadata: metadata ?? {} },
    });
  } catch {
    /* non-fatal */
  }
}

function revalidateUsers(id?: string) {
  revalidatePath("/admin/users");
  if (id) revalidatePath(`/admin/users/${id}`);
  revalidatePath("/"); // featured users may appear on homepage
}

// ─── Profile (name / image / bio / featuredTagline) ───────────────────────────

export async function updateUserProfile(
  id: string,
  values: {
    name?: string | null;
    image?: string | null;
    bio?: string | null;
    featuredTagline?: string | null;
  }
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const user = await db.user.findUnique({ where: { id }, select: { id: true } });
    if (!user) return { ok: false, error: "User not found" };

    await db.user.update({
      where: { id },
      data: {
        name: values.name ?? null,
        image: values.image ?? null,
        bio: values.bio ?? null,
        featuredTagline: values.featuredTagline ?? null,
      },
    });
    await logActivity(session.user.id, "USER_PROFILE_UPDATED", id, { fields: Object.keys(values) });
    revalidateUsers(id);
    return { ok: true };
  } catch (err) {
    console.error(err);
    return { ok: false, error: "Failed to update profile" };
  }
}

// ─── Role ─────────────────────────────────────────────────────────────────────

export async function setUserRole(id: string, role: Role): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    if (session.user.id === id && role !== "ADMIN") {
      return { ok: false, error: "You can't demote yourself." };
    }
    const user = await db.user.findUnique({ where: { id }, select: { id: true, role: true } });
    if (!user) return { ok: false, error: "User not found" };
    if (user.role === role) return { ok: true };

    await db.user.update({ where: { id }, data: { role } });
    await logActivity(session.user.id, `USER_ROLE_${role}`, id, { from: user.role, to: role });
    revalidateUsers(id);
    return { ok: true };
  } catch (err) {
    console.error(err);
    return { ok: false, error: "Failed to update role" };
  }
}

// ─── Status (suspend / reactivate) ────────────────────────────────────────────

export async function setUserStatus(id: string, status: UserStatus): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    if (session.user.id === id && status === "SUSPENDED") {
      return { ok: false, error: "You can't suspend yourself." };
    }
    const user = await db.user.findUnique({ where: { id }, select: { id: true } });
    if (!user) return { ok: false, error: "User not found" };

    await db.user.update({ where: { id }, data: { status } });
    // If suspending, invalidate all existing sessions
    if (status === "SUSPENDED") {
      await db.session.deleteMany({ where: { userId: id } });
    }
    await logActivity(session.user.id, `USER_${status}`, id);
    revalidateUsers(id);
    return { ok: true };
  } catch (err) {
    console.error(err);
    return { ok: false, error: "Failed to update status" };
  }
}

// ─── Featured + badges ────────────────────────────────────────────────────────

export async function setUserFeatured(id: string, isFeatured: boolean): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    await db.user.update({ where: { id }, data: { isFeatured } });
    await logActivity(session.user.id, isFeatured ? "USER_FEATURED" : "USER_UNFEATURED", id);
    revalidateUsers(id);
    return { ok: true };
  } catch (err) {
    console.error(err);
    return { ok: false, error: "Failed to update featured status" };
  }
}

export async function setUserBadges(id: string, badges: string[]): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const cleaned = Array.from(
      new Set(badges.map((b) => b.trim()).filter((b) => b.length > 0 && b.length <= 40))
    );
    await db.user.update({ where: { id }, data: { badges: cleaned } });
    await logActivity(session.user.id, "USER_BADGES_UPDATED", id, { badges: cleaned });
    revalidateUsers(id);
    return { ok: true };
  } catch (err) {
    console.error(err);
    return { ok: false, error: "Failed to update badges" };
  }
}

// ─── Permission: Can host live sessions ──────────────────────────────────────

export async function setUserPlatformCut(
  id: string,
  percent: number
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    if (!Number.isInteger(percent) || percent < 0 || percent > 100) {
      return { ok: false, error: "Percent must be a whole number between 0 and 100" };
    }
    const user = await db.user.findUnique({ where: { id }, select: { id: true } });
    if (!user) return { ok: false, error: "User not found" };

    await db.user.update({ where: { id }, data: { platformCutPercent: percent } });
    await logActivity(session.user.id, "USER_PLATFORM_CUT_UPDATED", id, { percent });
    revalidateUsers(id);
    return { ok: true };
  } catch (err) {
    console.error(err);
    return { ok: false, error: "Failed to update platform cut" };
  }
}

export async function setUserCanHostLive(
  id: string,
  canHostLive: boolean
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const user = await db.user.findUnique({ where: { id }, select: { id: true, role: true } });
    if (!user) return { ok: false, error: "User not found" };
    // Admins always implicitly have this — flag is meaningful only for INSTRUCTOR/STUDENT.
    await db.user.update({ where: { id }, data: { canHostLive } });
    await logActivity(
      session.user.id,
      canHostLive ? "USER_CAN_HOST_LIVE_GRANTED" : "USER_CAN_HOST_LIVE_REVOKED",
      id
    );
    revalidateUsers(id);
    return { ok: true };
  } catch (err) {
    console.error(err);
    return { ok: false, error: "Failed to update live-hosting permission" };
  }
}

// ─── Functions: Consulting (create/delete Consultant row) ─────────────────────

export async function toggleUserConsultant(
  id: string,
  enabled: boolean
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const user = await db.user.findUnique({
      where: { id },
      select: { id: true, name: true, consultant: { select: { id: true } } },
    });
    if (!user) return { ok: false, error: "User not found" };

    if (enabled) {
      if (user.consultant) return { ok: true }; // already a consultant
      await db.consultant.create({
        data: {
          userId: id,
          bio: "",
          ratePerSession: 0,
        },
      });
      await logActivity(session.user.id, "USER_CONSULTANT_ENABLED", id);
    } else {
      if (!user.consultant) return { ok: true };
      // Delete consultant — bookings cascade restriction may block. Best-effort:
      await db.consultant.delete({ where: { id: user.consultant.id } }).catch(async () => {
        throw new Error(
          "Consultant has existing bookings. Cancel them first or use Force delete on the Consultants page."
        );
      });
      await logActivity(session.user.id, "USER_CONSULTANT_DISABLED", id);
    }
    revalidateUsers(id);
    revalidatePath("/admin/consultants");
    return { ok: true };
  } catch (err) {
    console.error(err);
    return { ok: false, error: (err as Error).message ?? "Failed to toggle consultant" };
  }
}

// ─── Force sign-out + send fresh magic link (no-password equivalent) ──────────

export async function forceSignOutAndEmail(id: string): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const user = await db.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true },
    });
    if (!user) return { ok: false, error: "User not found" };

    // Invalidate all existing sessions
    await db.session.deleteMany({ where: { userId: id } });

    // Send a fresh magic link via NextAuth Resend provider if configured
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import("resend");
        const client = new Resend(process.env.RESEND_API_KEY);
        const from = process.env.EMAIL_FROM ?? "JissrON <onboarding@resend.dev>";
        // NextAuth's magic-link emission happens via the /api/auth/signin/resend route
        // when the user requests it. As an admin shortcut, we send them a polite email
        // pointing to the sign-in page; they can request the magic link themselves.
        await client.emails.send({
          from,
          to: user.email,
          subject: "Your JissrON session was reset by an admin",
          html: `<p>Hi ${user.name ?? "there"},</p>
                 <p>An administrator has signed you out of all devices on JissrON. To regain access, sign in again at <a href="${process.env.NEXTAUTH_URL ?? "https://jissron.com"}/signin">jissron.com/signin</a>.</p>
                 <p>If you didn't expect this, contact support.</p>`,
        });
      } catch (e) {
        console.error("Email send failed (non-fatal):", e);
      }
    }

    await logActivity(session.user.id, "USER_FORCE_SIGNED_OUT", id);
    revalidateUsers(id);
    return { ok: true };
  } catch (err) {
    console.error(err);
    return { ok: false, error: "Failed to force sign-out" };
  }
}
