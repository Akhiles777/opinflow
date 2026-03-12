import * as React from "react";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable, { Column } from "@/components/dashboard/DataTable";

type Row = {
  name: string;
  date: string;
  status: string;
  bonus: string;
};

const rows: Row[] = [
  { name: "А***", date: "05.03.2026", status: "Зарегистрирован", bonus: "120 ₽" },
  { name: "М***", date: "01.03.2026", status: "Активен", bonus: "80 ₽" },
];

const columns: Column<Row>[] = [
  { key: "name", header: "Имя", cell: (r) => r.name },
  { key: "date", header: "Регистрация", cell: (r) => r.date },
  { key: "status", header: "Статус", cell: (r) => r.status },
  { key: "bonus", header: "Ваш бонус", cell: (r) => <span className="tabular-nums font-semibold text-brand">{r.bonus}</span> },
];

export default function RespondentReferralPage() {
  return (
    <div>
      <PageHeader title="Рефералы" subtitle="Ссылка, статистика и приглашённые пользователи." />

      <div className="mt-8 grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
        <div className="rounded-2xl bg-dash-sidebar text-white p-8">
          <p className="text-sm text-white/40 mb-2 font-body">Ваша реферальная ссылка</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              readOnly
              value="https://potokmneny.ru/r/abc123"
              className="h-11 flex-1 rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white/80"
            />
            <button type="button" className="h-11 rounded-xl bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-mid transition-colors">
              Скопировать
            </button>
          </div>
          <p className="mt-3 text-xs text-white/35 font-body">Состояние “Скопировано ✓” добавим на Этапе 2.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Приглашено", value: "3" },
            { label: "Зарегистрировались", value: "2" },
            { label: "Заработано", value: "200 ₽" },
          ].map((s) => (
            <div key={s.label} className="bg-dash-card border border-dash-border rounded-2xl p-6">
              <p className="text-sm text-dash-muted font-body">{s.label}</p>
              <p className="mt-2 font-display text-3xl text-dash-heading font-bold tabular-nums">{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10">
        <p className="text-sm font-semibold text-dash-heading mb-4 font-body">
          Приглашённые
        </p>
        <DataTable columns={columns} rows={rows} keyForRow={(r) => r.name + r.date} />
      </div>
    </div>
  );
}

