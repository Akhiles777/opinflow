import * as React from "react";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable, { Column } from "@/components/dashboard/DataTable";
import Badge from "@/components/dashboard/Badge";
import EmptyState from "@/components/dashboard/EmptyState";
import {
  formatRub,
  getWalletData,
  mapTransactionStatus,
  mapTransactionTypeForRespondent,
} from "@/lib/dashboard-data";
import { requireRole } from "@/lib/auth-utils";

type Row = {
  date: string;
  type: string;
  description: string;
  amount: string;
  status: "completed" | "pending" | "rejected" | "draft";
};

const columns: Column<Row>[] = [
  { key: "date", header: "Дата", cell: (r) => r.date },
  { key: "type", header: "Тип", cell: (r) => r.type },
  { key: "desc", header: "Описание", cell: (r) => r.description },
  { key: "amount", header: "Сумма", cell: (r) => <span className="tabular-nums font-semibold">{r.amount}</span> },
  {
    key: "status",
    header: "Статус",
    cell: (r) => <Badge variant={r.status}>{mapTransactionStatusText(r.status)}</Badge>,
  },
];

function mapTransactionStatusText(status: Row["status"]) {
  return status === "completed" ? "Завершено" : status === "pending" ? "Ожидание" : status === "rejected" ? "Ошибка" : "Отменено";
}

export default async function RespondentWalletPage() {
  const session = await requireRole("RESPONDENT");
  const wallet = await getWalletData(session.user.id);
  const rows: Row[] = wallet.transactions.map((item) => ({
    date: item.date,
    type: mapTransactionTypeForRespondent(item.type),
    description: item.description,
    amount: `${item.type === "WITHDRAWAL" ? "-" : "+"}${formatRub(Math.abs(item.amount))}`,
    status: mapTransactionStatus(item.status).v,
  }));

  return (
    <div>
      <PageHeader
        title="Кошелёк"
        subtitle="Баланс, вывод средств и история транзакций."
      />

      <div className="mt-8 grid grid-cols-1 gap-5 xl:grid-cols-2 xl:items-start">
        <div className="rounded-2xl border border-dash-border bg-dash-card p-8">
          <p className="mb-2 text-sm font-body text-dash-muted">Доступный баланс</p>
          <p className="mb-6 font-display text-4xl font-bold tabular-nums text-dash-heading sm:text-5xl">{formatRub(wallet.balance)}</p>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-xl bg-brand px-7 py-3.5 text-base font-semibold text-white hover:bg-brand-mid transition-colors"
          >
            Вывести средства
          </button>
          <p className="mt-3 text-xs font-body text-dash-muted">Модал вывода подключим на Этапе 4.</p>
        </div>

        <div className="bg-dash-card border border-dash-border rounded-2xl p-6">
          <p className="text-sm font-semibold text-dash-heading font-body">Статистика</p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Заработано", value: formatRub(wallet.totalEarned) },
              { label: "В кошельке", value: formatRub(wallet.balance) },
              { label: "Выведено", value: formatRub(wallet.totalSpent) },
            ].map((i) => (
              <div key={i.label} className="rounded-xl border border-dash-border bg-dash-bg p-4">
                <p className="text-xs text-dash-muted font-body">{i.label}</p>
                <p className="mt-2 text-lg font-semibold text-dash-heading tabular-nums">{i.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-10">
        <p className="text-sm font-semibold text-dash-heading mb-4 font-body">
          История транзакций
        </p>
        {rows.length > 0 ? (
          <DataTable columns={columns} rows={rows} keyForRow={(r) => r.date + r.description} />
        ) : (
          <EmptyState
            title="История пока пуста"
            description="Пройдите первый опрос или дождитесь начисления, чтобы здесь появились операции."
          />
        )}
      </div>
    </div>
  );
}
