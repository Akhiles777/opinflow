"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Badge from "@/components/dashboard/Badge";
import Modal from "@/components/dashboard/Modal";
import AdminFinanceExportButton from "@/components/dashboard/AdminFinanceExportButton";
import { updateCommissionRateAction } from "@/actions/admin-settings";
import { approveWithdrawalAction, rejectWithdrawalAction, syncPayoutStatusesAction } from "@/actions/payments";

type TransactionRow = {
  id: string;
  date: string;
  type: string;
  user: string;
  amount: number;
  fee: number;
  status: { v: "completed" | "pending" | "rejected" | "draft"; t: string };
};

type WithdrawalRow = {
  id: string;
  user: string;
  method: string;
  methodLabel: string;
  amount: number;
  requisitesMasked: string;
  date: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "REJECTED" | "FAILED";
  adminNote: string | null;
};

type Props = {
  stats: {
    turnover: number;
    commission: number;
    paidOut: number;
  };
  commissionRate: number;
  transactions: TransactionRow[];
  withdrawals: WithdrawalRow[];
};

function formatRub(amount: number) {
  return `${new Intl.NumberFormat("ru-RU").format(amount)} ₽`;
}

function mapWithdrawalStatus(status: WithdrawalRow["status"]) {
  return status === "COMPLETED"
    ? { v: "completed" as const, t: "Завершено" }
    : status === "PROCESSING"
      ? { v: "pending" as const, t: "В обработке" }
      : status === "PENDING"
        ? { v: "pending" as const, t: "Ожидает" }
        : { v: "rejected" as const, t: status === "REJECTED" ? "Отклонено" : "Ошибка" };
}

