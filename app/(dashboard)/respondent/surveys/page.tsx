import * as React from "react";
import PageHeader from "@/components/dashboard/PageHeader";
import Tabs from "@/components/dashboard/Tabs";
import DataTable, { Column } from "@/components/dashboard/DataTable";
import EmptyState from "@/components/dashboard/EmptyState";

type InProgress = {
  title: string;
  progress: string;
  deadline: string;
};

type Completed = {
  date: string;
  title: string;
  reward: string;
};

const inProgress: InProgress[] = [
  { title: "Выбор бренда кофе: привычки и триггеры", progress: "5 из 12", deadline: "Осталось: 3 дня" },
];

const completed: Completed[] = [
  { date: "10.03.2026", title: "Новый интерфейс: что мешает пользоваться чаще?", reward: "180 ₽" },
  { date: "08.03.2026", title: "Оцените качество сервиса доставки", reward: "120 ₽" },
];

const columns: Column<Completed>[] = [
  { key: "date", header: "Дата", cell: (r) => r.date },
  { key: "title", header: "Название", cell: (r) => r.title, className: "max-w-[520px]" },
  { key: "reward", header: "Вознаграждение", cell: (r) => <span className="tabular-nums font-semibold text-brand">{r.reward}</span> },
  { key: "actions", header: "Действия", cell: () => <a className="text-sm font-semibold text-brand hover:underline" href="#">Пожаловаться</a> },
];

export default function RespondentSurveysPage() {
  return (
    <div>
      <PageHeader
        title="Мои опросы"
        subtitle="В работе и завершённые опросы."
        right={
          <React.Suspense
            fallback={
              <div className="h-11 w-[260px] rounded-xl border border-dash-border bg-dash-card" />
            }
          >
            <Tabs
              tabs={[
                { label: "В работе", value: "mine" },
                { label: "Завершённые", value: "completed" },
              ]}
              param="tab"
              defaultValue="mine"
            />
          </React.Suspense>
        }
      />

      <div className="mt-8">
        <div className="bg-dash-card border border-dash-border rounded-2xl p-6">
          <p className="text-sm font-semibold text-dash-heading font-body">В работе</p>
          <p className="mt-2 text-sm text-dash-muted font-body">
            Здесь отображаются незавершённые опросы.
          </p>

          {inProgress.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                title="Нет опросов в работе"
                description="Выберите новый опрос в ленте и начните прохождение."
              />
            </div>
          ) : (
            <div className="mt-6 grid gap-4">
              {inProgress.map((s) => (
                <div key={s.title} className="rounded-2xl border border-dash-border bg-dash-bg p-6">
                  <div className="flex items-start justify-between gap-6">
                    <div className="min-w-0">
                      <p className="font-display text-xl text-dash-heading">{s.title}</p>
                      <p className="mt-2 text-sm text-dash-muted font-body">
                        Прогресс: <span className="text-dash-body">{s.progress}</span> ·{" "}
                        <span className="text-dash-body">{s.deadline}</span>
                      </p>
                    </div>
                    <a
                      href="#"
                      className="inline-flex items-center justify-center rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-mid transition-colors"
                    >
                      Продолжить →
                    </a>
                  </div>
                  <div className="mt-5 h-2 rounded-full bg-dash-border overflow-hidden">
                    <div className="h-2 w-[42%] bg-brand" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-10">
        <p className="text-sm font-semibold text-dash-heading mb-4 font-body">
          Завершённые
        </p>
        <DataTable columns={columns} rows={completed} keyForRow={(r) => r.date + r.title} />
      </div>
    </div>
  );
}
