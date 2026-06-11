"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import type { DashboardViewer } from "@/lib/dashboard-data";
import SignOutButton from "@/components/auth/SignOutButton";

type IconName =
  | "overview"
  | "feed"
  | "mine"
  | "wallet"
  | "referral"
  | "profile"
  | "surveys"
  | "create"
  | "settings"
  | "shield"
  | "users"
  | "experts"
  | "finance"
  | "check";

type NavItem = { label: string; href: string; icon: IconName };
type NavSection = { title: string; items: NavItem[] };

function isActive(pathname: string, searchParams: URLSearchParams | null, href: string) {
  const [hrefPath, hrefQuery] = href.split("?");
  if (href === "/respondent" || href === "/client" || href === "/admin") {
    return pathname === hrefPath;
  }
  if (hrefQuery) {
    const expected = new URLSearchParams(hrefQuery);
    if (pathname !== hrefPath) return false;
    return Array.from(expected.entries()).every(([key, value]) => searchParams?.get(key) === value);
  }
  return pathname === hrefPath || pathname.startsWith(`${hrefPath}/`);
}

function roleForPath(pathname: string): "respondent" | "client" | "admin" {
  if (pathname.startsWith("/client")) return "client";
  if (pathname.startsWith("/admin")) return "admin";
  return "respondent";
}

function DashboardIcon({ name }: { name: IconName }) {
  const basePath = "/cabinets/icons/sidebar";
  const srcByName: Record<IconName, string> = {
    overview: `${basePath}/menu-icon-home-20px.svg`,
    feed: `${basePath}/menu-icon-survey-20px.svg`,
    mine: `${basePath}/menu-icon-my-survey-20px.svg`,
    wallet: `${basePath}/menu-icon-money-20px.svg`,
    referral: `${basePath}/menu-icon-referal-20px.svg`,
    profile: `${basePath}/menu-icon-profile-20px.svg`,
    surveys: `${basePath}/menu-icon-survey-20px.svg`,
    create: `${basePath}/menu-icon-create-survey-20px.svg`,
    settings: `${basePath}/menu-icon-setting-20px.svg`,
    shield: `${basePath}/vuesax/linear/setting-3.svg`,
    users: `${basePath}/menu-icon-users-20px.svg`,
    experts: `${basePath}/vuesax/linear/teacher.svg`,
    finance: `${basePath}/vuesax/linear/chart.svg`,
    check: `${basePath}/menu-icon-my-survey-20px.svg`,
  };

  return <img src={srcByName[name]} alt="" width={20} height={20} className="h-5 w-5" aria-hidden="true" />;
}

const respondentNav: NavSection[] = [
  {
    title: "Респондент",
    items: [
      { label: "Обзор",         href: "/respondent",         icon: "overview" },
      { label: "Лента опросов", href: "/respondent/feed",     icon: "feed" },
      { label: "Мои опросы",    href: "/respondent/surveys", icon: "mine" },
    ],
  },
  {
    title: "Финансы",
    items: [
      { label: "Кошелёк",  href: "/respondent/wallet",   icon: "wallet" },
      { label: "Рефералы", href: "/respondent/referral", icon: "referral" },
      { label: "Профиль",  href: "/respondent/profile",  icon: "profile" },
    ],
  },
];

const clientNav: NavSection[] = [
  {
    title: "Заказчик",
    items: [
      { label: "Обзор",         href: "/client",                icon: "overview" },
      { label: "Мои опросы",    href: "/client/surveys",        icon: "surveys" },
      { label: "Создать опрос", href: "/client/surveys/create", icon: "create" },
    ],
  },
  {
    title: "Финансы",
    items: [
      { label: "Кошелёк",   href: "/client/wallet",   icon: "wallet" },
      { label: "Настройки", href: "/client/settings", icon: "settings" },
    ],
  },
];

const adminNav: NavSection[] = [
  {
    title: "Управление",
    items: [
      { label: "Обзор",        href: "/admin",            icon: "overview" },
      { label: "Модерация опросов",       href: "/admin/moderation",           icon: "shield" },
      { label: "Модерация ответов", href: "/admin/moderation/responses", icon: "check" },
      { label: "Пользователи",    href: "/admin/users",                 icon: "users" },
      { label: "Эксперты",     href: "/admin/experts",    icon: "experts" },
      { label: "Финансы",      href: "/admin/finance",    icon: "finance" },
      { label: "Настройки",    href: "/admin/settings",   icon: "settings" },
    ],
  },
];

export default function Sidebar({
  mobileMenuOpen,
  onCloseMobileMenu,
}: {
  viewer?: DashboardViewer;
  mobileMenuOpen: boolean;
  onCloseMobileMenu: () => void;
}) {
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const role = roleForPath(pathname);
  const sections = role === "client" ? clientNav : role === "admin" ? adminNav : respondentNav;

  return (
    <>
      {/* Mobile overlay */}
      <button
        type="button"
        aria-label="Закрыть меню"
        onClick={onCloseMobileMenu}
        className={[
          "fixed inset-0 z-40 bg-black/50 dark:bg-black/70 transition-opacity lg:hidden",
          mobileMenuOpen ? "opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
      />

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-[297px] max-w-[86vw] shrink-0 flex-col border border-[#4A3185] bg-[#1C0C4C] text-white shadow-[0_18px_70px_rgba(28,12,76,0.35)] dark:border-white/10 dark:shadow-[4px_0_40px_rgba(0,0,0,0.6)] transition-transform duration-300 lg:static lg:z-auto lg:m-5 lg:h-[calc(100vh-40px)] lg:max-w-none lg:translate-x-0 lg:rounded-[18px]",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        {/* Logo */}
        <div className="flex h-[88px] shrink-0 items-center gap-3 px-5">

          
            <img src="/logo2.png" alt="ПотокМнений" width={54} height={54} className="h-[54px] w-[54px] object-contain" />
          <span className="text-[16px] font-semibold tracking-[-0.02em] text-white">ПотокМнений</span>
         

          <button
            type="button"
            onClick={onCloseMobileMenu}
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-white/60 hover:text-white lg:hidden"
            aria-label="Закрыть"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-8 overflow-y-auto px-5 py-4">
          {sections.map((section) => (
            <div key={section.title}>
              <p className="mb-3 px-0 text-[16px] font-medium text-white/92">
                {section.title}
              </p>
              <div className="flex flex-col gap-1 rounded-[18px] border border-[#4A3185] bg-white/[0.07] p-2">
                {section.items.map((item) => {
                  const active = isActive(pathname, searchParams, item.href);
                  return (
                    <a
                      key={item.href + item.label}
                      href={item.href}
                      onClick={onCloseMobileMenu}
                      className={[
                        "flex h-[45px] items-center gap-3 rounded-[10px] px-3 text-[14px] font-semibold transition-all duration-150",
                        active
                          ? "bg-[#6D3AE2] text-white shadow-[0_12px_28px_rgba(109,58,226,0.32)]"
                          : "text-white/82 hover:bg-white/8 hover:text-white",
                      ].join(" ")}
                    >
                      <span className={active ? "text-white" : "text-white/72"}>
                        <DashboardIcon name={item.icon} />
                      </span>
                      {item.label}
                    </a>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom — Выйти */}
        <div className="px-5 pb-5">
          <SignOutButton />
        </div>
      </aside>
    </>
  );
}
