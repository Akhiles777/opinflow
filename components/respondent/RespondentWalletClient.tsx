"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/dashboard/Modal";
import Badge from "@/components/dashboard/Badge";
import { createWithdrawalAction } from "@/actions/payments";

type WithdrawalMethod = "CARD" | "SBP" | "WALLET";

type Props = {
  balance: number;
  totalEarned: number;
  totalSpent: number;
  transactions: Array<{
    id: string;
    date: string;
    type: string;
    description: string;
    amount: number;
    status: "completed" | "pending" | "rejected" | "draft";
  }>;
  withdrawalRequests: Array<{
    id: string;
    date: string;
    method: WithdrawalMethod;
    amount: number;
    status: "PENDING" | "PROCESSING" | "COMPLETED" | "REJECTED" | "FAILED";
    adminNote: string | null;
    requisitesMasked: string;
  }>;
};

const sbpBanks = [
  { value: "sberbank", label: "Сбербанк" },
  { value: "tinkoff", label: "Т-Банк" },
  { value: "vtb", label: "ВТБ" },
  { value: "alfabank", label: "Альфа-Банк" },
  { value: "gazprombank", label: "Газпромбанк" },
];

function formatRub(amount: number) {
  return `${new Intl.NumberFormat("ru-RU").format(amount)} ₽`;
}

function mapRequestStatus(status: Props["withdrawalRequests"][number]["status"]) {
  return status === "COMPLETED"
    ? { v: "completed" as const, t: "Выплачено" }
    : status === "PROCESSING"
      ? { v: "pending" as const, t: "В обработке" }
      : status === "PENDING"
        ? { v: "pending" as const, t: "Ожидание" }
        : { v: "rejected" as const, t: status === "REJECTED" ? "Отклонено" : "Ошибка" };
}

