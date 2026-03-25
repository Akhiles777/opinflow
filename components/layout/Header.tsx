"use client";

import * as React from "react";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import Button from "@/components/ui/Button";
import ThemeToggle from "@/components/ui/ThemeToggle";
import SmoothHashLink from "@/components/ui/SmoothHashLink";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const links = [
    { label: "Главная", href: "#top" },
    { label: "Респондентам", href: "#respondents" },
    { label: "Бизнесу", href: "#business" },
    { label: "О нас", href: "#about" },
    { label: "Контакты", href: "#contacts" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-site-bg/80 backdrop-blur-xl">
      <div className="h-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex justify-between items-center gap-3">
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
          {links.map((link) => (
            <SmoothHashLink
              key={link.label}
              href={link.href}
              className="hover:text-site-heading transition-colors"
            >
              {link.label}
            </SmoothHashLink>
          ))}
        </nav>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-site-border bg-site-card text-site-heading transition-colors hover:bg-site-section lg:hidden"
            aria-label={mobileMenuOpen ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="hidden items-center gap-2 lg:flex">
            <ThemeToggle />
            <Button variant="ghost" size="md" href="/login">
              Войти
            </Button>
            <Button variant="primary" size="md" href="/register">
              Регистрация
            </Button>
          </div>
        </div>
      </div>

      <div
        className={[
          "bg-site-bg/95 backdrop-blur-xl lg:hidden",
          mobileMenuOpen ? "block" : "hidden",
        ].join(" ")}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6">
          <div className="flex justify-end sm:hidden">
            <ThemeToggle />
          </div>
          <nav className="grid gap-2">
            {links.map((link) => (
              <SmoothHashLink
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl border border-transparent px-3 py-3 text-base font-body text-site-body transition-colors hover:border-site-border hover:bg-site-card hover:text-site-heading"
              >
                {link.label}
              </SmoothHashLink>
            ))}
          </nav>
          <div className="grid grid-cols-1 gap-2 pt-2 sm:grid-cols-2">
            <Button variant="ghost" size="md" href="/login" className="w-full justify-center">
              Войти
            </Button>
            <Button
              variant="primary"
              size="md"
              href="/register"
              className="w-full justify-center"
            >
              Регистрация
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
