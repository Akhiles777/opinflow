"use client";

import * as React from "react";
import Image from "next/image";
import { useTheme } from "next-themes";

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
      ? "flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#D8CCFF] bg-[#EFEAFF] transition-all duration-200 hover:bg-[#E7DEFF] dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
      : "flex h-10 w-10 items-center justify-center rounded-[10px] border border-site-border bg-site-card transition-all duration-200 hover:bg-site-section";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cls}
      aria-label="Переключить тему"
    >
      <Image src="/theme.svg" alt="" width={40} height={40} className="block" />
    </button>
  );
}
