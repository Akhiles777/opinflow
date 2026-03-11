import * as React from "react";
import Button from "@/components/ui/Button";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-surface-950/80 backdrop-blur-xl border-b border-white/5">
      <div className="h-16 px-8 max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 rounded-md bg-brand" />
          <span className="font-display text-white font-bold text-base">
            ПотокМнений
          </span>
        </div>
        <nav className="hidden lg:flex items-center gap-8 text-sm font-body text-white/40">
          {["Главная", "Респондентам", "Бизнесу", "О нас", "Контакты"].map(
            (label) => (
              <a
                key={label}
                href={`#${label === "Главная" ? "top" : label === "О нас" ? "about" : label === "Контакты" ? "contacts" : label === "Респондентам" ? "respondents" : "business"}`}
                className="hover:text-white transition-colors"
              >
                {label}
              </a>
            )
          )}
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="md">
            Войти
          </Button>
          <Button variant="primary" size="md">
            Регистрация
          </Button>
        </div>
      </div>
    </header>
  );
}
