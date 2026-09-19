"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ChevronDown, Menu, X } from "lucide-react";
import { CurrencyToggle } from "./CurrencyToggle";
import type { Currency } from "@/lib/currency";
import { useSignInModal } from "@/context/sign-in-modal-context";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

function Logo({ siteName, logoUrl }: { siteName: string; logoUrl: string | null }) {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 shrink-0"
      // Visually pull the logo to 20px from the viewport's left edge. transform (not margin) so the
      // logo's layout slot is unchanged and the search bar / nav items don't shift.
      style={{ transform: "translateX(calc(-1 * (max(0px, (100vw - 1340px) / 2) + 32px) + 20px))" }}
      aria-label={`${siteName} home`}
    >
      {logoUrl ? (
        <Image src={logoUrl} alt={siteName} width={180} height={51} className="h-10 w-auto" priority />
      ) : (
        <>
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
        </>
      )}
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
interface NavCategory { name: string; slug: string; courseCount: number; }

interface MarketingNavProps {
  searchPlaceholder: string;
  siteName: string;
  logoUrl?: string | null;
  categories?: NavCategory[];
  navLinks?: NavLink[];
  currentCurrency: Currency;
}

export function MarketingNav({ searchPlaceholder, siteName, logoUrl = null, categories = [], navLinks = [], currentCurrency }: MarketingNavProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [catsOpen, setCatsOpen] = useState(false);
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
        className={`sticky top-0 z-50 bg-white border-b border-line transition-shadow duration-300 ${
          scrolled ? "shadow-nav" : ""
        }`}
      >
        <div className="wrap flex items-center h-[72px] gap-5">
          <Logo siteName={siteName} logoUrl={logoUrl} />

          {/* Categories — desktop xl+ only */}
          <div
            className="relative hidden xl:flex items-center ml-2"
            // Same visual offset as the logo so Categories stays right next to it (transform: no layout shift)
            style={{ transform: "translateX(calc(-1 * (max(0px, (100vw - 1340px) / 2) + 32px) + 20px))" }}
            onMouseEnter={() => setCatsOpen(true)}
            onMouseLeave={() => setCatsOpen(false)}
          >
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={catsOpen}
              onClick={() => setCatsOpen((o) => !o)}
              onKeyDown={(e) => e.key === "Escape" && setCatsOpen(false)}
              className="flex items-center gap-1.5 text-[13.5px] font-medium text-primary px-3.5 py-2.5 rounded-full hover:bg-bg-hover transition-colors"
            >
              Categories
              <ChevronDown size={10} strokeWidth={2.5} className={`opacity-60 transition-transform ${catsOpen ? "rotate-180" : ""}`} />
            </button>
            {catsOpen && (
              <div role="menu" className="absolute left-0 top-full pt-2 z-50">
                <div className="w-[260px] max-h-[70vh] overflow-y-auto bg-white border border-line rounded-2xl shadow-card-hover p-2">
                  {categories.length === 0 ? (
                    <p className="px-3 py-2 text-[13px] text-muted">No categories yet</p>
                  ) : (
                    categories.map((c) => (
                      <Link
                        key={c.slug}
                        role="menuitem"
                        href={`/courses?category=${c.slug}`}
                        onClick={() => setCatsOpen(false)}
                        className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-[13.5px] font-medium text-ink hover:bg-bg-hover transition-colors"
                      >
                        {c.name}
                        <span className="text-[11.5px] text-muted font-semibold">{c.courseCount}</span>
                      </Link>
                    ))
                  )}
                  <Link
                    href="/courses"
                    onClick={() => setCatsOpen(false)}
                    className="block mt-1 px-3 py-2 border-t border-line text-[13px] font-semibold text-primary hover:underline"
                  >
                    All courses →
                  </Link>
                </div>
              </div>
            )}
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
                className={`text-[13.5px] font-medium text-primary px-3 py-2 rounded-full hover:bg-bg-hover transition-colors${
                  i === navLinks.length - 1 ? " font-semibold border border-primary px-3.5" : ""
                }`}
              >
                {link.label}
              </Link>
            ))}
            <button
              onClick={() => openSignInModal("signin")}
              className="px-[18px] py-[9px] text-[13.5px] font-semibold text-primary border-[1.5px] border-primary rounded-full hover:bg-primary hover:text-white transition-all duration-200"
            >
              Log in
            </button>
            <button
              onClick={() => openSignInModal("signup")}
              className="px-[18px] py-[9px] text-[13.5px] font-bold text-white bg-primary rounded-full hover:bg-primary-hover transition-colors duration-200"
            >
              Sign up
            </button>
          </div>

          {/* Mobile right-side: Log in + hamburger */}
          <div className="flex items-center gap-2 md:hidden ml-auto">
            <button
              onClick={() => openSignInModal("signin")}
              className="px-4 py-2 text-[13px] font-semibold text-primary border-[1.5px] border-primary rounded-full hover:bg-primary hover:text-white transition-all duration-200"
            >
              Log in
            </button>
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className="w-10 h-10 grid place-items-center rounded-full text-primary hover:bg-bg-hover transition-colors"
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
            <DrawerTitle className="text-[15px] font-700 text-ink">Menu</DrawerTitle>
            <button
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
              className="w-8 h-8 grid place-items-center rounded-full text-muted hover:bg-bg-hover hover:text-ink transition-colors"
            >
              <X size={18} />
            </button>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
            {/* Search */}
            <div>
              <p className="text-[11px] font-700 uppercase tracking-[.08em] text-muted mb-2">Search</p>
              <SearchBar placeholder={searchPlaceholder} onSubmit={() => setMenuOpen(false)} />
            </div>

            {/* Navigation links */}
            {navLinks.length > 0 && (
              <div>
                <p className="text-[11px] font-700 uppercase tracking-[.08em] text-muted mb-2">Navigation</p>
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
              <p className="text-[11px] font-700 uppercase tracking-[.08em] text-muted mb-2">Browse</p>
              <Link
                href="/courses"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 text-[14px] font-500 text-ink px-3 py-2.5 rounded-lg hover:bg-bg-hover transition-colors"
              >
                All courses
              </Link>
              {categories.map((c) => (
                <Link
                  key={c.slug}
                  href={`/courses?category=${c.slug}`}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between text-[14px] font-500 text-ink px-3 py-2.5 rounded-lg hover:bg-bg-hover transition-colors"
                >
                  {c.name}
                  <span className="text-[12px] text-muted">{c.courseCount}</span>
                </Link>
              ))}
            </div>

            {/* Currency */}
            <div>
              <p className="text-[11px] font-700 uppercase tracking-[.08em] text-muted mb-2">Currency</p>
              <div className="px-3">
                <CurrencyToggle current={currentCurrency} />
              </div>
            </div>
          </div>

          {/* Sign-in CTAs pinned to bottom */}
          <div className="px-5 py-4 border-t border-line space-y-2">
            <button
              onClick={() => handleSignIn("signup")}
              className="w-full h-11 rounded-full bg-primary text-white font-700 text-sm hover:bg-primary-hover transition-colors"
            >
              Sign up
            </button>
            <button
              onClick={() => handleSignIn("signin")}
              className="w-full h-11 rounded-full border-[1.5px] border-primary text-primary font-600 text-sm hover:bg-primary hover:text-white transition-all duration-200"
            >
              Log in
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
