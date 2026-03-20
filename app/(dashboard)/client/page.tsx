import * as React from "react";
import { TrendingUp, Wallet, BarChart3, Layers } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import DataTable, { Column } from "@/components/dashboard/DataTable";
import Badge from "@/components/dashboard/Badge";

const stats = [
  { label: "Баланс", value: "45 200 ₽", icon: <Wallet className="w-5 h-5" /> },
  { label: "Активных опросов", value: "3", icon: <Layers className="w-5 h-5" /> },
  { label: "Всего ответов", value: "1 247", trend: "+89 сегодня", trendUp: true, icon: <TrendingUp className="w-5 h-5" /> },
  { label: "Средняя конверсия", value: "73%", icon: <BarChart3 className="w-5 h-5" /> },
];

type SurveyRow = {
  title: string;
  answered: number;
  max: number;
  pct: string;
  budget: string;
  status: "active" | "pending" | "paused" | "completed";
};

const surveys: SurveyRow[] = [
  { title: "Оцените качество сервиса доставки", answered: 64, max: 200, pct: "w-[32%]", budget: "12 800 ₽", status: "active" },
  { title: "Кофе: привычки и выбор бренда", answered: 0, max: 150, pct: "w-[0%]", budget: "8 250 ₽", status: "pending" },
  { title: "Мобильные банки: доверие", answered: 18, max: 120, pct: "w-[15%]", budget: "4 500 ₽", status: "paused" },
];

const columns: Column<SurveyRow>[] = [
  { key: "title", header: "Название", cell: (r) => r.title, className: "max-w-[320px] lg:max-w-[520px]" },
  {
    key: "progress",
    header: "Прогресс",
    cell: (r) => (
      <div className="min-w-[140px] sm:min-w-[180px]">
        <div className="flex justify-between text-xs text-dash-muted font-body mb-2">
          <span>{r.answered}/{r.max}</span>
          <span>{Math.round((r.answered / r.max) * 100)}%</span>
        </div>
        <div className="h-2 rounded-full bg-dash-border overflow-hidden">
          <div className={["h-2 bg-brand", r.pct].join(" ")} />
        </div>
      </div>
    ),
  },
  { key: "budget", header: "Бюджет", cell: (r) => <span className="tabular-nums font-semibold">{r.budget}</span> },
  {
    key: "status",
    header: "Статус",
    cell: (r) => {
      const map = {
        active: { v: "active" as const, t: "Активен" },
        paused: { v: "pending" as const, t: "Пауза" },
        pending: { v: "moderation" as const, t: "На модерации" },
        completed: { v: "draft" as const, t: "Завершён" },
      }[r.status];
      return <Badge variant={map.v}>{map.t}</Badge>;
    },
  },
  {
    key: "actions",
    header: "Действия",
    cell: () => (
      <div className="flex flex-wrap gap-3">
        <a className="text-sm font-semibold text-brand hover:underline" href="#">Статистика</a>
        <a className="text-sm font-semibold text-brand hover:underline" href="#">Пауза</a>
        <a className="text-sm font-semibold text-brand hover:underline" href="#">Стоп</a>
      </div>
    ),
  },
];

export default function ClientOverviewPage() {
  return (
    <div>
      <PageHeader title="Обзор" subtitle="Сводка по опросам и эффективности кампаний." />

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {stats.map((s) => (
          <StatCard key={s.label} icon={s.icon} label={s.label} value={s.value} trend={s.trend} trendUp={s.trendUp} />
        ))}
      </div>

      <div className="mt-10">
        <p className="text-sm font-semibold text-dash-heading mb-4 font-body">
          Активные опросы
        </p>
        <DataTable columns={columns} rows={surveys} keyForRow={(r) => r.title} />
      </div>
    </div>
  );
}
