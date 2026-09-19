import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // === AILearn brand palette (Deep Green + Lime) ===
        primary: {
          DEFAULT: "var(--primary)",
          hover: "var(--primary-hover)",
          bright: "var(--primary-bright)",
          mid: "var(--primary-mid)",
          dark: "#081310",
          soft: "#eef6dc",
          softer: "#f6faef",
          foreground: "#ffffff",
        },
        // Neutral backgrounds
        bg: {
          DEFAULT: "#ffffff",
          soft: "#f7f6ef",
          hover: "#efeee4",
        },
        // Text hierarchy
        ink: "var(--ink)",
        "body-text": "#2f3b37",
        muted: "#6b7b72",
        // Borders
        line: {
          DEFAULT: "#d9dcd6",
          strong: "#c3c8c0",
        },
        // Functional
        star: "#a4e635",
        // shadcn/ui compatibility aliases
        border: "#d9dcd6",
        input: "#d9dcd6",
        ring: "rgba(164,230,53,0.35)",
        background: "#ffffff",
        foreground: "#0e1f1a",
        secondary: {
          DEFAULT: "#f7f6ef",
          foreground: "#2f3b37",
        },
        destructive: {
          DEFAULT: "#e53e3e",
          foreground: "#ffffff",
        },
        accent: {
          DEFAULT: "#efeee4",
          foreground: "#0e1f1a",
        },
        popover: {
          DEFAULT: "#ffffff",
          foreground: "#0e1f1a",
        },
        card: {
          DEFAULT: "#ffffff",
          foreground: "#0e1f1a",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      maxWidth: {
        container: "1340px",
      },
      borderRadius: {
        // Design system: buttons = 10px, cards = 12px, pill = 999px
        sm: "6px",
        DEFAULT: "8px",
        md: "8px",
        lg: "10px",
        xl: "12px",
        "2xl": "14px",
        "3xl": "20px",
        full: "9999px",
      },
      boxShadow: {
        card: "0 12px 28px -12px rgba(14,31,26,0.20)",
        "card-hover": "0 16px 36px -12px rgba(14,31,26,0.28)",
        btn: "0 8px 20px -8px rgba(164,230,53,0.55)",
        nav: "0 2px 8px -4px rgba(14,31,26,0.12)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        rise: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        rise: "rise 1s cubic-bezier(0.2, 0.7, 0.1, 1) both",
        "pulse-dot": "pulse-dot 2s ease-in-out infinite",
        marquee: "marquee 35s linear infinite",
      },
      data: { checked: "checked", unchecked: "unchecked" },
    },
  },
  plugins: [],
};

export default config;
