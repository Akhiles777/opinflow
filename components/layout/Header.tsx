"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";

import SmoothHashLink from "@/components/ui/SmoothHashLink";
import PublicUserMenu from "@/components/layout/PublicUserMenu";
import type { Role } from "@prisma/client";

function getDashboardHref(role?: Role | null) {
  if (role === "ADMIN")  return "/admin";
  if (role === "CLIENT") return "/client";
  return "/respondent";
}

function getInitialsMobile(name?: string | null, email?: string | null) {
  const src = (name?.trim() || email?.split("@")[0] || "PM");
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "PM";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

const links = [
  { label: "Главная",      href: "/#top" },
  { label: "Респондентам", href: "/respondents" },
  { label: "Бизнесу",     href: "/#business" },
  { label: "О нас",       href: "/#about" },
  { label: "Контакты",    href: "/#contacts" },
];

export default function Header({ dark: _dark }: { dark?: boolean } = {}) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const { data: session, status } = useSession();
  const { theme, setTheme } = useTheme();

  const user =
    status === "authenticated" && session?.user
      ? {
          name:  session.user.name  ?? "Пользователь",
          email: session.user.email ?? "",
          image: session.user.image ?? null,
          role:  session.user.role,
        }
      : null;

  return (
    <header className="relative z-50 bg-transparent">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="flex h-[104px] items-center justify-between gap-4">

          {/* ─── LOGO ─── */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <div className="relative h-[72px] w-[72px]">
              <Image src="/logo2.png" alt="ПотокМнений" fill className="object-contain" priority />
            </div>
            <span className="text-[20px] font-medium tracking-[-0.04em] text-[#2B1B67] dark:text-white hidden sm:block">
              ПотокМнений
            </span>
          </Link>

          {/* ─── DESKTOP NAV ─── */}
          <nav className="hidden lg:flex items-center gap-8 xl:gap-11 flex-1 justify-center">
            {links.map((link) => (
              <SmoothHashLink
                key={link.label}
                href={link.href}
                className="text-[16px] xl:text-[17px] font-medium transition-colors text-[#6E6884] hover:text-[#2B1B67] dark:text-white/70 dark:hover:text-white whitespace-nowrap"
              >
                {link.label}
              </SmoothHashLink>
            ))}
          </nav>

          {/* ─── DESKTOP ACTIONS ─── */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">

            {/* THEME TOGGLE */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Переключить тему"
              className="shrink-0 flex items-center justify-center hover:opacity-75 transition-opacity duration-200"
            >
              <Image
                src="/theme.svg"
                alt=""
                width={40}
                height={40}
                className="block"
              />
            </button>

            {user ? (
              <PublicUserMenu {...user} />
            ) : (
              <>
                <Link
                  href="/login"
                  className="h-11 px-6 rounded-[14px] border flex items-center justify-center text-[15px] font-medium transition-all duration-200 border-[#DDD5F5] bg-[#F5F2FF] text-[#2B1B67] hover:border-[#C7BAF2] hover:bg-white dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/18 whitespace-nowrap"
                >
                  Войти
                </Link>
                <Link
                  href="/register"
                  className="h-11 px-6 rounded-[14px] border border-[#D7EC3A] bg-[linear-gradient(180deg,#E5F667_0%,#D9F326_100%)] flex items-center justify-center text-[15px] font-medium text-[#1C0C4C] transition-all duration-200 hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(217,243,38,0.25)] whitespace-nowrap"
                >
                  Регистрация
                </Link>
              </>
            )}
          </div>

          {/* ─── MOBILE BURGER ─── */}
          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Меню"
            className="lg:hidden flex h-11 w-11 items-center justify-center rounded-[14px] border border-[#DDD5F5] bg-white dark:border-white/20 dark:bg-white/10 shrink-0"
          >
            {mobileMenuOpen
              ? <X    className="h-5 w-5 text-[#2B1B67] dark:text-white" />
              : <Menu className="h-5 w-5 text-[#2B1B67] dark:text-white" />
            }
          </button>
        </div>

        {/* ─── MOBILE MENU ─── */}
        {mobileMenuOpen && (
          <div className="lg:hidden mb-4 rounded-[28px] border p-5 border-[#E4DEF7] bg-white shadow-[0_20px_60px_rgba(45,20,90,0.08)] dark:border-white/12 dark:bg-[#1A0A4A] dark:shadow-[0_20px_60px_rgba(0,0,0,0.3)]">

            {/* Навигация */}
            <div className="flex flex-col gap-4">
              {links.map((link) => (
                <SmoothHashLink
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-[17px] font-medium text-[#4B416D] dark:text-white/80"
                >
                  {link.label}
                </SmoothHashLink>
              ))}
            </div>

            {/* Переключатель темы */}
            <div className="mt-5 flex items-center justify-between py-3 border-t border-[#EDE8F8] dark:border-white/10">
              <span className="text-[15px] text-[#6E6884] dark:text-white/55">Тема сайта</span>
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="flex items-center justify-center hover:opacity-75 transition-opacity duration-200"
              >
                <Image src="/theme.svg" alt="" width={40} height={40} className="block" />
              </button>
            </div>

            {/* Войти / Регистрация — для незалогиненных */}
            {!user ? (
              <div className="mt-3 flex flex-col gap-3">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="h-[46px] rounded-[14px] border flex items-center justify-center text-[16px] font-medium border-[#DDD5F5] bg-[#F5F2FF] text-[#2B1B67] dark:border-white/20 dark:bg-white/10 dark:text-white"
                >
                  Войти
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="h-[46px] rounded-[14px] border border-[#D7EC3A] bg-[linear-gradient(180deg,#E5F667_0%,#D9F326_100%)] flex items-center justify-center text-[16px] font-medium text-[#1C0C4C]"
                >
                  Регистрация
                </Link>
              </div>
            ) : (
              /* Пользователь залогинен — показываем кабинет и выход */
              <div className="mt-3 flex flex-col gap-3 border-t border-[#EDE8F8] pt-4 dark:border-white/10">
                <div className="flex items-center gap-3 px-1">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#6438D9]/30 bg-[#F0ECFF] dark:border-[#A98BFF]/40 dark:bg-white/10">
                    {user.image ? (
                      <img src={user.image} alt={user.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-[12px] font-bold text-[#6438D9] dark:text-[#A98BFF]">
                        {getInitialsMobile(user.name, user.email)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold text-[#2B1B67] dark:text-white">{user.name}</p>
                    <p className="truncate text-[12px] text-[#6E6884] dark:text-white/50">{user.email}</p>
                  </div>
                </div>

                <Link
                  href={getDashboardHref(user.role)}
                  onClick={() => setMobileMenuOpen(false)}
                  className="h-[46px] rounded-[14px] border flex items-center justify-center text-[16px] font-medium border-[#DDD5F5] bg-[#F5F2FF] text-[#2B1B67] dark:border-white/20 dark:bg-white/10 dark:text-white"
                >
                  Мой кабинет
                </Link>
                <a
                  href="/logout"
                  className="h-[46px] rounded-[14px] border flex items-center justify-center text-[16px] font-medium border-[#EDE8F8] text-[#6E6884] transition-colors hover:border-[#FFCCCC] hover:bg-[#FFF0F0] hover:text-[#C0392B] dark:border-white/12 dark:text-white/55 dark:hover:text-red-400"
                >
                  Выйти
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
