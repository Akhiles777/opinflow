"use client";

import * as React from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import type { DashboardViewer } from "@/lib/dashboard-data";

export default function DashboardShell({
  children,
  viewer,
}: {
  children: React.ReactNode;
  viewer: DashboardViewer;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="flex min-h-screen flex-col overflow-hidden bg-dash-bg lg:h-screen lg:flex-row">
      <Sidebar
        viewer={viewer}
        mobileMenuOpen={mobileMenuOpen}
        onCloseMobileMenu={() => setMobileMenuOpen(false)}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar viewer={viewer} onOpenMobileMenu={() => setMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 text-base leading-relaxed text-dash-body sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
