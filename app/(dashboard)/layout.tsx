import * as React from "react";
import { ThemeProvider } from "next-themes";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <div className="flex h-screen overflow-hidden bg-dash-bg">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-y-auto p-8 text-dash-body text-base leading-relaxed">
            {children}
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}
