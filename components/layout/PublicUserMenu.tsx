"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut, LayoutDashboard, User, Wallet, Users, Shield } from "lucide-react";
import type { Role } from "@prisma/client";

type Props = {
  name: string;
  email: string;
  image: string | null;
  role: Role;
};

function getInitials(name?: string | null, email?: string | null) {
  const safeName = typeof name === "string" ? name.trim() : "";
  const safeEmail = typeof email === "string" ? email : "";
  const source = safeName || (safeEmail.split("@")[0] || "") || "PM";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "PM";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function getMenuItems(role: Role) {
  if (role === "ADMIN") {
    return [
      { href: "/admin",          label: "Панель",        icon: Shield },
      { href: "/admin/users",    label: "Пользователи",  icon: Users },
      { href: "/admin/finance",  label: "Финансы",       icon: Wallet },
    ];
  }
  if (role === "CLIENT") {
    return [
      { href: "/client",          label: "Кабинет",  icon: LayoutDashboard },
      { href: "/client/wallet",   label: "Кошелёк",  icon: Wallet },
      { href: "/client/settings", label: "Профиль",  icon: User },
    ];
  }
  return [
    { href: "/respondent",         label: "Кабинет",  icon: LayoutDashboard },
    { href: "/respondent/wallet",  label: "Кошелёк",  icon: Wallet },
    { href: "/respondent/profile", label: "Профиль",  icon: User },
  ];
}

export default function PublicUserMenu({ name, email, image, role }: Props) {
  const [open, setOpen] = React.useState(false);
  const menuRef   = React.useRef<HTMLDivElement>(null);
  const menuItems = React.useMemo(() => getMenuItems(role), [role]);
  const pathname  = usePathname();

  React.useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  return (
    <div ref={menuRef} className="relative">

      {/* ── Trigger ── */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Меню пользователя"
        className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#6438D9]/30 dark:border-[#A98BFF]/40 bg-[#F0ECFF] dark:bg-white/10 transition-all hover:border-[#6438D9] dark:hover:border-[#A98BFF] overflow-hidden"
      >
        {image ? (
          <img src={image} alt={name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-[13px] font-bold text-[#6438D9] dark:text-[#A98BFF]">
            {getInitials(name, email)}
          </span>
        )}
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-[220px] rounded-[20px] border border-[#DDD5F0] dark:border-white/12 bg-white dark:bg-[#1A0748] p-2 shadow-[0_12px_40px_rgba(100,56,217,0.13)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.4)]">

          {/* Nav items */}
          <div className="flex flex-col gap-[2px]">
            {menuItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={[
                    "flex items-center gap-3 rounded-[14px] px-3.5 py-3 text-[15px] font-medium transition-all duration-150",
                    isActive
                      ? "border border-[#6438D9] dark:border-[#A98BFF] text-[#6438D9] dark:text-[#A98BFF] bg-[#F0ECFF]/60 dark:bg-white/8"
                      : "border border-transparent text-[#2B1B67] dark:text-white/85 hover:bg-[#F5F2FF] dark:hover:bg-white/8 hover:text-[#6438D9] dark:hover:text-white",
                  ].join(" ")}
                >
                  <span className={[
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]",
                    isActive
                      ? "bg-[#6438D9]/10 dark:bg-[#A98BFF]/15"
                      : "bg-[#F0ECFF] dark:bg-white/10",
                  ].join(" ")}>
                    <Icon className={[
                      "h-[18px] w-[18px]",
                      isActive ? "text-[#6438D9] dark:text-[#A98BFF]" : "text-[#6438D9]/70 dark:text-white/60",
                    ].join(" ")} />
                  </span>
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Logout */}
          <div className="mt-2 pt-2 border-t border-[#EDE8F8] dark:border-white/10">
            <button
              type="button"
              onClick={async () => { await signOut({ redirect: false }); window.location.href = "/"; }}
              className="flex w-full items-center gap-3 rounded-[14px] border border-[#EDE8F8] dark:border-white/12 px-3.5 py-3 text-[15px] font-medium text-[#6E6884] dark:text-white/55 transition-all duration-150 hover:bg-[#FFF0F0] dark:hover:bg-white/8 hover:text-[#C0392B] dark:hover:text-red-400 hover:border-[#FFCCCC] dark:hover:border-red-400/30"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#F5F2FF] dark:bg-white/10">
                <LogOut className="h-4.5 w-4.5" />
              </span>
              Выйти
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
