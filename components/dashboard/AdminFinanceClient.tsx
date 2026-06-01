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

function FinanceStatCard({
  icon,
  value,
  label,
}: {
  icon: string;
  value: string;
  label: string;
}) {
  return (
    <div className="h-[168px] rounded-[16px] border border-[#DCD2FF] bg-white px-6 py-6 dark:border-dash-border dark:bg-dash-card">
      <img src={icon} alt="" width={50} height={50} className="h-[50px] w-[50px]" aria-hidden="true" />

      <div className="mt-7 text-[30px] font-bold leading-none tracking-[-0.02em] text-[#1C0C4C] dark:text-white">
        {value}
      </div>

      <div className="mt-1 text-[16px] font-medium leading-tight text-[#82769F] dark:text-white/62">
        {label}
      </div>
    </div>
  );
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
  const financeStats = [
    {
      icon: "/cabinets/admin/icon.svg",
      label: "Оборот за месяц",
      value: formatRub(stats.turnover),
    },
    {
      icon: "/cabinets/admin/icon_com.svg",
      label: "Комиссия платформы",
      value: formatRub(stats.commission),
    },
    {
      icon: "/cabinets/admin/icon_res.svg",
      label: "Выплачено респондентам",
      value: formatRub(stats.paidOut),
    },
  ];
  const primaryButton = "rounded-[10px] bg-[#6D3AE2] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#7B4FF0] disabled:opacity-60";
  const ghostButton = "rounded-[10px] border border-dash-border bg-dash-bg/70 px-4 py-2 text-sm font-semibold text-dash-heading transition-colors hover:border-[#6D3AE2]/35 disabled:opacity-60";
  const activePill = "rounded-[8px] bg-[#6D3AE2] px-4 py-2 text-sm font-semibold text-white";
  const idlePill = "rounded-[8px] border border-dash-border bg-dash-bg/70 px-4 py-2 text-sm font-semibold text-dash-heading transition-colors hover:border-[#6D3AE2]/35";

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
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-[1.8fr_1fr_1fr_1fr]">
        {/* Комиссия */}
        <div className="rounded-[16px] border border-[#DCD2FF] bg-white p-6 dark:border-dash-border dark:bg-dash-card">
          <div className="text-[30px] font-bold text-dash-heading">
            Комиссия платформы
          </div>

          <div className="mt-2 text-sm text-dash-muted">
            Используется при расчёте бюджета новых опросов.
          </div>

          <div className="mt-6 flex gap-3">
            <input
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={commissionPercent}
              onChange={(event) => setCommissionPercent(event.target.value)}
              className="h-12 flex-1 rounded-[10px] border border-[#DCD2FF] bg-[#FAF7FB] px-4 text-sm font-medium text-[#1C0C4C] outline-none transition-colors placeholder:text-[#82769F] focus:border-[#6D3AE2] dark:border-dash-border dark:bg-white/[0.07] dark:text-white"
            />

            <button
              type="button"
              onClick={handleSaveCommission}
              disabled={isPending}
              className="h-12 rounded-[10px] bg-[#6D3AE2] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#7B4FF0] disabled:opacity-60"
            >
              Сохранить
            </button>
          </div>
        </div>

        {financeStats.map((item) => (
          <FinanceStatCard key={item.label} icon={item.icon} value={item.value} label={item.label} />
        ))}
      </div>

      <div className="rounded-[18px] border border-dash-border bg-dash-card p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTab("transactions")}
              className={tab === "transactions" ? activePill : idlePill}
            >
              Транзакции
            </button>
            <button
              type="button"
              onClick={() => setTab("withdrawals")}
              className={tab === "withdrawals" ? activePill : idlePill}
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
                className={ghostButton}
              >
                Обновить статусы выплат
              </button>
              {(["ALL", "PENDING", "PROCESSING", "COMPLETED", "REJECTED", "FAILED"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setStatusFilter(item)}
                  className={statusFilter === item ? activePill : idlePill}
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
              <div key={row.id} className="rounded-[14px] border border-dash-border bg-dash-bg/60 p-4">
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
                <div key={row.id} className="rounded-[14px] border border-dash-border bg-dash-bg/60 p-4">
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
                            className={primaryButton}
                          >
                            Одобрить
                          </button>
                          <button
                            type="button"
                            onClick={() => setRejectTarget(row)}
                            disabled={isPending}
                            className="rounded-[10px] border border-dash-border bg-dash-card px-4 py-2 text-sm font-semibold text-dash-heading transition-colors hover:border-red-500/30 hover:text-red-500 disabled:opacity-60"
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
              className={primaryButton}
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
            className="w-full rounded-[14px] border border-dash-border bg-dash-bg/70 px-4 py-3 text-sm text-dash-body outline-none focus:border-[#6D3AE2]/50"
            placeholder="Например: неверные реквизиты или недостаточно данных для выплаты"
          />
        </div>
      </Modal>
    </div>
  );
}
