import * as React from "react";
import { notFound } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { getDashboardViewer } from "@/lib/dashboard-data";
import { requireAuth } from "@/lib/auth-utils";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth();
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
