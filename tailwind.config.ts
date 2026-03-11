import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: "#4F46E5",
        "brand-light": "#EEF2FF",
        "brand-mid": "#6366F1",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-inter)", "sans-serif"],
      },
      fontSize: {
        "display-2xl": ["clamp(48px, 6vw, 80px)", { lineHeight: "1.05", letterSpacing: "-0.04em" }],
        "display-xl": ["clamp(36px, 4.5vw, 60px)", { lineHeight: "1.08", letterSpacing: "-0.03em" }],
        "display-lg": ["clamp(28px, 3vw, 44px)", { lineHeight: "1.1", letterSpacing: "-0.025em" }],
      },
      animation: {
        "fade-up": "fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-in": "fadeIn 0.5s ease forwards",
        marquee: "marquee 35s linear infinite",
        float: "float 5s ease-in-out infinite",
        "line-grow": "lineGrow 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        lineGrow: {
          "0%": { width: "0%" },
          "100%": { width: "100%" },
        },
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
        "card-lg": "0 4px 6px rgba(0,0,0,0.04), 0 16px 48px rgba(0,0,0,0.08)",
        "card-xl": "0 8px 16px rgba(0,0,0,0.06), 0 32px 80px rgba(0,0,0,0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
