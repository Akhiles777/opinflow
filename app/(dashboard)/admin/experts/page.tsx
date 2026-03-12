"use client";

import * as React from "react";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable, { Column } from "@/components/dashboard/DataTable";
import Badge from "@/components/dashboard/Badge";
import Modal from "@/components/dashboard/Modal";

type Order = {
  id: string;
  client: string;
  survey: string;
  date: string;
  expert: string | null;
  status: "pending" | "assigned" | "done";
};

const orders: Order[] = [
  { id: "o1", client: "ООО Ритейл", survey: "Доставка продуктов", date: "12.03.2026", expert: null, status: "pending" },
  { id: "o2", client: "ООО Напитки", survey: "Кофе: привычки", date: "08.03.2026", expert: "А. Сидорова", status: "assigned" },
];

const experts = ["А. Сидорова", "И. Марков", "Е. Иванова"];

export default function AdminExpertsPage() {
  const [assignId, setAssignId] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState(experts[0] ?? "");

  const columns: Column<Order>[] = [
    { key: "client", header: "Заказчик", cell: (r) => r.client },
    { key: "survey", header: "Опрос", cell: (r) => r.survey, className: "max-w-[420px]" },
    { key: "date", header: "Дата заказа", cell: (r) => r.date },
    { key: "expert", header: "Эксперт", cell: (r) => r.expert ?? "—" },
    {
      key: "status",
      header: "Статус",
      cell: (r) => {
        const map =
          r.status === "pending"
            ? { v: "pending" as const, t: "Ожидает" }
            : r.status === "assigned"
            ? { v: "moderation" as const, t: "Назначен" }
            : { v: "completed" as const, t: "Готово" };
        return <Badge variant={map.v}>{map.t}</Badge>;
      },
    },
    {
      key: "actions",
      header: "Действия",
      cell: (r) => (
        <div className="flex gap-3">
          <button type="button" onClick={() => setAssignId(r.id)} className="text-sm font-semibold text-brand hover:underline">
            Назначить эксперта
          </button>
          <a className="text-sm font-semibold text-brand hover:underline" href="#">
            Загрузить PDF
          </a>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Эксперты" subtitle="Заказы на экспертные заключения и назначение специалистов." />

      <div className="mt-8">
        <DataTable columns={columns} rows={orders} keyForRow={(r) => r.id} />
      </div>

      <Modal
        open={Boolean(assignId)}
        title="Назначить эксперта"
        onClose={() => setAssignId(null)}
        footer={
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setAssignId(null)} className="rounded-xl border border-dash-border bg-dash-card px-5 py-2.5 text-sm font-semibold text-dash-heading hover:bg-dash-bg transition-colors">
              Отмена
            </button>
            <button type="button" className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-mid transition-colors">
              Назначить
            </button>
          </div>
        }
      >
        <label className="grid gap-2">
          <span className="text-sm text-dash-muted font-body">Эксперт</span>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="h-11 rounded-xl border border-dash-border bg-dash-bg px-3 text-sm text-dash-body"
          >
            {experts.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </label>
        <p className="mt-3 text-sm text-dash-muted font-body">
          На Этапе 5 здесь будет реальный список экспертов и статусы загрузки заключений.
        </p>
      </Modal>
    </div>
  );
}

