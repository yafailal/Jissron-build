"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ShoppingCart, ChevronDown, Menu, X } from "lucide-react";
import { CurrencyToggle } from "./CurrencyToggle";
import { SocialIcon, type SocialLink } from "./SocialIcon";
import type { Currency } from "@/lib/currency";
import { useSignInModal } from "@/context/sign-in-modal-context";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

function Logo({ siteName }: { siteName: string }) {
  return (
    <Link href="/" className="flex items-center gap-2 shrink-0" aria-label={`${siteName} home`}>
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
          router.push(`/search?q=${encodeURIComponent(q.trim())}`);
          onSubmit?.();
        }
      }}
      className="flex-1 max-w-[560px] mx-2"
    >
      <div className="flex items-center h-11 bg-bg-soft border-[1.5px] border-line-strong rounded-full px-[18px] gap-2 transition-all duration-200 focus-within:border-primary-bright focus-within:ring-[3px] focus-within:ring-[rgba(0,88,184,0.18)] focus-within:bg-white">
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

interface MarketingNavProps {
  searchPlaceholder: string;
  siteName: string;
  navLinks?: NavLink[];
  socialLinks?: SocialLink[];
  currentCurrency: Currency;
}

export function MarketingNav({ searchPlaceholder, siteName, navLinks = [], socialLinks = [], currentCurrency }: MarketingNavProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { open: openSignInModal } = useSignInModal();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  function handleSignIn() {
    setMenuOpen(false);
    openSignInModal();
  }

  return (
    <>
      <nav
        className={`sticky top-0 z-50 bg-white border-b border-line transition-shadow duration-300 ${
          scrolled ? "shadow-nav" : ""
        }`}
      >
        <div className="wrap flex items-center h-[72px] gap-5">
          <Logo siteName={siteName} />

          {/* Categories — desktop xl+ only */}
          <div className="hidden xl:flex items-center ml-2">
            <button className="flex items-center gap-1.5 text-[13.5px] font-medium text-primary px-3.5 py-2.5 rounded-lg hover:bg-bg-hover transition-colors">
              Categories
              <ChevronDown size={10} strokeWidth={2.5} className="opacity-60" />
            </button>
          </div>

          {/* Search bar — hidden on mobile */}
          <div className="hidden md:flex flex-1 min-w-0">
            <SearchBar placeholder={searchPlaceholder} />
          </div>

          {/* Desktop right-side items */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <CurrencyToggle current={currentCurrency} />
            {navLinks.map((link, i) => (
              <Link
                key={link.url + i}
                href={link.url}
                className={`text-[13.5px] font-medium text-primary px-3 py-2 rounded-lg hover:bg-bg-hover transition-colors${
                  i === navLinks.length - 1 ? " font-semibold border border-primary px-3.5" : ""
                }`}
              >
                {link.label}
              </Link>
            ))}
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-1 ml-1 mr-1">
                {socialLinks.map((s) => (
                  <a
                    key={s.platform + s.url}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.platform}
                    className="w-9 h-9 grid place-items-center rounded-full text-primary hover:bg-bg-hover hover:text-primary-bright transition-colors"
                  >
                    <SocialIcon platform={s.platform} size={16} />
                  </a>
                ))}
              </div>
            )}
            <button
              aria-label="Cart"
              className="w-10 h-10 grid place-items-center rounded-full text-primary hover:bg-bg-hover transition-colors"
            >
              <ShoppingCart size={20} strokeWidth={2} />
            </button>
            <button
              onClick={openSignInModal}
              className="px-[18px] py-[9px] text-[13.5px] font-semibold text-primary border-[1.5px] border-primary rounded-lg hover:bg-primary hover:text-white transition-all duration-200"
            >
              Log in
            </button>
            <button
              onClick={openSignInModal}
              className="px-[18px] py-[9px] text-[13.5px] font-bold text-white bg-primary rounded-lg hover:bg-primary-hover transition-colors duration-200"
            >
              Sign up
            </button>
          </div>

          {/* Mobile right-side: Log in + hamburger */}
          <div className="flex items-center gap-2 md:hidden ml-auto">
            <button
              onClick={openSignInModal}
              className="px-4 py-2 text-[13px] font-semibold text-primary border-[1.5px] border-primary rounded-lg hover:bg-primary hover:text-white transition-all duration-200"
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
            </div>

            {/* Currency */}
            <div>
              <p className="text-[11px] font-700 uppercase tracking-[.08em] text-muted mb-2">Currency</p>
              <div className="px-3">
                <CurrencyToggle current={currentCurrency} />
              </div>
            </div>

            {/* Social */}
            {socialLinks.length > 0 && (
              <div>
                <p className="text-[11px] font-700 uppercase tracking-[.08em] text-muted mb-2">Follow us</p>
                <div className="flex items-center gap-2 px-3">
                  {socialLinks.map((s) => (
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

            {/* Cart */}
            <div>
              <button className="flex items-center gap-2.5 text-[14px] font-500 text-ink px-3 py-2.5 rounded-lg hover:bg-bg-hover transition-colors w-full text-left">
                <ShoppingCart size={16} strokeWidth={2} className="text-muted" />
                Cart
              </button>
            </div>
          </div>

          {/* Sign-in CTAs pinned to bottom */}
          <div className="px-5 py-4 border-t border-line space-y-2">
            <button
              onClick={handleSignIn}
              className="w-full h-11 rounded-lg bg-primary text-white font-700 text-sm hover:bg-primary-hover transition-colors"
            >
              Sign up
            </button>
            <button
              onClick={handleSignIn}
              className="w-full h-11 rounded-lg border-[1.5px] border-primary text-primary font-600 text-sm hover:bg-primary hover:text-white transition-all duration-200"
            >
              Log in
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
