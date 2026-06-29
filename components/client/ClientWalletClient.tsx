"use client";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { QRCodeSVG } from "qrcode.react";
import Modal from "@/components/dashboard/Modal";
import Badge from "@/components/dashboard/Badge";
import {
  createDepositAction,
  createOzonDepositAction,
  checkOzonDepositAction,
} from "@/actions/payments";

type DepositMethod = "CARD" | "SBP_OZON" | "INVOICE";

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

type OzonPending = {
  sbpPayload: string;
  ozonPaymentId: string;
  amount: number;
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

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="mt-1 text-[12px] font-medium text-brand hover:underline"
    >
      {copied ? "Скопировано!" : "Скопировать ссылку СБП"}
    </button>
  );
}

export default function ClientWalletClient({ balance, transactions, payments, paymentSuccess }: Props) {
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState("500");
  const [depositMethod, setDepositMethod] = useState<DepositMethod>("CARD");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, startTransition] = useTransition();

  // Ozon СБП pending state
  const [ozonPending, setOzonPending] = useState<OzonPending | null>(null);
  const [ozonCheckStatus, setOzonCheckStatus] = useState<"idle" | "checking" | "confirmed" | "failed">("idle");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const normalizedAmount = useMemo(() => Number(depositAmount.replace(/[^\d]/g, "")), [depositAmount]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const checkOzonStatus = useCallback(
    async (paymentId: string) => {
      setOzonCheckStatus("checking");
      const result = await checkOzonDepositAction(paymentId);
      if ("error" in result) { setOzonCheckStatus("idle"); return; }
      if (result.status === "confirmed") {
        stopPolling();
        setOzonCheckStatus("confirmed");
      } else if (result.status === "failed") {
        stopPolling();
        setOzonCheckStatus("failed");
      } else {
        setOzonCheckStatus("idle");
      }
    },
    [stopPolling],
  );

  // Auto-poll every 10s while QR is shown
  useEffect(() => {
    if (!ozonPending) { stopPolling(); return; }
    pollRef.current = setInterval(() => {
      void checkOzonStatus(ozonPending.ozonPaymentId);
    }, 10_000);
    return stopPolling;
  }, [ozonPending, checkOzonStatus, stopPolling]);

  function resetOzon() {
    stopPolling();
    setOzonPending(null);
    setOzonCheckStatus("idle");
  }

  function handleDeposit() {
    setError(null);

    // INVOICE: synchronous — no server action needed; the API route validates auth
    // independently. Direct navigation works on all browsers including iOS Safari,
    // which blocks window.open() called from async callback contexts.
    if (depositMethod === "INVOICE") {
      if (!normalizedAmount || normalizedAmount < 100) {
        setError("Сумма счёта должна быть не меньше 100 ₽");
        return;
      }
      if (normalizedAmount > 10_000_000) {
        setError("Сумма не может превышать 10 000 000 ₽");
        return;
      }
      setShowDepositModal(false);
      window.location.href = `/api/invoices/draft?amount=${Math.round(normalizedAmount)}`;
      return;
    }

    startTransition(async () => {
      if (depositMethod === "SBP_OZON") {
        const result = await createOzonDepositAction(normalizedAmount);
        if ("error" in result) { setError(result.error); return; }
        setShowDepositModal(false);
        setOzonPending({ sbpPayload: result.sbpPayload, ozonPaymentId: result.ozonPaymentId, amount: result.amount });
        return;
      }

      // CARD / YuKassa
      const result = await createDepositAction(normalizedAmount);
      if (result.error || !result.confirmationUrl) {
        setError(result.error ?? "Не удалось создать платёж");
        return;
      }
      window.location.href = result.confirmationUrl;
    });
  }

  const depositButtonLabel =
    depositMethod === "INVOICE"
      ? "Скачать счёт PDF"
      : isLoading
        ? depositMethod === "SBP_OZON"
          ? "Создаём платёж СБП..."
          : "Создаём платёж..."
        : depositMethod === "SBP_OZON"
          ? "Получить QR-код СБП"
          : "Перейти к оплате";

  return (
    <div className="space-y-6">
      {paymentSuccess ? (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-medium text-emerald-600 dark:text-emerald-300">
          Платёж вернулся успешно. Баланс обновится автоматически после подтверждения платежа платёжной системой, обычно это занимает несколько минут.
        </div>
      ) : null}

      {/* ── Баланс ────────────────────────────────────────────────────────── */}
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

      {/* ── Ozon QR modal ─────────────────────────────────────────────────── */}
      <Modal
        open={!!ozonPending}
        title="Оплата по СБП"
        onClose={() => { if (ozonCheckStatus !== "confirmed") resetOzon(); }}
        footer={
          ozonCheckStatus === "confirmed" || ozonCheckStatus === "failed" ? (
            <button
              type="button"
              onClick={() => { resetOzon(); window.location.reload(); }}
              className="ml-auto rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-mid"
            >
              Обновить баланс
            </button>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-dash-muted">
                {ozonCheckStatus === "checking" ? "Проверяем статус…" : "Ожидание оплаты"}
              </span>
              <button
                type="button"
                onClick={() => ozonPending && void checkOzonStatus(ozonPending.ozonPaymentId)}
                disabled={ozonCheckStatus === "checking"}
                className="rounded-xl border border-dash-border bg-dash-bg px-4 py-2.5 text-sm font-semibold text-dash-heading hover:bg-dash-card disabled:opacity-50"
              >
                Проверить статус
              </button>
            </div>
          )
        }
      >
        {ozonPending && (
          <div className="flex flex-col items-center gap-4 py-2 text-center">
            {ozonCheckStatus === "confirmed" ? (
              <>
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/15">
                  <svg className="h-7 w-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="font-semibold text-dash-heading">Платёж подтверждён!</p>
                <p className="text-sm text-dash-muted">{formatRub(ozonPending.amount)} зачислено на баланс.</p>
              </>
            ) : ozonCheckStatus === "failed" ? (
              <>
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/15">
                  <svg className="h-7 w-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <p className="font-semibold text-dash-heading">Платёж отклонён</p>
                <p className="text-sm text-dash-muted">Попробуйте ещё раз или выберите другой способ оплаты.</p>
              </>
            ) : (
              <>
                <p className="text-sm text-dash-muted">
                  Отсканируйте QR в приложении вашего банка или нажмите кнопку&nbsp;«Открыть в&nbsp;банке»
                </p>
                <div className="rounded-2xl border border-dash-border bg-white p-3">
                  <QRCodeSVG
                    value={ozonPending.sbpPayload}
                    size={200}
                    bgColor="#ffffff"
                    fgColor="#1a1a2e"
                    level="M"
                  />
                </div>
                <p className="text-[13px] font-semibold text-dash-heading">Сумма: {formatRub(ozonPending.amount)}</p>
                <a
                  href={ozonPending.sbpPayload}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-xl border border-brand/30 bg-brand/10 px-5 py-2.5 text-sm font-semibold text-brand hover:bg-brand/20 transition-colors"
                >
                  Открыть в банке
                </a>
                <CopyButton text={ozonPending.sbpPayload} />
                <p className="max-w-xs text-xs text-dash-muted">
                  Страница обновится автоматически после подтверждения оплаты. Ссылка действительна 10 минут.
                </p>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* ── Таблицы транзакций ─────────────────────────────────────────────── */}
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

      {/* ── Deposit modal ─────────────────────────────────────────────────── */}
      <Modal
        open={showDepositModal}
        title="Пополнение баланса"
        onClose={() => {
          if (!isLoading) { setShowDepositModal(false); setError(null); }
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
              {depositButtonLabel}
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

          <div className="grid gap-3 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => setDepositMethod("CARD")}
              className={`rounded-2xl border p-4 text-left transition-colors ${
                depositMethod === "CARD" ? "border-brand/30 bg-brand/10" : "border-dash-border bg-dash-bg hover:border-brand/20"
              }`}
            >
              <div className="text-sm font-semibold text-dash-heading">Банковская карта</div>
              <div className="mt-2 text-sm text-dash-muted">ЮKassa — карта, СБП, кошелёк.</div>
            </button>

            <button
              type="button"
              onClick={() => setDepositMethod("SBP_OZON")}
              className={`rounded-2xl border p-4 text-left transition-colors ${
                depositMethod === "SBP_OZON" ? "border-brand/30 bg-brand/10" : "border-dash-border bg-dash-bg hover:border-brand/20"
              }`}
            >
              <div className="text-sm font-semibold text-dash-heading">СБП через Ozon</div>
              <div className="mt-2 text-sm text-dash-muted">QR-код, оплата в приложении банка.</div>
            </button>

            <button
              type="button"
              onClick={() => setDepositMethod("INVOICE")}
              className={`rounded-2xl border p-4 text-left transition-colors ${
                depositMethod === "INVOICE" ? "border-brand/30 bg-brand/10" : "border-dash-border bg-dash-bg hover:border-brand/20"
              }`}
            >
              <div className="text-sm font-semibold text-dash-heading">Безналичный расчёт</div>
              <div className="mt-2 text-sm text-dash-muted">Счёт PDF для юрлица или ИП.</div>
            </button>
          </div>

          {error ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-500">{error}</div>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}
