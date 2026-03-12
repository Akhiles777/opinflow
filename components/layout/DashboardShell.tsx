import * as React from "react";
import Image from "next/image";

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

type DashboardShellProps = {
  roleLabel: string;
  nav: NavItem[];
  children: React.ReactNode;
};

function NavIconBox({ children }: { children: React.ReactNode }) {
  return (
    <span className="h-9 w-9 rounded-xl border border-white/8 bg-white/5 flex items-center justify-center">
      <span className="text-white/70">{children}</span>
    </span>
  );
}

export default function DashboardShell({ roleLabel, nav, children }: DashboardShellProps) {
  return (
    <div className="min-h-[100svh] bg-surface-950 text-white">
      <header className="sticky top-0 z-50 border-b border-white/5 bg-surface-950/80 backdrop-blur-xl">
        <div className="h-16 px-6 max-w-7xl mx-auto flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <div className="relative h-10 w-10 overflow-hidden">
              <Image src="/favicon.png" alt="ПотокМнений" fill sizes="32px" className="object-contain" priority />
            </div>
            <div className="leading-tight">
              <p className="font-display font-bold">ПотокМнений</p>
              <p className="text-xs font-body text-white/40 -mt-0.5">{roleLabel}</p>
            </div>
          </a>

          <div className="hidden lg:flex items-center gap-2">
            <a
              href="#"
              className="px-4 py-2 rounded-xl text-sm font-body text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            >
              Поддержка
            </a>
            <a
              href="#"
              className="px-4 py-2 rounded-xl text-sm font-body text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            >
              Профиль
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
        <aside className="hidden lg:block">
          <nav className="sticky top-24">
            <div className="rounded-2xl border border-white/8 bg-surface-900 p-3">
              {nav.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="group flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-white/5 transition-colors"
                >
                  <NavIconBox>{item.icon}</NavIconBox>
                  <span className="text-sm font-body text-white/70 group-hover:text-white transition-colors">
                    {item.label}
                  </span>
                </a>
              ))}
            </div>
          </nav>
        </aside>

        <div className="lg:hidden -mt-2">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="shrink-0 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-body text-white/70 hover:text-white hover:border-white/20 transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>

        <div>{children}</div>
      </div>
    </div>
  );
}