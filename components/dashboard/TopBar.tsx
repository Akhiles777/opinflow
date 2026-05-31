"use client";

import { Menu, Search } from "lucide-react";
import NotificationBell from "@/components/dashboard/NotificationBell";
import PushNotificationButton from "@/components/dashboard/PushNotificationButton";
import ThemeToggle from "@/components/ui/ThemeToggle";
import type { DashboardViewer } from "@/lib/dashboard-data";

export default function TopBar({
  viewer,
  onOpenMobileMenu,
}: {
  viewer: DashboardViewer;
  onOpenMobileMenu: () => void;
}) {
  return (
    <div className="flex h-auto flex-wrap items-center justify-between gap-3 bg-transparent px-4 py-3 sm:px-6 lg:h-14 lg:flex-nowrap lg:gap-4 lg:px-0 lg:py-0">
      {/* Mobile burger */}
      <div className="order-1 flex items-center gap-3 lg:hidden">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-dash-border bg-dash-card text-dash-muted transition-colors hover:text-dash-heading"
          aria-label="Открыть меню"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Search */}
      <div className="order-2 hidden w-full items-center md:flex lg:order-1 lg:w-auto">
        <div className="relative">
          <input
            className="h-10 w-full min-w-0 rounded-full border border-dash-border bg-dash-card/60 px-11 text-[14px] font-medium text-dash-body placeholder:text-dash-muted focus:border-[#6D3AE2]/50 focus:outline-none focus:ring-2 focus:ring-[#6D3AE2]/10 transition-colors lg:w-95 dark:bg-white/[0.07]"
            placeholder="Поиск по кабинету"
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-dash-muted">
            <Search className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Right actions */}
      <div className="order-1 ml-auto flex items-center gap-1.5 lg:order-2">
        <PushNotificationButton />
        <ThemeToggle tone="dash" />
        <NotificationBell />
        <button
          type="button"
          className="ml-1 flex h-9 w-9 items-center justify-center overflow-hidden rounded-[10px] bg-[#6D3AE2] text-[13px] font-semibold text-white"
          aria-label="Профиль"
          title={viewer.email}
        >
          {viewer.image ? (
            <img src={viewer.image} alt={viewer.name} className="h-full w-full object-cover" />
          ) : (
            viewer.initials
          )}
        </button>
      </div>
    </div>
  );
}
