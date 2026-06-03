"use client";
import { useMemo, useState, useTransition } from "react";
import Modal from "@/components/dashboard/Modal";
import Badge from "@/components/dashboard/Badge";
import { createCorporateInvoiceAction, createDepositAction } from "@/actions/payments";

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
  const [depositMethod, setDepositMethod] = useState<"CARD" | "INVOICE">("CARD");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, startTransition] = useTransition();

  const normalizedAmount = useMemo(() => Number(depositAmount.replace(/[^\d]/g, "")), [depositAmount]);

  function handleDeposit() {
    setError(null);
    startTransition(async () => {
      if (depositMethod === "INVOICE") {
        const result = (await createCorporateInvoiceAction(normalizedAmount)) as any;
        if (result?.error || !result?.downloadUrl) {
          setError(result?.error ?? "Не удалось сформировать счёт");
          return;
        }
        try {
          const res = await fetch(result.downloadUrl);
          if (!res.ok) {
            let msg = "Не удалось сформировать счёт";
            try { const d = await res.json(); msg = d.error || msg; } catch { /* ignore */ }
            setError(msg);
            return;
          }
          const blob = await res.blob();
          const objectUrl = URL.createObjectURL(blob);
          const anchor = document.createElement("a");
          anchor.href = objectUrl;
          anchor.download = `invoice_${normalizedAmount}.pdf`;
          document.body.appendChild(anchor);
          anchor.click();
          document.body.removeChild(anchor);
          setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
          setShowDepositModal(false);
        } catch {
          setError("Ошибка при скачивании счёта. Попробуйте ещё раз.");
        }
        return;
      }

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

      {/* Balance card — narrow, left-aligned per mockup */}
      <div className="max-w-[540px] rounded-[18px] border border-dash-border bg-dash-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[38px] font-bold leading-none text-[#6D3AE2] tabular-nums">{formatRub(balance)}</p>
            <p className="mt-1.5 text-[13px] font-medium text-dash-muted">Текущий баланс</p>
            <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-dash-muted">
              Средства используются для запуска опросов и резервируются при отправке опроса на модерацию.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowDepositModal(true)}
            className="shrink-0 rounded-xl bg-[#7244F5] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_6px_18px_rgba(114,68,245,0.45)] transition-all hover:bg-[#6238DC] hover:shadow-[0_6px_18px_rgba(114,68,245,0.6)]"
          >
            Пополнить баланс
          </button>
        </div>
      </div>

      {/* Transactions + Payments tables */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* История транзакций */}
        <div className="rounded-[18px] border border-dash-border bg-dash-card">
          <div className="border-b border-dash-border px-6 py-4">
            <h2 className="text-[17px] font-semibold text-dash-heading">История транзакций</h2>
          </div>
          {transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-dash-border bg-dash-bg/40">
                    <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-dash-muted">Заявка №</th>
                    <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-dash-muted">Дата</th>
                    <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-dash-muted">Сумма</th>
                    <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-dash-muted">Статус</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dash-border">
                  {transactions.map((item) => (
                    <tr key={item.id} className="hover:bg-dash-bg/30 transition-colors">
                      <td className="px-6 py-4 text-[13px] font-medium text-dash-body">{item.id.slice(0, 8).toUpperCase()}</td>
                      <td className="px-6 py-4 text-[13px] text-dash-body whitespace-nowrap">{item.date}</td>
                      <td className={`px-6 py-4 text-[14px] font-semibold tabular-nums whitespace-nowrap ${item.amount >= 0 ? "text-emerald-500" : "text-dash-body"}`}>
                        {item.amount >= 0 ? "+" : "-"}{formatRub(Math.abs(item.amount))}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={mapStatus(item.status).v}>{mapStatus(item.status).t}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-8 text-sm text-dash-muted">Операций пока нет.</div>
          )}
        </div>

        {/* Последние платежи */}
        <div className="rounded-[18px] border border-dash-border bg-dash-card">
          <div className="border-b border-dash-border px-6 py-4">
            <h2 className="text-[17px] font-semibold text-dash-heading">Последние платежи</h2>
          </div>
          {payments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-dash-border bg-dash-bg/40">
                    <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-dash-muted">Заявка №</th>
                    <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-dash-muted">Дата</th>
                    <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-dash-muted">Сумма</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dash-border">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-dash-bg/30 transition-colors">
                      <td className="px-6 py-4 text-[13px] font-medium text-dash-body">{payment.id.slice(0, 8).toUpperCase()}</td>
                      <td className="px-6 py-4 text-[13px] text-dash-body whitespace-nowrap">{payment.date}</td>
                      <td className="px-6 py-4 text-[14px] font-semibold tabular-nums whitespace-nowrap text-dash-body">
                        {formatRub(payment.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-8 text-sm text-dash-muted">Платежей пока нет.</div>
          )}
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
              className="rounded-xl bg-[#7244F5] px-5 py-3 text-sm font-semibold text-white shadow-[0_6px_18px_rgba(114,68,245,0.45)] transition-all hover:bg-[#6238DC] disabled:opacity-60"
            >
              {isLoading
                ? depositMethod === "INVOICE"
                  ? "Формируем счёт..."
                  : "Создаём платёж..."
                : depositMethod === "INVOICE"
                  ? "Скачать счёт PDF"
                  : "Перейти к оплате"}
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

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setDepositMethod("CARD")}
              className={`rounded-2xl border p-4 text-left transition-colors ${
                depositMethod === "CARD"
                  ? "border-brand/30 bg-brand/10"
                  : "border-dash-border bg-dash-bg hover:border-brand/20"
              }`}
            >
              <div className="text-sm font-semibold text-dash-heading">Банковская карта / ЮKassa</div>
              <div className="mt-2 text-sm text-dash-muted">
                Моментальное пополнение через карту или СБП.
              </div>
            </button>

            <button
              type="button"
              onClick={() => setDepositMethod("INVOICE")}
              className={`rounded-2xl border p-4 text-left transition-colors ${
                depositMethod === "INVOICE"
                  ? "border-brand/30 bg-brand/10"
                  : "border-dash-border bg-dash-bg hover:border-brand/20"
              }`}
            >
              <div className="text-sm font-semibold text-dash-heading">Безналичный расчёт</div>
              <div className="mt-2 text-sm text-dash-muted">
                Сформируем счёт PDF для оплаты от юрлица или ИП по реквизитам из настроек.
              </div>
            </button>
          </div>

          {error ? <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-500">{error}</div> : null}
        </div>
      </Modal>
    </div>
  );
}
