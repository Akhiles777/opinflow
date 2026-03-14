import * as React from "react";
import Image from "next/image";
import Button from "@/components/ui/Button";
import ThemeToggle from "@/components/ui/ThemeToggle";
import SmoothHashLink from "@/components/ui/SmoothHashLink";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-site-bg/80 backdrop-blur-xl border-b border-site-border">
      <div className="h-16 px-8 max-w-7xl mx-auto flex justify-between items-center">
       <a href="/">
         <div className="flex items-center gap-2.5">
          <div className="relative h-10 w-10 overflow-hidden">
            <Image
              src="/favicon.png"
              alt="ПотокМнений"
              fill
              sizes="40px"
              className="object-contain"
              priority
            />
          </div>
          <span className="font-display text-site-heading font-bold text-base">
            ПотокМнений
          </span>
        </div>
       </a>
        <nav className="hidden lg:flex items-center gap-8 text-sm font-body text-site-muted">
          {["Главная", "Респондентам", "Бизнесу", "О нас", "Контакты"].map(
            (label) => (
              <SmoothHashLink
                key={label}
                href={`#${label === "Главная" ? "top" : label === "О нас" ? "about" : label === "Контакты" ? "contacts" : label === "Респондентам" ? "respondents" : "business"}`}
                className="hover:text-site-heading transition-colors"
              >
                {label}
              </SmoothHashLink>
            )
          )}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
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
