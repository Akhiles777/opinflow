"use client";

import * as React from "react";
import Button from "@/components/ui/Button";

export default function Header() {
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={[
        "sticky top-0 z-50 h-16",
        scrolled
          ? "bg-white/90 backdrop-blur-md border-b border-gray-100"
          : "bg-transparent",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brand inline-block" />
          <span className="font-display text-gray-900 text-base">OpinionFlow</span>
        </div>
        <nav className="hidden lg:flex items-center gap-8 text-sm text-gray-500">
          {["Главная", "Респондентам", "Бизнесу", "О нас", "Контакты"].map(
            (label) => (
              <a
                key={label}
                href={`#${label === "Главная" ? "top" : label === "О нас" ? "about" : label === "Контакты" ? "contacts" : label === "Респондентам" ? "respondents" : "business"}`}
                className="hover:text-gray-900 transition-colors"
              >
                {label}
              </a>
            )
          )}
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            Войти
          </Button>
          <Button variant="primary" size="sm">
            Регистрация
          </Button>
        </div>
      </div>
    </header>
  );
}
