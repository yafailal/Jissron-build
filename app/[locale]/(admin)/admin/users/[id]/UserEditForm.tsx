"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("AdminUsers");
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
        toast.error(res.error ?? t("form.failed"));
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      {/* LEFT — Identity card */}
      <div className="lg:col-span-1">
        <Section title={t("form.identity")} icon={UserCog}>
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
                {t(`roles.${role}`)}
              </span>
            </div>
          </div>
          <Field label={t("form.name")}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder={t("form.fullName")}
            />
          </Field>
          <Field label={t("form.avatar")}>
            <ImageUploadField
              endpoint="userAvatar"
              value={image}
              onChange={setImage}
            />
          </Field>
          <Field label={t("form.bio")}>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="input"
              placeholder={t("form.bioPlaceholder")}
            />
          </Field>
          <Field label={t("form.featuredTagline")}>
            <input
              type="text"
              value={featuredTagline}
              onChange={(e) => setFeaturedTagline(e.target.value)}
              className="input"
              placeholder={t("form.taglinePlaceholder")}
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
                t("form.profileUpdated")
              )
            }
            pending={isPending}
          />
        </Section>

        <Section title={t("form.accountStats")} icon={ShieldAlert} subtitle={t("form.readOnly")}>
          <Stat label={t("form.emailVerified")} value={user.emailVerified ? t("form.yes") : t("form.no")} />
          <Stat label={t("form.created")} value={user.createdAt.toLocaleDateString()} />
          <Stat label={t("form.enrollments")} value={user._count.enrollments} />
          <Stat label={t("form.orders")} value={user._count.orders} />
          <Stat label={t("form.coursesTeaching")} value={user._count.coursesTeaching} />
          <Stat label={t("form.liveHosting")} value={user._count.liveSessions} />
        </Section>
      </div>

      {/* RIGHT — Controls */}
      <div className="lg:col-span-2 space-y-3">
        {/* Role + status */}
        <Section title={t("form.roleStatus")} icon={UserCog}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label={t("filters.role")}>
              <select
                value={role}
                onChange={(e) => {
                  const next = e.target.value as Role;
                  setRole(next);
                  run(() => setUserRole(user.id, next), t(`form.roleSet.${next}`));
                }}
                className="input"
                disabled={isSelf}
              >
                <option value="STUDENT">{t("roles.STUDENT")}</option>
                <option value="INSTRUCTOR">{t("roles.INSTRUCTOR")}</option>
                <option value="ADMIN">{t("roles.ADMIN")}</option>
              </select>
              {isSelf && <p className="text-[10.5px] text-muted mt-0.5">{t("form.cantChangeRole")}</p>}
            </Field>
            <Field label={t("filters.status")}>
              <select
                value={status}
                onChange={(e) => {
                  const next = e.target.value as UserStatus;
                  setStatus(next);
                  run(() => setUserStatus(user.id, next), t(`form.userStatusSet.${next}`));
                }}
                className="input"
                disabled={isSelf}
              >
                <option value="ACTIVE">{t("statuses.ACTIVE")}</option>
                <option value="SUSPENDED">{t("statuses.SUSPENDED")}</option>
              </select>
              {status === "SUSPENDED" && (
                <p className="text-[10.5px] text-red-600 font-semibold mt-0.5">
                  {t("form.suspendedNotice")}
                </p>
              )}
            </Field>
          </div>
        </Section>

        {/* Functions activated */}
        <Section title={t("form.functions")} icon={Headphones}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Toggle
              label={t("form.canCreateCourses")}
              description={t("form.canCreateCoursesDesc")}
              value={role === "INSTRUCTOR" || role === "ADMIN"}
              disabled
            />
            <Toggle
              label={t("form.canHostLive")}
              description={
                role === "ADMIN"
                  ? t("form.hostAdminDesc")
                  : role === "INSTRUCTOR"
                    ? t("form.hostInstructorDesc")
                    : t("form.hostOtherDesc")
              }
              value={role === "ADMIN" ? true : canHostLive}
              onChange={
                role === "INSTRUCTOR"
                  ? (v) => {
                      setCanHostLive(v);
                      run(
                        () => setUserCanHostLive(user.id, v),
                        v ? t("form.hostEnabled") : t("form.hostRevoked")
                      );
                    }
                  : undefined
              }
              disabled={role !== "INSTRUCTOR"}
            />
            <Toggle
              label={t("form.isConsultant")}
              description={t("form.isConsultantDesc")}
              value={hasConsultant}
              onChange={(v) => {
                setHasConsultant(v);
                run(() => toggleUserConsultant(user.id, v), v ? t("form.consultantCreated") : t("form.consultantRemoved"));
              }}
            />
          </div>

          {/* Revenue share */}
          <div className="pt-2 mt-2 border-t border-line">
            <Field label={t("form.platformCut")}>
              <div className="flex flex-wrap items-center gap-2">
                {[25, 30, 35].map((p) => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => {
                      setPlatformCut(p);
                      run(() => setUserPlatformCut(user.id, p), t("form.cutSet", { percent: p }));
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
                        run(() => setUserPlatformCut(user.id, platformCut), t("form.cutSet", { percent: platformCut }));
                      }
                    }}
                    className="input w-16 text-center"
                  />
                  <span className="text-[12.5px] text-muted">%</span>
                </div>
              </div>
              <p className="text-[10.5px] text-muted mt-1.5">
                {t.rich("form.cutHelp", {
                  percent: 100 - platformCut,
                  b: (chunks) => <span className="font-semibold text-ink">{chunks}</span>,
                })}
              </p>
            </Field>
          </div>
        </Section>

        {/* Featured + badges */}
        <Section title={t("form.featuredBadges")} icon={Star}>
          <Toggle
            label={t("form.featuredPublic")}
            description={t("form.featuredPublicDesc")}
            value={isFeatured}
            onChange={(v) => {
              setIsFeatured(v);
              run(() => setUserFeatured(user.id, v), v ? t("form.userFeatured") : t("form.removedFeatured"));
            }}
          />
          <Field label={t("colBadges")}>
            <div className="flex flex-wrap gap-1.5 mb-2 min-h-[24px]">
              {badges.length === 0 && <span className="text-[11px] text-muted">{t("form.noBadges")}</span>}
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
                      run(() => setUserBadges(user.id, next), t("form.badgeRemoved"));
                    }}
                    aria-label={t("form.removeBadge", { badge: b })}
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
                placeholder={t("form.badgePlaceholder")}
                className="input flex-1"
                maxLength={40}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const v = badgeInput.trim();
                    if (!v) return;
                    if (badges.includes(v)) {
                      toast.error(t("form.badgeExists"));
                      return;
                    }
                    const next = [...badges, v];
                    setBadges(next);
                    setBadgeInput("");
                    run(() => setUserBadges(user.id, next), t("form.badgeAdded"));
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  const v = badgeInput.trim();
                  if (!v) return;
                  if (badges.includes(v)) {
                    toast.error(t("form.badgeExists"));
                    return;
                  }
                  const next = [...badges, v];
                  setBadges(next);
                  setBadgeInput("");
                  run(() => setUserBadges(user.id, next), t("form.badgeAdded"));
                }}
                className="h-8 px-3 rounded-md bg-primary text-white text-[12px] font-bold hover:bg-primary-hover transition-colors"
              >
                {t("form.add")}
              </button>
            </div>
          </Field>
        </Section>

        {/* Admin actions */}
        <Section title={t("form.adminActions")} icon={AlertTriangle} subtitle={t("form.adminActionsDesc")}>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                if (!window.confirm(t("form.forceConfirm"))) return;
                run(
                  () => forceSignOutAndEmail(user.id),
                  t("form.forceDone")
                );
              }}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-line text-[12px] font-semibold text-ink hover:bg-bg-soft transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              {t("form.forceButton")}
            </button>
          </div>
          <p className="text-[10.5px] text-muted mt-1.5">
            {t("form.noPasswords")}
          </p>
        </Section>
      </div>

      <style>{`
        .input {
          width: 100%;
          height: 32px;
          border-radius: 6px;
          border: 1px solid var(--line, #d9dcd6);
          background: #fff;
          padding: 0 8px;
          font-size: 12.5px;
          color: var(--ink, #064e3b);
          outline: none;
        }
        textarea.input { height: auto; padding: 6px 8px; font-family: inherit; }
        .input:focus { border-color: var(--primary, #064e3b); box-shadow: 0 0 0 2px rgba(6,78,59,0.15); }
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
  const t = useTranslations("AdminUsers");
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-primary text-white text-[12px] font-bold hover:bg-primary-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
      {t("form.saveProfile")}
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
