"use client";

import * as React from "react";
import { Bell } from "lucide-react";
import ThemeToggle from "@/components/ui/ThemeToggle";

export default function TopBar() {
  return (
    <div className="h-16 border-b border-dash-border bg-dash-card px-8 flex items-center justify-between gap-6">
      <div className="hidden md:flex items-center gap-3">
        <div className="relative">
          <input
            className="h-10 w-[340px] rounded-xl border border-dash-border bg-dash-bg px-10 text-sm text-dash-body placeholder:text-dash-muted font-body focus:outline-none focus:ring-2 focus:ring-brand/20"
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
      <div className="flex items-center gap-3">
        <ThemeToggle tone="dash" />

        <button
          type="button"
          className="w-9 h-9 rounded-lg border border-dash-border bg-dash-card flex items-center justify-center text-dash-muted hover:text-dash-heading hover:bg-dash-bg transition-all duration-200 relative"
          aria-label="Уведомления"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500" />
        </button>

        <div className="w-px h-6 bg-dash-border" />

        <button
          type="button"
          className="w-9 h-9 rounded-full bg-brand/10 text-brand text-xs font-bold font-body flex items-center justify-center"
          aria-label="Профиль"
        >
          PM
        </button>
      </div>
    </div>
  );
}
