"use client";

import * as React from "react";
import { Menu } from "lucide-react";
import NotificationBell from "@/components/dashboard/NotificationBell";
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
    <div className="flex h-auto flex-wrap items-center justify-between gap-3 border-b border-dash-border bg-dash-card px-4 py-3 sm:px-6 lg:h-16 lg:flex-nowrap lg:gap-6 lg:px-8 lg:py-0">
      <div className="order-1 flex items-center gap-3 lg:hidden">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-dash-border bg-dash-bg text-dash-heading transition-colors hover:bg-dash-card"
          aria-label="Открыть меню"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <div className="order-2 hidden w-full items-center gap-3 md:flex lg:order-1 lg:w-auto">
        <div className="relative">
          <input
            className="h-10 w-full min-w-0 rounded-xl border border-dash-border bg-dash-bg px-10 text-sm text-dash-body placeholder:text-dash-muted font-body focus:outline-none focus:ring-2 focus:ring-brand/20 lg:w-[340px]"
            placeholder="Поиск по кабинету"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-dash-muted">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
              <path d="M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
          </div>
        </div>
      </div>
      <div className="order-1 ml-auto flex items-center gap-2 sm:gap-3 lg:order-2">
        <ThemeToggle tone="dash" />
        <NotificationBell />

        <div className="w-px h-6 bg-dash-border" />

        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-brand/10 text-brand text-xs font-bold font-body"
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
