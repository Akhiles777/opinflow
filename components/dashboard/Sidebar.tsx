"use client";

import Image from "next/image";
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
  | "finance";

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
  const p = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.75",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    width: 18,
    height: 18,
  };

  switch (name) {
    case "overview":
      return (
        <svg {...p}>
          <rect x="3" y="3" width="7.5" height="7.5" rx="2" />
          <rect x="13.5" y="3" width="7.5" height="7.5" rx="2" />
          <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" />
          <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" />
        </svg>
      );
    case "feed":
      return (
        <svg {...p}>
          {/* clipboard / list */}
          <rect x="4" y="3" width="12" height="15" rx="2.5" />
          <path d="M7 8h6M7 11.5h6M7 15h4" />
          {/* search magnifier */}
          <circle cx="17.5" cy="17.5" r="2.5" />
          <path d="M19.3 19.3 21 21" />
        </svg>
      );
    case "mine":
      return (
        <svg {...p}>
          {/* document */}
          <rect x="4" y="3" width="16" height="18" rx="3" />
          <path d="M8 8h8M8 12h8" />
          {/* checkmark */}
          <path d="M8 16.5 10 19l4-5" />
        </svg>
      );
    case "wallet":
      return (
        <svg {...p}>
          {/* wallet body */}
          <path d="M4 7h16a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 20 19H4a1.5 1.5 0 0 1-1.5-1.5V8c0-2 1-3 3-3h11" />
          {/* coin / plug */}
          <rect x="15" y="11.5" width="4.5" height="4" rx="2" />
          <circle cx="17" cy="13.5" r=".6" fill="currentColor" stroke="none" />
        </svg>
      );
    case "referral":
      return (
        <svg {...p}>
          {/* central person */}
          <circle cx="12" cy="7" r="3" />
          <path d="M6 20c.8-3.5 2.8-5.5 6-5.5" />
          {/* right referred person */}
          <circle cx="18.5" cy="12" r="2" />
          <path d="M13.5 19.5c.5-2.5 1.8-3.8 5-3.8" />
          {/* connecting arrow */}
          <path d="M14.5 9.5 17 11" />
        </svg>
      );
    case "profile":
      return (
        <svg {...p}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20c1-4 3.5-6 7-6s6 2 7 6" />
        </svg>
      );
    case "surveys":
      return (
        <svg {...p}>
          <rect x="4" y="3" width="16" height="18" rx="3" />
          <path d="M8 8h8M8 12h8M8 16h5" />
        </svg>
      );
    case "create":
      return (
        <svg {...p}>
          <rect x="4" y="3" width="16" height="18" rx="3" />
          <path d="M12 8v8M8 12h8" />
        </svg>
      );
    case "settings":
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      );
    case "shield":
      return (
        <svg {...p}>
          <path d="M12 2 4 5.5v6c0 5 3.5 9.3 8 11 4.5-1.7 8-6 8-11v-6L12 2Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case "users":
      return (
        <svg {...p}>
          <circle cx="8.5" cy="8" r="3" />
          <path d="M2 20c1-4 3-6 6.5-6s5.5 2 6.5 6" />
          <path d="M15 5a3 3 0 1 1 0 6" />
          <path d="M17.5 14c2.5.5 4 2.5 4.5 6" />
        </svg>
      );
    case "experts":
      return (
        <svg {...p}>
          <path d="M22 10v1a10 10 0 1 1-5.93-9.14" />
          <path d="M22 4 12 14.01l-3-3" />
        </svg>
      );
    case "finance":
      return (
        <svg {...p}>
          <path d="M3 20h18" />
          <path d="M5 20V10M12 20V4M19 20v-8" />
          <path d="M3 10a2 2 0 0 1 2-2h2a2 2 0 0 1 0 0M10 4a2 2 0 0 1 2-2h2a2 2 0 0 1 0 0M17 12a2 2 0 0 1 2-2h2" />
        </svg>
      );
    default:
      return null;
  }
}

const respondentNav: NavSection[] = [
  {
    title: "Респондент",
    items: [
      { label: "Обзор",         href: "/respondent",         icon: "overview" },
      { label: "Лента опросов", href: "/surveys",            icon: "feed" },
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
      { label: "Модерация",    href: "/admin/moderation", icon: "shield" },
      { label: "Пользователи", href: "/admin/users",      icon: "users" },
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
          "fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden",
          mobileMenuOpen ? "opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
      />

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[86vw] shrink-0 flex-col border border-[#4A3185] bg-dash-sidebar text-white shadow-[0_18px_70px_rgba(28,12,76,0.18)] transition-transform duration-300 lg:static lg:z-auto lg:m-5 lg:h-[calc(100vh-40px)] lg:max-w-none lg:translate-x-0 lg:rounded-[18px]",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        {/* Logo */}
        <div className="flex h-22 shrink-0 items-center gap-3 px-5">
          <div className="relative h-13.5 w-13.5 shrink-0">
            <Image src="/logo2.png" alt="ПотокМнений" fill sizes="54px" className="object-contain" priority />
          </div>
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
                        "flex h-11.25 items-center gap-3 rounded-[10px] px-3 text-[14px] font-semibold transition-all duration-150",
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
