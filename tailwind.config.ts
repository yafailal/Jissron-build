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
        // === Atlas Blue brand palette ===
        primary: {
          DEFAULT: "var(--primary)",
          hover: "var(--primary-hover)",
          bright: "var(--primary-bright)",
          dark: "#002a5a",
          soft: "#e8eff8",
          softer: "#f3f6fb",
          foreground: "#ffffff",
        },
        // Neutral backgrounds
        bg: {
          DEFAULT: "#ffffff",
          soft: "#f6f9fd",
          hover: "#edf2f9",
        },
        // Text hierarchy
        ink: "var(--ink)",
        "body-text": "#2a3a54",
        muted: "#6a7890",
        // Borders
        line: {
          DEFAULT: "#e4e9ef",
          strong: "#cfd7e1",
        },
        // Functional
        star: "#b4754a",
        // shadcn/ui compatibility aliases
        border: "#e4e9ef",
        input: "#e4e9ef",
        ring: "rgba(0,88,184,0.25)",
        background: "#ffffff",
        foreground: "#081a36",
        secondary: {
          DEFAULT: "#f6f9fd",
          foreground: "#2a3a54",
        },
        destructive: {
          DEFAULT: "#e53e3e",
          foreground: "#ffffff",
        },
        accent: {
          DEFAULT: "#edf2f9",
          foreground: "#081a36",
        },
        popover: {
          DEFAULT: "#ffffff",
          foreground: "#081a36",
        },
        card: {
          DEFAULT: "#ffffff",
          foreground: "#081a36",
        },
      },
      fontFamily: {
        sans: ["var(--font-montserrat)", "Montserrat", "ui-sans-serif", "system-ui", "sans-serif"],
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
        card: "0 12px 28px -12px rgba(0,61,128,0.20)",
        "card-hover": "0 16px 36px -12px rgba(0,61,128,0.28)",
        btn: "0 8px 20px -8px rgba(0,113,227,0.55)",
        nav: "0 2px 8px -4px rgba(0,113,227,0.12)",
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
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        rise: "rise 1s cubic-bezier(0.2, 0.7, 0.1, 1) both",
        "pulse-dot": "pulse-dot 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
