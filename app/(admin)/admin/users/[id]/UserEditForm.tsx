"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import {
  Loader2,
  Save,
  Mail,
  Star,
  AlertTriangle,
  UserCog,
  Headphones,
  X as XIcon,
  ShieldAlert,
} from "lucide-react";
import {
  updateUserProfile,
  setUserRole,
  setUserStatus,
  setUserFeatured,
  setUserBadges,
  setUserCanHostLive,
  setUserPlatformCut,
  toggleUserConsultant,
  forceSignOutAndEmail,
} from "../actions";
import { ImageUploadField } from "@/components/admin/ImageUploadField";

type Role = "STUDENT" | "INSTRUCTOR" | "ADMIN";
type UserStatus = "ACTIVE" | "SUSPENDED";

interface UserData {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  bio: string | null;
  role: Role;
  status: UserStatus;
  isFeatured: boolean;
  featuredTagline: string | null;
  badges: string[];
  canHostLive: boolean;
  platformCutPercent: number;
  hasConsultant: boolean;
  createdAt: Date;
  emailVerified: Date | null;
  _count: { enrollments: number; orders: number; coursesTeaching: number; liveSessions: number };
}

const ROLE_TONE: Record<Role, string> = {
  ADMIN: "bg-primary text-white",
  INSTRUCTOR: "bg-violet-50 text-violet-700 border border-violet-200",
  STUDENT: "bg-bg-soft text-muted border border-line",
};

