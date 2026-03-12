"use client";

import * as React from "react";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable, { Column } from "@/components/dashboard/DataTable";
import Badge from "@/components/dashboard/Badge";
import Modal from "@/components/dashboard/Modal";

type Row = {
  id: string;
  survey: string;
  client: string;
  created: string;
  questions: string;
  budget: string;
  status: "moderation" | "completed" | "rejected";
};

const rows: Row[] = [
  { id: "s1", survey: "Доставка продуктов: оценка сервиса", client: "ООО Ритейл", created: "12.03.2026", questions: "8", budget: "12 800 ₽", status: "moderation" },
  { id: "s2", survey: "Кофе: выбор бренда", client: "ООО Напитки", created: "11.03.2026", questions: "12", budget: "8 250 ₽", status: "moderation" },
  { id: "s3", survey: "Сервис: UX аудит", client: "ИП Петров", created: "10.03.2026", questions: "10", budget: "4 500 ₽", status: "rejected" },
];

const tabs = [
  { label: "Все", value: "all" },
  { label: "На проверке", value: "moderation" },
  { label: "Одобренные", value: "completed" },
  { label: "Отклонённые", value: "rejected" },
] as const;

export default function AdminModerationPage() {
  const [filter, setFilter] = React.useState<(typeof tabs)[number]["value"]>("all");
  const [previewId, setPreviewId] = React.useState<string | null>(null);
  const [rejectId, setRejectId] = React.useState<string | null>(null);

  const filtered = rows.filter((r) => (filter === "all" ? true : r.status === filter));
  const current = rows.find((r) => r.id === previewId) ?? null;

  const columns: Column<Row>[] = [
    { key: "survey", header: "Опрос", cell: (r) => r.survey, className: "max-w-[420px]" },
    { key: "client", header: "Заказчик", cell: (r) => r.client },
    { key: "created", header: "Создан", cell: (r) => r.created },
    { key: "questions", header: "Вопросов", cell: (r) => <span className="tabular-nums">{r.questions}</span> },
    { key: "budget", header: "Бюджет", cell: (r) => <span className="tabular-nums font-semibold">{r.budget}</span> },
    {
      key: "status",
      header: "Статус",
      cell: (r) => {
        const map = {
          moderation: { v: "moderation" as const, t: "На проверке" },
          completed: { v: "completed" as const, t: "Одобрен" },
          rejected: { v: "rejected" as const, t: "Отклонён" },
        }[r.status];
        return <Badge variant={map.v}>{map.t}</Badge>;
      },
    },
    {
      key: "actions",
      header: "Действия",
      cell: (r) => (
        <div className="flex gap-2">
          <button type="button" onClick={() => setPreviewId(r.id)} className="text-sm font-semibold text-brand hover:underline">
            Просмотреть
          </button>
          <button type="button" className="text-sm font-semibold text-green-700 dark:text-green-400 hover:underline">
            Одобрить
          </button>
          <button type="button" onClick={() => setRejectId(r.id)} className="text-sm font-semibold text-red-600 dark:text-red-400 hover:underline">
            Отклонить
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Модерация" subtitle="Очередь опросов перед публикацией." />

      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setFilter(t.value)}
            className={[
              "px-4 py-2 rounded-xl text-sm font-semibold font-body border transition-colors",
              t.value === filter
                ? "bg-brand/10 border-brand/30 text-brand"
                : "bg-dash-card border-dash-border text-dash-muted hover:text-dash-heading hover:bg-dash-bg",
            ].join(" ")}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-8">
        <DataTable columns={columns} rows={filtered} keyForRow={(r) => r.id} />
      </div>

      <Modal
        open={Boolean(previewId)}
        title="Превью опроса"
        onClose={() => setPreviewId(null)}
        footer={
          <div className="flex gap-2 justify-end">
            <button type="button" className="rounded-xl border border-dash-border bg-dash-card px-5 py-2.5 text-sm font-semibold text-dash-heading hover:bg-dash-bg transition-colors">
              Отклонить с причиной
            </button>
            <button type="button" className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-mid transition-colors">
              Одобрить
            </button>
          </div>
        }
      >
        {current ? (
          <div className="grid gap-4">
            <div className="rounded-2xl border border-dash-border bg-dash-bg p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand font-body mb-2">Заголовок</p>
              <p className="font-display text-xl text-dash-heading">{current.survey}</p>
              <p className="mt-2 text-sm text-dash-muted font-body">Заказчик: {current.client}</p>
            </div>
            <div className="rounded-2xl border border-dash-border bg-dash-bg p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand font-body mb-2">Вопросы</p>
              <div className="grid gap-3">
                {[
                  "Оцените удобство по шкале 1–5",
                  "Что вам понравилось?",
                  "Что бы вы улучшили?",
                ].map((q, i) => (
                  <div key={q} className="rounded-xl border border-dash-border bg-dash-card p-4">
                    <p className="text-sm font-semibold text-dash-heading font-body">
                      {i + 1}. {q}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-dash-muted font-body">Нет данных</p>
        )}
      </Modal>

      <Modal
        open={Boolean(rejectId)}
        title="Причина отклонения"
        onClose={() => setRejectId(null)}
        footer={
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setRejectId(null)} className="rounded-xl border border-dash-border bg-dash-card px-5 py-2.5 text-sm font-semibold text-dash-heading hover:bg-dash-bg transition-colors">
              Отмена
            </button>
            <button type="button" className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-mid transition-colors">
              Отклонить
            </button>
          </div>
        }
      >
        <textarea className="w-full min-h-[140px] rounded-xl border border-dash-border bg-dash-bg px-3 py-2 text-sm text-dash-body" placeholder="Например: некорректные формулировки, запрещённая тематика..." />
      </Modal>
    </div>
  );
}