export default function AdminFinanceClient({ stats, commissionRate, transactions, withdrawals }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"transactions" | "withdrawals">("transactions");
  const [statusFilter, setStatusFilter] = useState<"ALL" | WithdrawalRow["status"]>("ALL");
  const [rejectTarget, setRejectTarget] = useState<WithdrawalRow | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [commissionPercent, setCommissionPercent] = useState(String(Math.round(commissionRate * 1000) / 10));
  const [isPending, startTransition] = useTransition();
  const [syncInfo, setSyncInfo] = useState<string | null>(null);

  const filteredWithdrawals = useMemo(
    () => withdrawals.filter((item) => statusFilter === "ALL" || item.status === statusFilter),
    [statusFilter, withdrawals],
  );

  function handleApprove(requestId: string) {
    setError(null);
    startTransition(async () => {
      const result = await approveWithdrawalAction(requestId);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleReject() {
    if (!rejectTarget) return;
    setError(null);
    startTransition(async () => {
      const result = await rejectWithdrawalAction(rejectTarget.id, rejectReason);
      if (result.error) {
        setError(result.error);
        return;
      }

      setRejectTarget(null);
      setRejectReason("");
      router.refresh();
    });
  }

  function handleSaveCommission() {
    setError(null);
    startTransition(async () => {
      const value = Number(commissionPercent.replace(",", "."));
      const result = await updateCommissionRateAction(value);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleSyncPayoutStatuses() {
    setError(null);
    setSyncInfo(null);
    startTransition(async () => {
      const result = await syncPayoutStatusesAction({ limit: 100 });
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      if ("success" in result && result.success) {
        setSyncInfo(`Проверено: ${result.checked}, завершено: ${result.completed}, с ошибкой: ${result.failed}.`);
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-dash-border bg-dash-card p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-sm font-semibold text-dash-heading">Комиссия платформы</div>
            <div className="mt-1 text-sm text-dash-muted">Используется при расчёте бюджета новых опросов.</div>
          </div>
          <div className="flex w-full gap-3 lg:w-auto">
            <input
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={commissionPercent}
              onChange={(event) => setCommissionPercent(event.target.value)}
              className="h-11 w-full rounded-xl border border-dash-border bg-dash-bg px-4 text-sm text-dash-body outline-none focus:border-brand/40 lg:w-40"
            />
            <button
              type="button"
              onClick={handleSaveCommission}
              disabled={isPending}
              className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-mid disabled:opacity-60"
            >
              Сохранить
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {[
          { label: "Оборот за месяц", value: formatRub(stats.turnover) },
          { label: "Комиссия платформы", value: formatRub(stats.commission) },
          { label: "Выплачено респондентам", value: formatRub(stats.paidOut) },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-dash-border bg-dash-card p-6">
            <div className="text-sm uppercase tracking-[0.18em] text-dash-muted">{item.label}</div>
            <div className="mt-4 text-3xl font-display font-bold text-dash-heading">{item.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-dash-border bg-dash-card p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTab("transactions")}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${tab === "transactions" ? "bg-brand text-white" : "border border-dash-border bg-dash-bg text-dash-heading"}`}
            >
              Транзакции
            </button>
            <button
              type="button"
              onClick={() => setTab("withdrawals")}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${tab === "withdrawals" ? "bg-brand text-white" : "border border-dash-border bg-dash-bg text-dash-heading"}`}
            >
              Заявки на вывод
            </button>
          </div>

          {tab === "transactions" ? (
            <AdminFinanceExportButton rows={transactions.map((row) => ({
              ...row,
              status: row.status,
            }))} />
          ) : (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleSyncPayoutStatuses}
                disabled={isPending}
                className="rounded-full border border-dash-border bg-dash-bg px-4 py-2 text-sm font-semibold text-dash-heading transition-colors hover:border-brand/30 disabled:opacity-60"
              >
                Обновить статусы выплат
              </button>
              {(["ALL", "PENDING", "PROCESSING", "COMPLETED", "REJECTED", "FAILED"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setStatusFilter(item)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${statusFilter === item ? "bg-brand text-white" : "border border-dash-border bg-dash-bg text-dash-heading"}`}
                >
                  {item === "ALL"
                    ? "Все"
                    : item === "PENDING"
                      ? "Ожидают"
                      : item === "PROCESSING"
                        ? "В обработке"
                        : item === "COMPLETED"
                          ? "Завершённые"
                          : item === "REJECTED"
                            ? "Отклонённые"
                            : "С ошибкой"}
                </button>
              ))}
            </div>
          )}
        </div>

        {error ? <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-500">{error}</div> : null}
        {syncInfo ? (
          <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-200">
            {syncInfo}
          </div>
        ) : null}

        {tab === "transactions" ? (
          <div className="mt-6 grid gap-3">
            {transactions.map((row) => (
              <div key={row.id} className="rounded-2xl border border-dash-border bg-dash-bg p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-dash-heading">{row.user}</div>
                    <div className="mt-1 text-sm text-dash-muted">{row.date} · {row.type}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-semibold text-dash-heading">{formatRub(row.amount)}</div>
                    <div className="mt-1 text-sm text-dash-muted">Комиссия: {row.fee > 0 ? formatRub(row.fee) : "—"}</div>
                    <div className="mt-2"><Badge variant={row.status.v}>{row.status.t}</Badge></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 grid gap-3">
            {filteredWithdrawals.map((row) => {
              const status = mapWithdrawalStatus(row.status);
              return (
                <div key={row.id} className="rounded-2xl border border-dash-border bg-dash-bg p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="text-sm font-semibold text-dash-heading">{row.user}</div>
                      <div className="mt-1 text-sm text-dash-muted">{row.date}</div>
                      <div className="mt-3 text-sm text-dash-body">{row.methodLabel} · {row.requisitesMasked}</div>
                      {row.adminNote ? <div className="mt-2 text-sm text-red-500">{row.adminNote}</div> : null}
                    </div>
                    <div className="flex flex-col items-start gap-3 lg:items-end">
                      <div className="text-base font-semibold text-dash-heading">{formatRub(row.amount)}</div>
                      <Badge variant={status.v}>{status.t}</Badge>
                      {row.status === "PENDING" ? (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleApprove(row.id)}
                            disabled={isPending}
                            className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-mid disabled:opacity-60"
                          >
                            Одобрить
                          </button>
                          <button
                            type="button"
                            onClick={() => setRejectTarget(row)}
                            disabled={isPending}
                            className="rounded-xl border border-dash-border bg-white px-4 py-2 text-sm font-semibold text-dash-heading transition-colors hover:border-red-500/30 hover:text-red-500 dark:bg-dash-card disabled:opacity-60"
                          >
                            Отклонить
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        open={Boolean(rejectTarget)}
        title="Отклонить заявку"
        onClose={() => {
          if (!isPending) {
            setRejectTarget(null);
            setRejectReason("");
          }
        }}
        footer={
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleReject}
              disabled={isPending}
              className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-mid disabled:opacity-60"
            >
              {isPending ? "Сохраняем..." : "Отклонить"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="text-sm text-dash-muted">Укажите причину отклонения заявки на вывод.</div>
          <textarea
            value={rejectReason}
            onChange={(event) => setRejectReason(event.target.value)}
            rows={5}
            className="w-full rounded-2xl border border-dash-border bg-dash-bg px-4 py-3 text-sm text-dash-body outline-none focus:border-brand/40"
            placeholder="Например: неверные реквизиты или недостаточно данных для выплаты"
          />
        </div>
      </Modal>
    </div>
  );
}
