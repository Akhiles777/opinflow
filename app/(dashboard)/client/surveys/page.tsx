import * as React from "react";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable, { Column } from "@/components/dashboard/DataTable";
import Badge from "@/components/dashboard/Badge";

type Row = {
  id: string;
  title: string;
  progress: string;
  answers: string;
  budget: string;
  status: "active" | "paused" | "moderation" | "completed";
};

const rows: Row[] = [
  { id: "deliv", title: "Оцените качество сервиса доставки", progress: "64/200", answers: "64", budget: "12 800 ₽", status: "active" },
  { id: "coffee", title: "Кофе: привычки и выбор бренда", progress: "0/150", answers: "0", budget: "8 250 ₽", status: "moderation" },
  { id: "bank", title: "Мобильные банки: доверие", progress: "18/120", answers: "18", budget: "4 500 ₽", status: "paused" },
];

const columns: Column<Row>[] = [
  { key: "title", header: "Название", cell: (r) => r.title, className: "max-w-[520px]" },
  { key: "progress", header: "Прогресс", cell: (r) => <span className="tabular-nums">{r.progress}</span> },
  { key: "answers", header: "Ответов", cell: (r) => <span className="tabular-nums">{r.answers}</span> },
  { key: "budget", header: "Бюджет", cell: (r) => <span className="tabular-nums font-semibold">{r.budget}</span> },
  {
    key: "status",
    header: "Статус",
    cell: (r) => {
      const map = {
        active: { v: "active" as const, t: "Активен" },
        paused: { v: "pending" as const, t: "Пауза" },
        moderation: { v: "moderation" as const, t: "На модерации" },
        completed: { v: "completed" as const, t: "Завершён" },
      }[r.status];
      return <Badge variant={map.v}>{map.t}</Badge>;
    },
  },
  {
    key: "actions",
    header: "Действия",
    cell: (r) => (
      <div className="flex gap-3">
        <a className="text-sm font-semibold text-brand hover:underline" href={`/client/surveys/${r.id}`}>Статистика</a>
        <a className="text-sm font-semibold text-brand hover:underline" href="#">Пауза</a>
        <a className="text-sm font-semibold text-brand hover:underline" href="#">Стоп</a>
      </div>
    ),
  },
];

export default function ClientSurveysPage() {
  return (
    <div>
      <PageHeader
        title="Мои опросы"
        subtitle="Список опросов заказчика, статусы и управление."
        right={
          <a
            href="/client/surveys/create"
            className="inline-flex items-center justify-center rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-mid transition-colors"
          >
            Создать опрос
          </a>
        }
      />

      <div className="mt-8">
        <DataTable columns={columns} rows={rows} keyForRow={(r) => r.id} />
      </div>
    </div>
  );
}

