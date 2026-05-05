"use client";
import { useMemo, useState, useTransition } from "react";
import Modal from "@/components/dashboard/Modal";
import Badge from "@/components/dashboard/Badge";
import { createDepositAction } from "@/actions/payments";

type Props = {
  balance: number;
  paymentSuccess?: boolean;
  transactions: Array<{
    id: string;
    date: string;
    type: string;
    description: string;
    amount: number;
    status: "completed" | "pending" | "rejected" | "draft";
  }>;
  payments: Array<{
    id: string;
    date: string;
    amount: number;
    status: string;
    confirmationUrl: string | null;
  }>;
};

const quickAmounts = [500, 1000, 5000, 10000];

function formatRub(amount: number) {
  return new Intl.NumberFormat("ru-RU").format(amount) + " ₽";
}

function mapStatus(status: string) {
  const normalized = status.toUpperCase();

  if (normalized === "SUCCEEDED" || normalized === "COMPLETED") {
    return { v: "completed" as const, t: "Успешно" };
  }

  if (normalized === "WAITING" || normalized === "PENDING") {
    return { v: "pending" as const, t: "Ожидание" };
  }

  if (normalized === "CANCELED" || normalized === "CANCELLED" || normalized === "DRAFT") {
    return { v: "draft" as const, t: "Отменено" };
  }

  return { v: "rejected" as const, t: "Ошибка" };
}

export default function ClientWalletClient({ balance, transactions, payments, paymentSuccess }: Props) {
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState("500");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, startTransition] = useTransition();

  const normalizedAmount = useMemo(() => Number(depositAmount.replace(/[^\d]/g, "")), [depositAmount]);

  function handleDeposit() {
    setError(null);
    startTransition(async () => {
      const result = await createDepositAction(normalizedAmount);
      if (result.error || !result.confirmationUrl) {
        setError(result.error ?? "Не удалось создать платёж");
        return;
      }

      window.location.href = result.confirmationUrl;
    });
  }

  return (
    <div className="space-y-6">
      {paymentSuccess ? (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-medium text-emerald-600 dark:text-emerald-300">
          Платёж вернулся успешно. Баланс обновится автоматически после подтверждения платежа платёжной системой, обычно это занимает несколько минут.
        </div>
      ) : null}

      <section className="rounded-3xl border border-dash-border bg-dash-card p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-[0.2em] text-dash-muted">Текущий баланс</div>
            <div className="mt-3 font-display text-4xl text-dash-heading sm:text-5xl">{formatRub(balance)}</div>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-dash-muted">
              Средства используются для запуска опросов и резервируются при отправке опроса на модерацию.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowDepositModal(true)}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-mid lg:w-auto"
          >
            Пополнить баланс
          </button>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-dash-border bg-dash-card p-6">
          <div className="text-sm font-semibold text-dash-heading">История транзакций</div>
          <div className="mt-5 space-y-3">
            {transactions.length > 0 ? (
              transactions.map((item) => (
                <div key={item.id} className="rounded-2xl border border-dash-border bg-dash-bg p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-dash-heading">{item.description}</div>
                      <div className="mt-1 text-sm text-dash-muted">{item.date} · {item.type}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-base font-semibold tabular-nums ${item.amount >= 0 ? "text-emerald-500" : "text-dash-heading"}`}>
                        {item.amount >= 0 ? "+" : "-"}{formatRub(Math.abs(item.amount))}
                      </div>
                      <div className="mt-2">
                        <Badge variant={mapStatus(item.status).v}>{mapStatus(item.status).t}</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dash-border bg-dash-bg p-6 text-sm text-dash-muted">
                Операций пока нет.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-dash-border bg-dash-card p-6">
          <div className="text-sm font-semibold text-dash-heading">Последние платежи</div>
          <div className="mt-5 space-y-3">
            {payments.length > 0 ? (
              payments.map((payment) => {
                const status = mapStatus(payment.status);
                return (
                  <div key={payment.id} className="rounded-2xl border border-dash-border bg-dash-bg p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-dash-heading">Пополнение на {formatRub(payment.amount)}</div>
                        <div className="mt-1 text-sm text-dash-muted">{payment.date}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={status.v}>{status.t}</Badge>
                        {payment.status.toUpperCase() === "WAITING" && payment.confirmationUrl ? (
                          <button
                            type="button"
                            onClick={() => window.open(payment.confirmationUrl!, "_blank", "noopener,noreferrer")}
                            className="text-sm font-semibold text-brand hover:underline"
                          >
                            Продолжить оплату
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dash-border bg-dash-bg p-6 text-sm text-dash-muted">
                Платежей пока нет.
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        open={showDepositModal}
        title="Пополнение баланса"
        onClose={() => {
          if (!isLoading) {
            setShowDepositModal(false);
            setError(null);
          }
        }}
        footer={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-dash-muted">Минимальная сумма — 100 ₽</div>
            <button
              type="button"
              onClick={handleDeposit}
              disabled={isLoading}
              className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-mid disabled:opacity-60"
            >
              {isLoading ? "Создаём платёж..." : "Перейти к оплате"}
            </button>
          </div>
        }
      >
        <div className="space-y-5">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-dash-heading">Сумма пополнения</span>
            <input
              type="number"
              min={100}
              value={depositAmount}
              onChange={(event) => setDepositAmount(event.target.value)}
              placeholder="500"
              className="h-12 rounded-xl border border-dash-border bg-dash-bg px-4 text-base text-dash-body outline-none focus:border-brand/40"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            {quickAmounts.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => setDepositAmount(String(amount))}
                className="rounded-full border border-dash-border bg-dash-bg px-4 py-2 text-sm font-semibold text-dash-heading transition-colors hover:border-brand/30 hover:text-brand"
              >
                {formatRub(amount)}
              </button>
            ))}
          </div>

          {error ? <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-500">{error}</div> : null}
        </div>
      </Modal>
    </div>
  );
}
