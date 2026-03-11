import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#6366F1",
          light: "#818CF8",
          dark: "#4F46E5",
          glow: "rgba(99,102,241,0.15)",
        },
        surface: {
          950: "#0A0A0F",
          900: "#0F0F1A",
          800: "#16162A",
          700: "#1E1E35",
        },
      },
      fontFamily: {
        display: ["var(--font-syne)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
      },
      fontSize: {
        hero: ["clamp(44px, 6vw, 88px)", { lineHeight: "1.02", letterSpacing: "-0.04em" }],
        title: ["clamp(32px, 4vw, 56px)", { lineHeight: "1.06", letterSpacing: "-0.03em" }],
        heading: ["clamp(22px, 2.5vw, 36px)", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
      },
      animation: {
        "fade-up": "fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        marquee: "marquee 35s linear infinite",
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 2.5s linear infinite",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(30px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shimmer: {
          from: { backgroundPosition: "-200% center" },
          to: { backgroundPosition: "200% center" },
        },
      },
      boxShadow: {
        glow: "0 0 40px rgba(99,102,241,0.2)",
        card: "0 1px 1px rgba(0,0,0,0.3), 0 8px 32px rgba(0,0,0,0.4)",
        "card-lg": "0 4px 6px rgba(0,0,0,0.04), 0 16px 48px rgba(0,0,0,0.5)",
      },
    },
  },
  plugins: [],
};

export default config;
