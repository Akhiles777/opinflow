"use client";

import * as React from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
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

type NavItem = { label: string; href: string; icon: React.ReactNode };
type NavSection = { title: string; items: NavItem[] };

function isActive(pathname: string, href: string) {
  const hrefPath = href.split("?")[0] ?? href;
  if (href === "/respondent" || href === "/client" || href === "/admin") {
    return pathname === hrefPath;
  }
  return pathname === hrefPath || pathname.startsWith(hrefPath + "/");
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
      { label: "Доступные", href: "/respondent/surveys", icon: <ClipboardList className="w-4 h-4" /> },
      { label: "Мои опросы", href: "/respondent/surveys?tab=mine", icon: <ListChecks className="w-4 h-4" /> },
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

export default function Sidebar() {
  const pathname = usePathname() ?? "/";
  const role = roleForPath(pathname);
  const sections = role === "client" ? clientNav : role === "admin" ? adminNav : respondentNav;

  return (
    <aside className="w-64 flex flex-col bg-dash-sidebar border-r border-white/5">
      <div className="px-6 h-16 flex items-center border-b border-white/5 flex-shrink-0">
        <a href="/" className="flex items-center gap-2.5">
          <div className="relative w-7 h-7 overflow-hidden">
            <Image src="/favicon.png" alt="ПотокМнений" fill sizes="28px" className="object-contain" priority />
          </div>
          <span className="font-display text-white font-bold text-base">ПотокМнений</span>
        </a>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {sections.map((section) => (
          <div key={section.title} className="mb-6 last:mb-0">
            <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-white/25">
              {section.title}
            </p>
            <div className="grid gap-1">
              {section.items.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <a
                    key={item.href + item.label}
                    href={item.href}
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
      </nav>

      <div className="px-3 pb-4 border-t border-white/5 pt-4 flex-shrink-0">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
          <div className="w-9 h-9 rounded-full bg-brand/20 flex items-center justify-center text-sm font-bold text-brand-light font-body">
            PM
          </div>
          <div>
            <p className="text-base font-medium text-white font-body">Пользователь</p>
            <p className="text-sm text-white/30 font-body">{role}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
