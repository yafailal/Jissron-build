"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useRouter } from "@/i18n/navigation";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { broadcastAuthChange } from "@/components/TabFocusRefresh";
import { Search, ChevronDown, Menu, X, LogOut, LayoutDashboard, Shield, GraduationCap } from "lucide-react";
import { CurrencyToggle } from "./CurrencyToggle";
import { CategoriesMenu } from "./CategoriesMenu";
import { SocialIcon, hasSocialIcon, type SocialLink } from "./SocialIcon";
import type { Currency } from "@/lib/currency";
import { useSignInModal } from "@/context/sign-in-modal-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

function Logo({ siteName, logoUrl }: { siteName: string; logoUrl?: string | null }) {
  const t = useTranslations("Nav");
  // If a logo image was uploaded in Site Settings, use it.
  // Otherwise fall back to the inline brand SVG so the site never looks empty.
  if (logoUrl) {
    return (
      <Link href="/" className="flex items-center gap-2 shrink-0" style={{ transform: "translateX(calc(-1 * (max(0px, (100vw - 1340px) / 2) + 32px) + 20px))" }} aria-label={t("logoHome", { siteName })}>
        <Image
          src={logoUrl}
          alt={siteName}
          width={180}
          height={51}
          className="h-10 w-auto object-contain"
          priority
        />
      </Link>
    );
  }
  return (
    <Link href="/" className="flex items-center gap-2 shrink-0" style={{ transform: "translateX(calc(-1 * (max(0px, (100vw - 1340px) / 2) + 32px) + 20px))" }} aria-label={t("logoHome", { siteName })}>
      <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
        <path
          d="M 7 9 Q 7 7 9 7 L 13 7 Q 22 7 22 16 L 22 28 L 16 28 L 16 16 Q 16 13 13 13 L 9 13 L 9 28 L 7 28 Z"
          fill="var(--primary)"
        />
        <circle cx="26" cy="26" r="3" fill="var(--primary-hover)" />
      </svg>
      <span className="text-[24px] font-bold text-primary tracking-[-0.01em] leading-none">
        {siteName}
      </span>
    </Link>
  );
}

function SearchBar({ placeholder, onSubmit }: { placeholder: string; onSubmit?: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (q.trim()) {
          router.push(`/courses?search=${encodeURIComponent(q.trim())}`);
          onSubmit?.();
        }
      }}
      className="flex-1 max-w-[720px] mx-2"
    >
      <div className="flex items-center h-11 bg-bg-soft border-[1.5px] border-line-strong rounded-full px-[18px] gap-2 transition-all duration-200 focus-within:border-primary-bright focus-within:ring-[3px] focus-within:ring-[rgba(16,185,129,0.35)] focus-within:bg-white">
        <Search size={18} className="text-muted shrink-0" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-ink font-normal outline-none placeholder:text-muted"
        />
      </div>
    </form>
  );
}

interface NavLink { label: string; url: string; }

interface NavUser {
  name: string | null;
  email: string;
  image: string | null;
  role: "STUDENT" | "INSTRUCTOR" | "ADMIN";
}

interface MenuCategory { id: string; name: string; slug: string }
interface MenuCourse { id: string; title: string; slug: string }

interface MarketingNavProps {
  searchPlaceholder: string;
  siteName: string;
  logoUrl?: string | null;
  navLinks?: NavLink[];
  socialLinks?: SocialLink[];
  categories?: MenuCategory[];
  featuredCourses?: MenuCourse[];
  currentCurrency: Currency;
  user?: NavUser | null;
  /**
   * Visual variant. "default" is the white nav used on public pages.
   * "accent" inverts to a navy bar with white text for the learn experience.
   */
  variant?: "default" | "accent";
}

