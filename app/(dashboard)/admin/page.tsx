import * as React from "react";
import { AlertTriangle, Banknote, ClipboardCheck, UserPlus } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import EmptyState from "@/components/dashboard/EmptyState";
import { formatRub, getAdminOverviewData } from "@/lib/dashboard-data";
import { requireRole } from "@/lib/auth-utils";

export default async function AdminOverviewPage() {
  await requireRole("ADMIN");
  const data = await getAdminOverviewData();

  const stats = [
    { label: "Опросов на модерации", value: String(data.pendingModeration), icon: <ClipboardCheck className="w-5 h-5" /> },
    { label: "Новых пользователей", value: String(data.newUsers), icon: <UserPlus className="w-5 h-5" /> },
    { label: "Оборот за месяц", value: formatRub(data.turnover), icon: <Banknote className="w-5 h-5" /> },
    { label: "Выплачено респондентам", value: formatRub(data.respondentPayouts), icon: <AlertTriangle className="w-5 h-5" /> },
  ];

  return (
    <div>
      <PageHeader title="Обзор" subtitle="Сводка и последние события системы." />

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} icon={s.icon} label={s.label} value={s.value} />
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-dash-border bg-dash-card p-6">
        <p className="text-[15px] font-semibold text-dash-heading font-body">Последние события</p>
        {data.events.length > 0 ? (
          <div className="mt-5 grid gap-3">
            {data.events.map((e) => (
              <div key={`${e.text}-${e.time}`} className="flex items-center justify-between rounded-xl border border-dash-border bg-dash-bg px-4 py-3">
                <p className="text-[15px] text-dash-body font-body">{e.text}</p>
                <p className="text-sm text-dash-muted font-body">{e.time}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6">
            <EmptyState title="Событий пока нет" description="Когда в системе появятся действия пользователей и транзакции, они будут показаны здесь." />
          </div>
        )}
      </div>
    </div>
  );
}