function maskCard(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

export default function RespondentWalletClient({
  balance,
  totalEarned,
  totalSpent,
  transactions,
  withdrawalRequests,
}: Props) {
  const router = useRouter();
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [method, setMethod] = useState<WithdrawalMethod>("CARD");
  const [amount, setAmount] = useState("100");
  const [cardNumber, setCardNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [bankId, setBankId] = useState(sbpBanks[0].value);
  const [walletNumber, setWalletNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, startTransition] = useTransition();

  const numericAmount = useMemo(() => Number(amount.replace(/[^\d]/g, "")), [amount]);
  const earningTransactions = transactions.filter((item) => item.type === "Начисление");

  function resetModal() {
    setShowWithdrawModal(false);
    setStep(1);
    setMethod("CARD");
    setAmount("100");
    setCardNumber("");
    setPhone("");
    setBankId(sbpBanks[0].value);
    setWalletNumber("");
    setError(null);
  }

  function buildRequisites(): Record<string, string> {
    if (method === "CARD") {
      return { cardNumber: cardNumber.replace(/\s/g, "") };
    }

    if (method === "SBP") {
      return { phone, bankId };
    }

    return { walletNumber };
  }

  function handleSubmit() {
    setError(null);
    setSuccessMessage(null);

    if (numericAmount < 100) {
      setError("Минимальная сумма вывода — 100 ₽");
      return;
    }

    if (numericAmount > balance) {
      setError("Сумма вывода не может превышать текущий баланс");
      return;
    }

    if (method === "CARD" && cardNumber.replace(/\D/g, "").length !== 16) {
      setError("Введите полный номер карты");
      return;
    }

    if (method === "SBP" && phone.trim().length < 10) {
      setError("Введите номер телефона для СБП");
      return;
    }

    if (method === "WALLET" && walletNumber.trim().length < 5) {
      setError("Введите номер кошелька");
      return;
    }

    startTransition(async () => {
      const result = await createWithdrawalAction({
        amount: numericAmount,
        method,
        requisites: buildRequisites(),
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      resetModal();
      setSuccessMessage("Заявка на вывод создана. Статус выплаты обновится автоматически.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      {successMessage ? (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-medium text-emerald-600 dark:text-emerald-300">
          {successMessage}
        </div>
      ) : null}

      <section className="rounded-3xl border border-dash-border bg-dash-card p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-[0.2em] text-dash-muted">Доступный баланс</div>
            <div className="mt-3 font-display text-4xl text-dash-heading sm:text-5xl">{formatRub(balance)}</div>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-dash-muted">
              Вознаграждения за опросы поступают сюда. Отправляйте заявки на вывод и отслеживайте их статус в одном месте.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 lg:w-auto lg:items-end">
            <button
              type="button"
              onClick={() => setShowWithdrawModal(true)}
              disabled={balance < 100}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-mid disabled:cursor-not-allowed disabled:opacity-50 lg:w-auto"
            >
              Вывести средства
            </button>
            <div className="text-xs text-dash-muted">Минимальная сумма вывода — 100 ₽</div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {[
            { label: "Заработано", value: formatRub(totalEarned) },
            { label: "Доступно сейчас", value: formatRub(balance) },
            { label: "Уже выведено", value: formatRub(totalSpent) },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-dash-border bg-dash-bg p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-dash-muted">{item.label}</div>
              <div className="mt-2 text-xl font-semibold text-dash-heading">{item.value}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid items-start gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section className="rounded-2xl border border-dash-border bg-dash-card p-5 sm:p-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-dash-heading">Заявки на вывод</div>
              <div className="rounded-full bg-dash-bg px-2.5 py-1 text-xs font-medium text-dash-muted">
                {withdrawalRequests.length}
              </div>
            </div>
            <div className="text-sm text-dash-muted">
              Статус всех заявок на вывод средств.
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {withdrawalRequests.length > 0 ? (
              withdrawalRequests.map((item) => {
                const status = mapRequestStatus(item.status);
                return (
                  <div key={item.id} className="rounded-2xl border border-dash-border bg-dash-bg p-4">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-dash-heading">
                            {formatRub(item.amount)} · {item.method}
                          </div>
                          <div className="mt-1 text-sm text-dash-muted">{item.date}</div>
                        </div>
                        <Badge variant={status.v}>{status.t}</Badge>
                      </div>
                      <div className="text-sm text-dash-muted">{item.requisitesMasked}</div>
                      {item.adminNote ? <div className="text-sm text-red-500">{item.adminNote}</div> : null}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dash-border bg-dash-bg p-5 text-sm leading-relaxed text-dash-muted">
                Пока заявок нет. Когда вы отправите первую заявку, она появится здесь со статусом обработки.
              </div>
            )}
          </div>
        </section>

        <div className="grid gap-5">
          <section className="rounded-2xl border border-dash-border bg-dash-card p-5 sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-sm font-semibold text-dash-heading">История начислений</div>
                <div className="mt-1 text-sm text-dash-muted">
                  Все вознаграждения за успешно пройденные опросы отображаются здесь.
                </div>
              </div>
              <div className="rounded-full bg-dash-bg px-2.5 py-1 text-xs font-medium text-dash-muted">
                {earningTransactions.length} операций
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {earningTransactions.length > 0 ? (
                earningTransactions.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-dash-border bg-dash-bg p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-dash-heading">{item.description}</div>
                        <div className="mt-1 text-sm text-dash-muted">{item.date}</div>
                      </div>
                      <div className="shrink-0 text-base font-semibold text-emerald-500">+{formatRub(Math.abs(item.amount))}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dash-border bg-dash-bg p-5 text-sm leading-relaxed text-dash-muted">
                  Начислений пока нет. После первых завершённых опросов здесь появится история ваших вознаграждений.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      <Modal
        open={showWithdrawModal}
        title="Вывод средств"
        onClose={() => {
          if (!isLoading) resetModal();
        }}
        footer={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-dash-muted">Минимальная сумма — 100 ₽</div>
            {step === 1 ? (
              <button
                type="button"
                onClick={() => setStep(2)}
                className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-mid"
              >
                Далее →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-mid disabled:opacity-60"
              >
                {isLoading ? "Отправляем..." : "Подать заявку"}
              </button>
            )}
          </div>
        }
      >
        {step === 1 ? (
          <div className="grid gap-3 md:grid-cols-3">
            {[
              { value: "CARD" as const, title: "Банковская карта", text: "Перевод на карту российского банка" },
              { value: "SBP" as const, title: "СБП", text: "Перевод по номеру телефона" },
              { value: "WALLET" as const, title: "ЮMoney", text: "Перевод на кошелёк" },
            ].map((item) => {
              const active = method === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setMethod(item.value)}
                  className={[
                    "rounded-2xl border p-4 text-left transition-colors",
                    active
                      ? "border-brand bg-brand/10"
                      : "border-dash-border bg-dash-bg hover:border-brand/30",
                  ].join(" ")}
                >
                  <div className="text-sm font-semibold text-dash-heading">{item.title}</div>
                  <div className="mt-2 text-sm text-dash-muted">{item.text}</div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4">
            {method === "CARD" ? (
              <label className="grid gap-2">
                <span className="text-sm font-medium text-dash-heading">Номер карты</span>
                <input
                  value={cardNumber}
                  onChange={(event) => setCardNumber(maskCard(event.target.value))}
                  className="h-12 rounded-xl border border-dash-border bg-dash-bg px-4 text-base text-dash-body outline-none focus:border-brand/40"
                  placeholder="0000 0000 0000 0000"
                />
              </label>
            ) : null}

            {method === "SBP" ? (
              <>
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-dash-heading">Номер телефона</span>
                  <input
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className="h-12 rounded-xl border border-dash-border bg-dash-bg px-4 text-base text-dash-body outline-none focus:border-brand/40"
                    placeholder="+7 999 123-45-67"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-medium text-dash-heading">Банк</span>
                  <select
                    value={bankId}
                    onChange={(event) => setBankId(event.target.value)}
                    className="h-12 rounded-xl border border-dash-border bg-dash-bg px-4 text-base text-dash-body outline-none focus:border-brand/40"
                  >
                    {sbpBanks.map((bank) => (
                      <option key={bank.value} value={bank.value}>{bank.label}</option>
                    ))}
                  </select>
                </label>
              </>
            ) : null}

            {method === "WALLET" ? (
              <label className="grid gap-2">
                <span className="text-sm font-medium text-dash-heading">Номер кошелька</span>
                <input
                  value={walletNumber}
                  onChange={(event) => setWalletNumber(event.target.value)}
                  className="h-12 rounded-xl border border-dash-border bg-dash-bg px-4 text-base text-dash-body outline-none focus:border-brand/40"
                  placeholder="4100..."
                />
              </label>
            ) : null}

            <label className="grid gap-2">
              <span className="text-sm font-medium text-dash-heading">Сумма</span>
              <input
                type="number"
                min={100}
                max={balance}
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="h-12 rounded-xl border border-dash-border bg-dash-bg px-4 text-base text-dash-body outline-none focus:border-brand/40"
              />
            </label>

            {error ? <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-500">{error}</div> : null}
          </div>
        )}
      </Modal>
    </div>
  );
}
