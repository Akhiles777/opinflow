"use client";

import * as React from "react";
import Link from "next/link";
import { LogOut, LayoutDashboard, User, Wallet, Users, Search, Shield } from "lucide-react";
import type { Role } from "@prisma/client";

type Props = {
  name: string;
  email: string;
  image: string | null;
  role: Role;
};

function getInitials(name: string, email: string) {
  const source = name.trim() || email.split("@")[0] || "PM";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function getMenuItems(role: Role) {
  if (role === "ADMIN") {
    return [
      { href: "/admin", label: "Панель", icon: <Shield className="h-4 w-4" /> },
      { href: "/admin/users", label: "Пользователи", icon: <Users className="h-4 w-4" /> },
      { href: "/admin/finance", label: "Финансы", icon: <Wallet className="h-4 w-4" /> },
    ];
  }

  if (role === "CLIENT") {
    return [
      { href: "/client", label: "Кабинет", icon: <LayoutDashboard className="h-4 w-4" /> },
      { href: "/client/surveys", label: "Опросы", icon: <Search className="h-4 w-4" /> },
      { href: "/client/wallet", label: "Кошелёк", icon: <Wallet className="h-4 w-4" /> },
    ];
  }

  return [
    { href: "/respondent", label: "Кабинет", icon: <LayoutDashboard className="h-4 w-4" /> },
    { href: "/respondent/profile", label: "Профиль", icon: <User className="h-4 w-4" /> },
    { href: "/respondent/wallet", label: "Кошелёк", icon: <Wallet className="h-4 w-4" /> },
  ];
}

export default function PublicUserMenu({ name, email, image, role }: Props) {
  const [open, setOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const menuItems = React.useMemo(() => getMenuItems(role), [role]);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-site-border bg-site-card text-site-heading transition-colors hover:bg-site-section"
        aria-expanded={open}
        aria-label="Меню пользователя"
      >
        {image ? (
          <img src={image} alt={name} className="h-8 w-8 rounded-full object-cover" />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 text-xs font-semibold text-brand">
            {getInitials(name, email)}
          </div>
        )}
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-56 rounded-2xl border border-site-border bg-site-card p-2 shadow-card">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-site-body transition-colors hover:bg-site-section hover:text-site-heading"
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
          <div className="my-1 h-px bg-site-border" />
          <a
            href="/logout"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-site-body transition-colors hover:bg-site-section hover:text-site-heading"
          >
            <LogOut className="h-4 w-4" />
            Выйти
          </a>
        </div>
      ) : null}
    </div>
  );
}
