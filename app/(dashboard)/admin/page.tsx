import * as React from "react";
import { AlertTriangle, Banknote, ClipboardCheck, UserPlus } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";

const stats = [
  { label: "Опросов на модерации", value: "14", icon: <ClipboardCheck className="w-5 h-5" /> },
  { label: "Новых пользователей", value: "210", icon: <UserPlus className="w-5 h-5" /> },
  { label: "Оборот за месяц", value: "1 284 000 ₽", icon: <Banknote className="w-5 h-5" /> },
  { label: "Жалоб в обработке", value: "7", icon: <AlertTriangle className="w-5 h-5" /> },
];

const events = [
  { text: "Новый опрос на модерации", time: "5 мин назад" },
  { text: "Жалоба от респондента", time: "12 мин назад" },
  { text: "Пополнение баланса 15 000 ₽", time: "1 час назад" },
];

export default function AdminOverviewPage() {
  return (
    <div>
      <PageHeader title="Обзор" subtitle="Сводка и последние события системы." />

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {stats.map((s) => (
          <StatCard key={s.label} icon={s.icon} label={s.label} value={s.value} />
        ))}
      </div>

      <div className="mt-10 bg-dash-card border border-dash-border rounded-2xl p-6">
        <p className="text-sm font-semibold text-dash-heading font-body">Последние события</p>
        <div className="mt-5 grid gap-3">
          {events.map((e) => (
            <div key={e.text} className="flex items-center justify-between rounded-xl border border-dash-border bg-dash-bg px-4 py-3">
              <p className="text-sm text-dash-body font-body">{e.text}</p>
              <p className="text-xs text-dash-muted font-body">{e.time}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

