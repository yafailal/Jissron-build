"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ShoppingCart, ChevronDown } from "lucide-react";
import { CurrencyToggle } from "./CurrencyToggle";
import type { Currency } from "@/lib/currency";

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

function SearchBar({ placeholder }: { placeholder: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
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
  currentCurrency: Currency;
}

export function MarketingNav({ searchPlaceholder, siteName, navLinks = [], currentCurrency }: MarketingNavProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-50 bg-white border-b border-line transition-shadow duration-300 ${
        scrolled ? "shadow-nav" : ""
      }`}
    >
      <div className="wrap flex items-center h-[72px] gap-5">
        <Logo siteName={siteName} />

        {/* Categories button — hidden below 1100px */}
        <div className="hidden xl:flex items-center ml-2">
          <button className="flex items-center gap-1.5 text-[13.5px] font-medium text-primary px-3.5 py-2.5 rounded-lg hover:bg-bg-hover transition-colors">
            Categories
            <ChevronDown size={10} strokeWidth={2.5} className="opacity-60" />
          </button>
        </div>

        <SearchBar placeholder={searchPlaceholder} />

        <div className="flex items-center gap-2 shrink-0">
          <CurrencyToggle current={currentCurrency} />
          {navLinks.map((link, i) => (
            <Link
              key={link.url + i}
              href={link.url}
              className={`hidden md:block text-[13.5px] font-medium text-primary px-3 py-2 rounded-lg hover:bg-bg-hover transition-colors${
                i === navLinks.length - 1 ? " font-semibold border border-primary px-3.5" : ""
              }`}
            >
              {link.label}
            </Link>
          ))}
          <button
            aria-label="Cart"
            className="w-10 h-10 grid place-items-center rounded-full text-primary hover:bg-bg-hover transition-colors"
          >
            <ShoppingCart size={20} strokeWidth={2} />
          </button>
          <Link
            href="/auth/signin"
            className="px-[18px] py-[9px] text-[13.5px] font-semibold text-primary border-[1.5px] border-primary rounded-lg hover:bg-primary hover:text-white transition-all duration-200"
          >
            Log in
          </Link>
          <Link
            href="/auth/signin"
            className="px-[18px] py-[9px] text-[13.5px] font-bold text-white bg-primary rounded-lg hover:bg-primary-hover transition-colors duration-200"
          >
            Sign up
          </Link>
        </div>
      </div>
    </nav>
  );
}
