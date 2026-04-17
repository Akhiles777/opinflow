"use client";

import * as React from "react";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import {
  BarChart3,
  FilePlus2,
  LayoutDashboard,
  ListChecks,
  Shield,
  Users,
  Wallet,
  Settings,
  GraduationCap,
  Search,
  ClipboardList,
  User,
  UserPlus,
} from "lucide-react";
import type { DashboardViewer } from "@/lib/dashboard-data";
import SignOutButton from "@/components/auth/SignOutButton";

type NavItem = { label: string; href: string; icon: React.ReactNode };
type NavSection = { title: string; items: NavItem[] };

function isActive(pathname: string, searchParams: URLSearchParams | null, href: string) {
  const [hrefPath, hrefQuery] = href.split("?");
  if (href === "/respondent" || href === "/client" || href === "/admin") {
    return pathname === hrefPath;
  }

  if (hrefQuery) {
    const expected = new URLSearchParams(hrefQuery);
    if (pathname !== hrefPath) {
      return false;
    }

    return Array.from(expected.entries()).every(([key, value]) => searchParams?.get(key) === value);
  }

  return pathname === hrefPath || pathname.startsWith(`${hrefPath}/`);
}

function roleForPath(pathname: string): "respondent" | "client" | "admin" {
  if (pathname.startsWith("/client")) return "client";
  if (pathname.startsWith("/admin")) return "admin";
  return "respondent";
}

const respondentNav: NavSection[] = [
  {
    title: "Респондент",
    items: [
      { label: "Обзор", href: "/respondent", icon: <LayoutDashboard className="w-4 h-4" /> },
      { label: "Лента опросов", href: "/surveys", icon: <ClipboardList className="w-4 h-4" /> },
      { label: "Мои опросы", href: "/surveys?tab=mine", icon: <ListChecks className="w-4 h-4" /> },
    ],
  },
  {
    title: "Финансы",
    items: [
      { label: "Кошелёк", href: "/respondent/wallet", icon: <Wallet className="w-4 h-4" /> },
      { label: "Рефералы", href: "/respondent/referral", icon: <UserPlus className="w-4 h-4" /> },
      { label: "Профиль", href: "/respondent/profile", icon: <User className="w-4 h-4" /> },
    ],
  },
];

const clientNav: NavSection[] = [
  {
    title: "Заказчик",
    items: [
      { label: "Обзор", href: "/client", icon: <LayoutDashboard className="w-4 h-4" /> },
      { label: "Мои опросы", href: "/client/surveys", icon: <Search className="w-4 h-4" /> },
      { label: "Создать опрос", href: "/client/surveys/create", icon: <FilePlus2 className="w-4 h-4" /> },
    ],
  },
  {
    title: "Финансы",
    items: [
      { label: "Кошелёк", href: "/client/wallet", icon: <Wallet className="w-4 h-4" /> },
      { label: "Настройки", href: "/client/settings", icon: <Settings className="w-4 h-4" /> },
    ],
  },
];

const adminNav: NavSection[] = [
  {
    title: "Администратор",
    items: [
      { label: "Обзор", href: "/admin", icon: <LayoutDashboard className="w-4 h-4" /> },
      { label: "Модерация", href: "/admin/moderation", icon: <Shield className="w-4 h-4" /> },
      { label: "Пользователи", href: "/admin/users", icon: <Users className="w-4 h-4" /> },
      { label: "Эксперты", href: "/admin/experts", icon: <GraduationCap className="w-4 h-4" /> },
      { label: "Финансы", href: "/admin/finance", icon: <BarChart3 className="w-4 h-4" /> },
    ],
  },
];

export default function Sidebar({
  viewer,
  mobileMenuOpen,
  onCloseMobileMenu,
}: {
  viewer: DashboardViewer;
  mobileMenuOpen: boolean;
  onCloseMobileMenu: () => void;
}) {
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const role = roleForPath(pathname);
  const sections = role === "client" ? clientNav : role === "admin" ? adminNav : respondentNav;

  return (
    <>
      <button
        type="button"
        aria-label="Закрыть меню"
        onClick={onCloseMobileMenu}
        className={[
          "fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden",
          mobileMenuOpen ? "opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
      />

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-[280px] max-w-[86vw] shrink-0 flex-col border-r border-white/5 bg-dash-sidebar transition-transform duration-300 lg:static lg:z-auto lg:w-64 lg:max-w-none lg:translate-x-0",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/5 px-4 sm:px-6">
        <a href="/" className="flex items-center gap-2.5">
          <div className="relative w-7 h-7 overflow-hidden">
            <Image src="/favicon.png" alt="ПотокМнений" fill sizes="28px" className="object-contain" priority />
          </div>
          <span className="font-display text-white font-bold text-base">ПотокМнений</span>
        </a>
        <button
          type="button"
          onClick={onCloseMobileMenu}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-white/60 transition-colors hover:bg-white/5 hover:text-white lg:hidden"
          aria-label="Закрыть меню"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="grid gap-6">
        {sections.map((section) => (
          <div key={section.title} className="last:mb-0">
            <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-white/25">
              {section.title}
            </p>
            <div className="grid gap-1">
              {section.items.map((item) => {
                const active = isActive(pathname, searchParams, item.href);
                return (
                  <a
                    key={item.href + item.label}
                    href={item.href}
                    onClick={onCloseMobileMenu}
                    className={[
                      "flex items-center gap-3 px-3 py-3 rounded-lg text-base transition-all",
                      active
                        ? "text-white bg-white/8 font-medium"
                        : "text-white/40 hover:text-white hover:bg-white/5",
                    ].join(" ")}
                  >
                    <span className="text-white/60">{item.icon}</span>
                    <span className="font-body">{item.label}</span>
                  </a>
                );
              })}
            </div>
          </div>
        ))}
        </div>
      </nav>

      <div className="border-t border-white/5 px-3 pb-4 pt-4">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-white/5">
          {viewer.image ? (
            <img
              src={viewer.image}
              alt={viewer.name}
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-brand/20 flex items-center justify-center text-sm font-bold text-brand-light font-body">
              {viewer.initials}
            </div>
          )}
          <div>
            <p className="text-base font-medium text-white font-body">{viewer.name}</p>
            <p className="text-sm text-white/30 font-body">{viewer.roleLabel}</p>
          </div>
        </div>
        <div className="mt-3 px-3">
          <SignOutButton />
        </div>
      </div>
      </aside>
    </>
  );
}
