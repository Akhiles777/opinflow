import * as React from "react";
import { notFound } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { getDashboardViewer } from "@/lib/dashboard-data";
import { requireAuth } from "@/lib/auth-utils";
import { getPlatformSettings } from "@/lib/platform-settings";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth();
  const isAdmin = session.user.role === "ADMIN";

  if (!isAdmin) {
    const settings = await getPlatformSettings();
    if (settings.maintenanceMode) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-dash-bg px-4 py-10 text-dash-text sm:px-6">
          <div className="mx-auto max-w-lg rounded-3xl border border-dash-border bg-dash-card p-8 text-center shadow-card">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7 text-amber-400">
                <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
                <path d="M12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-dash-muted">ПотокМнений</p>
            <h1 className="mt-3 text-2xl font-bold text-dash-heading">Технические работы</h1>
            <p className="mt-3 text-[15px] leading-relaxed text-dash-muted">
              Платформа временно недоступна в связи с техническим обслуживанием. Мы работаем над улучшением сервиса — пожалуйста, зайдите позже.
            </p>
            {settings.adminEmail && (
              <p className="mt-4 text-[13px] text-dash-muted">
                По вопросам:{" "}
                <a href={`mailto:${settings.adminEmail}`} className="text-[#6D3AE2] hover:underline">
                  {settings.adminEmail}
                </a>
              </p>
            )}
          </div>
        </main>
      );
    }
  }

  let viewer = null;

  try {
    viewer = await getDashboardViewer(session.user.id);
  } catch (error) {
    console.error("[dashboard][viewer-load-error]", {
      userId: session.user.id,
      error,
    });

    return (
      <main className="min-h-screen bg-dash-bg px-4 py-10 text-dash-text sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl rounded-3xl border border-dash-border bg-dash-card p-6 shadow-card sm:p-8">
          <p className="text-sm uppercase tracking-[0.22em] text-dash-muted">ПотокМнений</p>
          <h1 className="mt-4 text-2xl font-semibold text-dash-text">Личный кабинет временно недоступен</h1>
          <p className="mt-3 text-base leading-relaxed text-dash-muted">
            Не удалось загрузить данные из базы. Проверьте подключение продовой базы данных и синхронизацию схемы, затем попробуйте снова.
          </p>
        </div>
      </main>
    );
  }

  if (!viewer) {
    notFound();
  }

  return <DashboardShell viewer={viewer}>{children}</DashboardShell>;
}