export function UserEditForm({ user, currentAdminId }: { user: UserData; currentAdminId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Local form state
  const [name, setName] = useState(user.name ?? "");
  const [image, setImage] = useState(user.image ?? "");
  const [bio, setBio] = useState(user.bio ?? "");
  const [featuredTagline, setFeaturedTagline] = useState(user.featuredTagline ?? "");
  const [role, setRole] = useState<Role>(user.role);
  const [status, setStatus] = useState<UserStatus>(user.status);
  const [isFeatured, setIsFeatured] = useState(user.isFeatured);
  const [canHostLive, setCanHostLive] = useState(user.canHostLive);
  const [platformCut, setPlatformCut] = useState(user.platformCutPercent);
  const [hasConsultant, setHasConsultant] = useState(user.hasConsultant);
  const [badges, setBadges] = useState<string[]>(user.badges);
  const [badgeInput, setBadgeInput] = useState("");

  const isSelf = currentAdminId === user.id;

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, successMsg: string) => {
    startTransition(async () => {
      const res = await fn();
      if (res.ok) {
        toast.success(successMsg);
        router.refresh();
      } else {
        toast.error(res.error ?? "Failed");
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      {/* LEFT — Identity card */}
      <div className="lg:col-span-1">
        <Section title="Identity" icon={UserCog}>
          <div className="flex items-center gap-3 mb-3">
            {image ? (
              <Image
                src={image}
                alt={name || user.email}
                width={56}
                height={56}
                className="rounded-full object-cover w-14 h-14"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-primary text-white grid place-items-center text-[18px] font-bold">
                {(name || user.email)[0]?.toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-ink truncate">{name || "—"}</p>
              <p className="text-[11.5px] text-muted truncate">{user.email}</p>
              <span
                className={`inline-flex items-center mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${ROLE_TONE[role]}`}
              >
                {role}
              </span>
            </div>
          </div>
          <Field label="Name">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="Full name"
            />
          </Field>
          <Field label="Avatar">
            <ImageUploadField
              endpoint="userAvatar"
              value={image}
              onChange={setImage}
            />
          </Field>
          <Field label="Bio">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="input"
              placeholder="Optional bio shown on instructor/consultant pages"
            />
          </Field>
          <Field label="Featured tagline">
            <input
              type="text"
              value={featuredTagline}
              onChange={(e) => setFeaturedTagline(e.target.value)}
              className="input"
              placeholder='e.g. "Senior PM at Stripe"'
              maxLength={80}
            />
          </Field>
          <SaveButton
            onClick={() =>
              run(
                () =>
                  updateUserProfile(user.id, {
                    name: name || null,
                    image: image || null,
                    bio: bio || null,
                    featuredTagline: featuredTagline || null,
                  }),
                "Profile updated"
              )
            }
            pending={isPending}
          />
        </Section>

        <Section title="Account stats" icon={ShieldAlert} subtitle="Read-only — for context.">
          <Stat label="Email verified" value={user.emailVerified ? "Yes" : "No"} />
          <Stat label="Created" value={user.createdAt.toLocaleDateString()} />
          <Stat label="Enrollments" value={user._count.enrollments} />
          <Stat label="Orders" value={user._count.orders} />
          <Stat label="Courses teaching" value={user._count.coursesTeaching} />
          <Stat label="Live sessions hosting" value={user._count.liveSessions} />
        </Section>
      </div>

      {/* RIGHT — Controls */}
      <div className="lg:col-span-2 space-y-3">
        {/* Role + status */}
        <Section title="Role & status" icon={UserCog}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Role">
              <select
                value={role}
                onChange={(e) => {
                  const next = e.target.value as Role;
                  setRole(next);
                  run(() => setUserRole(user.id, next), `Role set to ${next}`);
                }}
                className="input"
                disabled={isSelf}
              >
                <option value="STUDENT">Student</option>
                <option value="INSTRUCTOR">Instructor</option>
                <option value="ADMIN">Admin</option>
              </select>
              {isSelf && <p className="text-[10.5px] text-muted mt-0.5">You can't change your own role.</p>}
            </Field>
            <Field label="Status">
              <select
                value={status}
                onChange={(e) => {
                  const next = e.target.value as UserStatus;
                  setStatus(next);
                  run(() => setUserStatus(user.id, next), `User ${next.toLowerCase()}`);
                }}
                className="input"
                disabled={isSelf}
              >
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
              {status === "SUSPENDED" && (
                <p className="text-[10.5px] text-red-600 font-semibold mt-0.5">
                  Suspended — user cannot sign in. Sessions invalidated.
                </p>
              )}
            </Field>
          </div>
        </Section>

        {/* Functions activated */}
        <Section title="Functions activated" icon={Headphones}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Toggle
              label="Can create courses"
              description="Requires role of Instructor or Admin."
              value={role === "INSTRUCTOR" || role === "ADMIN"}
              disabled
            />
            <Toggle
              label="Can host live sessions"
              description={
                role === "ADMIN"
                  ? "Admins can host live sessions by default."
                  : role === "INSTRUCTOR"
                    ? "Toggle to grant or revoke live-hosting access for this instructor."
                    : "Only Instructors or Admins can host live sessions."
              }
              value={role === "ADMIN" ? true : canHostLive}
              onChange={
                role === "INSTRUCTOR"
                  ? (v) => {
                      setCanHostLive(v);
                      run(
                        () => setUserCanHostLive(user.id, v),
                        v ? "Live-hosting enabled" : "Live-hosting revoked"
                      );
                    }
                  : undefined
              }
              disabled={role !== "INSTRUCTOR"}
            />
            <Toggle
              label="Is a consultant"
              description="Toggle to create or remove their consultant profile."
              value={hasConsultant}
              onChange={(v) => {
                setHasConsultant(v);
                run(() => toggleUserConsultant(user.id, v), v ? "Consultant profile created" : "Consultant profile removed");
              }}
            />
          </div>

          {/* Revenue share */}
          <div className="pt-2 mt-2 border-t border-line">
            <Field label="Platform cut">
              <div className="flex flex-wrap items-center gap-2">
                {[25, 30, 35].map((p) => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => {
                      setPlatformCut(p);
                      run(() => setUserPlatformCut(user.id, p), `Platform cut set to ${p}%`);
                    }}
                    className={`h-8 px-3 rounded-md border text-[12.5px] font-bold transition-colors ${
                      platformCut === p
                        ? "bg-primary text-white border-primary"
                        : "bg-white text-ink border-line hover:border-primary hover:text-primary"
                    }`}
                  >
                    {p}%
                  </button>
                ))}
                <span className="text-[11px] text-muted">·</span>
                <div className="inline-flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={platformCut}
                    onChange={(e) => setPlatformCut(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                    onBlur={() => {
                      if (platformCut !== user.platformCutPercent) {
                        run(() => setUserPlatformCut(user.id, platformCut), `Platform cut set to ${platformCut}%`);
                      }
                    }}
                    className="input w-16 text-center"
                  />
                  <span className="text-[12.5px] text-muted">%</span>
                </div>
              </div>
              <p className="text-[10.5px] text-muted mt-1.5">
                Percent of paid course revenue that JissrON keeps. The instructor receives the rest
                (<span className="font-semibold text-ink">{100 - platformCut}%</span>).
                Standard contract tiers are 25%, 30%, or 35% — click a preset or type a custom value.
              </p>
            </Field>
          </div>
        </Section>

        {/* Featured + badges */}
        <Section title="Featured & badges" icon={Star}>
          <Toggle
            label="Featured on the public site"
            description="Surfaces this person on the homepage (top instructors, featured consultants, etc.)."
            value={isFeatured}
            onChange={(v) => {
              setIsFeatured(v);
              run(() => setUserFeatured(user.id, v), v ? "User featured" : "Removed from featured");
            }}
          />
          <Field label="Badges">
            <div className="flex flex-wrap gap-1.5 mb-2 min-h-[24px]">
              {badges.length === 0 && <span className="text-[11px] text-muted">No badges yet.</span>}
              {badges.map((b) => (
                <span
                  key={b}
                  className="inline-flex items-center gap-1 bg-primary-soft text-primary text-[11px] font-semibold px-2 py-0.5 rounded-full"
                >
                  {b}
                  <button
                    type="button"
                    onClick={() => {
                      const next = badges.filter((x) => x !== b);
                      setBadges(next);
                      run(() => setUserBadges(user.id, next), "Badge removed");
                    }}
                    aria-label={`Remove ${b}`}
                    className="hover:text-red-500"
                  >
                    <XIcon className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={badgeInput}
                onChange={(e) => setBadgeInput(e.target.value)}
                placeholder='e.g. "Top Instructor", "Verified"'
                className="input flex-1"
                maxLength={40}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const v = badgeInput.trim();
                    if (!v) return;
                    if (badges.includes(v)) {
                      toast.error("Badge already exists");
                      return;
                    }
                    const next = [...badges, v];
                    setBadges(next);
                    setBadgeInput("");
                    run(() => setUserBadges(user.id, next), "Badge added");
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  const v = badgeInput.trim();
                  if (!v) return;
                  if (badges.includes(v)) {
                    toast.error("Badge already exists");
                    return;
                  }
                  const next = [...badges, v];
                  setBadges(next);
                  setBadgeInput("");
                  run(() => setUserBadges(user.id, next), "Badge added");
                }}
                className="h-8 px-3 rounded-md bg-primary text-white text-[12px] font-bold hover:bg-primary-hover transition-colors"
              >
                Add
              </button>
            </div>
          </Field>
        </Section>

        {/* Admin actions */}
        <Section title="Admin actions" icon={AlertTriangle} subtitle="Destructive or sensitive. Use carefully.">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                if (!window.confirm("Sign this user out of all devices and send them a reset notification email?")) return;
                run(
                  () => forceSignOutAndEmail(user.id),
                  "User signed out of all devices, notification email sent"
                );
              }}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-line text-[12px] font-semibold text-ink hover:bg-bg-soft transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              Force sign-out + email reset
            </button>
          </div>
          <p className="text-[10.5px] text-muted mt-1.5">
            JissrON doesn't use passwords — sign-in is via Google/LinkedIn or email magic link. The closest equivalent
            to a password reset is forcing sign-out of all devices; the user can then sign in again from scratch.
          </p>
        </Section>
      </div>

      <style>{`
        .input {
          width: 100%;
          height: 32px;
          border-radius: 6px;
          border: 1px solid var(--line, #e4e9ef);
          background: #fff;
          padding: 0 8px;
          font-size: 12.5px;
          color: var(--ink, #081a36);
          outline: none;
        }
        textarea.input { height: auto; padding: 6px 8px; font-family: inherit; }
        .input:focus { border-color: var(--primary, #003d80); box-shadow: 0 0 0 2px rgba(0,61,128,0.15); }
      `}</style>
    </div>
  );
}

function Section({
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg border border-line px-4 py-3 mb-3">
      <div className="flex items-start gap-2 mb-3 pb-2 border-b border-line">
        {Icon && (
          <div className="w-7 h-7 rounded-md bg-primary-soft text-primary grid place-items-center shrink-0 mt-0.5">
            <Icon className="w-3.5 h-3.5" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-ink leading-tight">{title}</p>
          {subtitle && <p className="text-[11px] text-muted mt-0.5 leading-snug">{subtitle}</p>}
        </div>
      </div>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10.5px] font-bold text-muted uppercase tracking-[0.05em] block mb-1">{label}</span>
      {children}
    </label>
  );
}

function SaveButton({ onClick, pending }: { onClick: () => void; pending: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-primary text-white text-[12px] font-bold hover:bg-primary-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
      Save profile
    </button>
  );
}

function Toggle({
  label,
  description,
  value,
  onChange,
  disabled,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange?: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => !disabled && onChange?.(!value)}
        disabled={disabled || !onChange}
        className={`mt-0.5 relative w-9 h-5 rounded-full transition-colors shrink-0 ${
          value ? "bg-primary" : "bg-bg-hover"
        } ${disabled || !onChange ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
            value ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </button>
      <div className="min-w-0">
        <p className="text-[12.5px] font-semibold text-ink">{label}</p>
        {description && <p className="text-[11px] text-muted leading-snug mt-0.5">{description}</p>}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between text-[12px] py-0.5">
      <span className="text-muted">{label}</span>
      <span className="font-semibold text-ink">{value}</span>
    </div>
  );
}
