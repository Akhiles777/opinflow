"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

type Props = {
  tone?: "site" | "dash";
};

export default function ThemeToggle({ tone = "site" }: Props) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const isDark = theme === "dark";
  const cls =
    tone === "dash"
      ? "w-9 h-9 rounded-lg border border-dash-border bg-dash-card flex items-center justify-center text-dash-muted hover:text-dash-heading hover:bg-dash-bg transition-all duration-200"
      : "w-9 h-9 rounded-lg border border-site-border bg-site-card flex items-center justify-center text-site-muted hover:text-site-heading hover:bg-site-section transition-all duration-200";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cls}
      aria-label="Переключить тему"
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}