export function MarketingNav({ searchPlaceholder, siteName, logoUrl, navLinks = [], socialLinks = [], categories = [], featuredCourses = [], currentCurrency, user, variant = "default" }: MarketingNavProps) {
  const t = useTranslations("Nav");
  const accent = variant === "accent";
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  // Only render social links we have an icon for — never show a name fallback.
  const renderableSocialLinks = socialLinks.filter((s) => hasSocialIcon(s.platform));
  const { open: openSignInModal } = useSignInModal();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  function handleSignIn(mode: "signin" | "signup") {
    setMenuOpen(false);
    openSignInModal(mode);
  }

  return (
    <>
      <nav
        className={`sticky top-0 z-50 transition-shadow duration-300 ${
          accent ? "bg-primary-bright text-white border-b border-white/20" : "bg-white border-b border-line"
        } ${scrolled ? "shadow-nav" : ""}`}
      >
        <div className="wrap flex items-center h-[72px] gap-5">
          <Logo siteName={siteName} logoUrl={logoUrl} />

          {/* Categories — desktop xl+ only */}
          <div
            className="hidden xl:flex items-center ml-2"
            // Same visual offset as the logo so Categories sits right next to it (transform: no layout shift)
            style={{ transform: "translateX(calc(-1 * (max(0px, (100vw - 1340px) / 2) + 32px) + 20px))" }}
          >
            <CategoriesMenu categories={categories} featuredCourses={featuredCourses} accent={accent} />
          </div>

          {/* Search bar — hidden on mobile */}
          <div className="hidden md:flex flex-1 min-w-0">
            <SearchBar placeholder={searchPlaceholder} />
          </div>

          {/* Desktop right-side items */}
          <div
            className="hidden md:flex items-center gap-2 shrink-0"
            // Visually push to 20px from the viewport's right edge (transform keeps layout, so the search bar stays put)
            style={{ transform: "translateX(calc(max(0px, (100vw - 1340px) / 2) + 32px - 20px))" }}
          >
            <CurrencyToggle current={currentCurrency} />
            {navLinks.map((link, i) => (
              <Link
                key={link.url + i}
                href={link.url}
                className={`text-[13.5px] font-medium px-3 py-2 rounded-full transition-colors ${
                  accent
                    ? "text-white hover:bg-white/10"
                    : "text-primary hover:bg-bg-hover"
                }${
                  i === navLinks.length - 1
                    ? accent
                      ? " font-semibold border border-white/40 px-3.5"
                      : " font-semibold border border-primary px-3.5"
                    : ""
                }`}
              >
                {link.label}
              </Link>
            ))}
            {renderableSocialLinks.length > 0 && (
              <div className="flex items-center gap-1 ml-1 mr-1">
                {renderableSocialLinks.map((s) => (
                  <a
                    key={s.platform + s.url}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.platform}
                    className={`w-9 h-9 grid place-items-center rounded-full transition-colors ${
                      accent
                        ? "text-white hover:bg-white/10"
                        : "text-primary hover:bg-bg-hover hover:text-primary-bright"
                    }`}
                  >
                    <SocialIcon platform={s.platform} size={16} />
                  </a>
                ))}
              </div>
            )}
            {user ? (
              <UserMenu user={user} />
            ) : (
              <>
                <button
                  onClick={() => openSignInModal("signin")}
                  className={`px-[18px] py-[9px] text-[13.5px] font-semibold border-[1.5px] rounded-full transition-all duration-200 ${
                    accent
                      ? "text-white border-white/60 hover:bg-white hover:text-primary"
                      : "text-primary border-primary hover:bg-primary hover:text-white"
                  }`}
                >
                  {t("logIn")}
                </button>
                <button
                  onClick={() => openSignInModal("signup")}
                  className={`px-[18px] py-[9px] text-[13.5px] font-bold rounded-full transition-colors duration-200 ${
                    accent
                      ? "text-primary bg-white hover:bg-white/90"
                      : "text-white bg-primary hover:bg-primary-hover"
                  }`}
                >
                  {t("signUp")}
                </button>
              </>
            )}
          </div>

          {/* Mobile right-side: Log in / avatar + hamburger */}
          <div className="flex items-center gap-2 md:hidden ml-auto">
            {user ? (
              <UserMenu user={user} compact />
            ) : (
              <button
                onClick={() => openSignInModal("signin")}
                className={`px-4 py-2 text-[13px] font-semibold border-[1.5px] rounded-full transition-all duration-200 ${
                  accent
                    ? "text-white border-white/60 hover:bg-white hover:text-primary"
                    : "text-primary border-primary hover:bg-primary hover:text-white"
                }`}
              >
                {t("logIn")}
              </button>
            )}
            <button
              onClick={() => setMenuOpen(true)}
              aria-label={t("openMenu")}
              className={`w-10 h-10 grid place-items-center rounded-full transition-colors ${
                accent ? "text-white hover:bg-white/10" : "text-primary hover:bg-bg-hover"
              }`}
            >
              <Menu size={22} strokeWidth={2} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile navigation drawer */}
      <Drawer open={menuOpen} onOpenChange={setMenuOpen} direction="left">
        <DrawerContent className="flex flex-col gap-0 p-0">
          <DrawerHeader className="flex items-center justify-between px-5 py-4 border-b border-line">
            <DrawerTitle className="text-[15px] font-700 text-ink">{t("menu")}</DrawerTitle>
            <button
              onClick={() => setMenuOpen(false)}
              aria-label={t("closeMenu")}
              className="w-8 h-8 grid place-items-center rounded-full text-muted hover:bg-bg-hover hover:text-ink transition-colors"
            >
              <X size={18} />
            </button>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
            {/* Search */}
            <div>
              <p className="text-[11px] font-700 uppercase tracking-[.08em] text-muted mb-2">{t("search")}</p>
              <SearchBar placeholder={searchPlaceholder} onSubmit={() => setMenuOpen(false)} />
            </div>

            {/* Navigation links */}
            {navLinks.length > 0 && (
              <div>
                <p className="text-[11px] font-700 uppercase tracking-[.08em] text-muted mb-2">{t("navigation")}</p>
                <div className="flex flex-col gap-1">
                  {navLinks.map((link, i) => (
                    <Link
                      key={link.url + i}
                      href={link.url}
                      onClick={() => setMenuOpen(false)}
                      className="text-[14px] font-500 text-ink px-3 py-2.5 rounded-lg hover:bg-bg-hover transition-colors"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Browse */}
            <div>
              <p className="text-[11px] font-700 uppercase tracking-[.08em] text-muted mb-2">{t("browse")}</p>
              <Link
                href="/courses"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 text-[14px] font-500 text-ink px-3 py-2.5 rounded-lg hover:bg-bg-hover transition-colors"
              >
                {t("allCourses")}
              </Link>
              <Link
                href="/live"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 text-[14px] font-500 text-ink px-3 py-2.5 rounded-lg hover:bg-bg-hover transition-colors"
              >
                {t("liveSessions")}
              </Link>
              <Link
                href="/consultants"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 text-[14px] font-500 text-ink px-3 py-2.5 rounded-lg hover:bg-bg-hover transition-colors"
              >
                {t("consultants")}
              </Link>
              <Link
                href="/contact"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 text-[14px] font-500 text-ink px-3 py-2.5 rounded-lg hover:bg-bg-hover transition-colors"
              >
                {t("contact")}
              </Link>
            </div>

            {/* Currency */}
            <div>
              <p className="text-[11px] font-700 uppercase tracking-[.08em] text-muted mb-2">{t("currency")}</p>
              <div className="px-3">
                <CurrencyToggle current={currentCurrency} />
              </div>
            </div>

            {/* Social */}
            {renderableSocialLinks.length > 0 && (
              <div>
                <p className="text-[11px] font-700 uppercase tracking-[.08em] text-muted mb-2">{t("followUs")}</p>
                <div className="flex items-center gap-2 px-3">
                  {renderableSocialLinks.map((s) => (
                    <a
                      key={s.platform + s.url}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.platform}
                      onClick={() => setMenuOpen(false)}
                      className="w-9 h-9 grid place-items-center border border-line rounded-full text-ink hover:bg-primary hover:text-white hover:border-primary transition-colors"
                    >
                      <SocialIcon platform={s.platform} size={16} />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom CTAs — sign-in for guests, log-out for users */}
          <div className="px-5 py-4 border-t border-line space-y-2">
            {user ? (
              <>
                <Link
                  href={user.role === "ADMIN" ? "/admin" : "/dashboard"}
                  onClick={() => setMenuOpen(false)}
                  className="w-full h-11 flex items-center justify-center rounded-full bg-primary text-white font-700 text-sm hover:bg-primary-hover transition-colors"
                >
                  {user.role === "ADMIN" ? t("adminPanel") : t("myDashboard")}
                </Link>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    (broadcastAuthChange(), signOut({ callbackUrl: "/" }));
                  }}
                  className="w-full h-11 rounded-lg border-[1.5px] border-line-strong text-ink font-600 text-sm hover:border-red-300 hover:text-red-600 transition-all duration-200"
                >
                  {t("logOut")}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleSignIn("signup")}
                  className="w-full h-11 rounded-full bg-primary text-white font-700 text-sm hover:bg-primary-hover transition-colors"
                >
                  {t("signUp")}
                </button>
                <button
                  onClick={() => handleSignIn("signin")}
                  className="w-full h-11 rounded-full border-[1.5px] border-primary text-primary font-600 text-sm hover:bg-primary hover:text-white transition-all duration-200"
                >
                  {t("logIn")}
                </button>
              </>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

function UserMenu({ user, compact = false }: { user: NavUser; compact?: boolean }) {
  const t = useTranslations("Nav");
  const initials = (user.name ?? user.email)
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label={t("accountMenu")}
            className="flex items-center gap-1.5 rounded-full px-1 py-1 hover:bg-bg-hover transition-colors cursor-pointer"
          />
        }
      >
        {user.image ? (
          <Image
            src={user.image}
            alt={user.name ?? user.email}
            width={32}
            height={32}
            className="rounded-full object-cover w-8 h-8"
          />
        ) : (
          <span className="w-8 h-8 rounded-full bg-primary text-white grid place-items-center text-[11px] font-bold">
            {initials}
          </span>
        )}
        {!compact && <ChevronDown size={12} className="text-muted" />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-[12.5px] font-bold text-ink truncate">{user.name ?? user.email}</p>
          <p className="text-[11px] text-muted truncate">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        {user.role === "ADMIN" && (
          <DropdownMenuItem onClick={() => (window.location.href = "/admin")}>
            <Shield className="w-3.5 h-3.5" />
            {t("adminPanel")}
          </DropdownMenuItem>
        )}
        {(user.role === "INSTRUCTOR" || user.role === "ADMIN") && (
          <DropdownMenuItem onClick={() => (window.location.href = "/instructor")}>
            <GraduationCap className="w-3.5 h-3.5" />
            {t("instructorArea")}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => (window.location.href = "/dashboard")}>
          <LayoutDashboard className="w-3.5 h-3.5" />
          {t("myDashboard")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => (broadcastAuthChange(), signOut({ callbackUrl: "/" }))}
        >
          <LogOut className="w-3.5 h-3.5" />
          {t("logOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
