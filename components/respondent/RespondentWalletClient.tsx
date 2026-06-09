"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/dashboard/Modal";
import { createWithdrawalAction } from "@/actions/payments";

type WithdrawalMethod = "CARD" | "SBP" | "WALLET";

type Props = {
  balance: number;
  totalEarned: number;
  totalSpent: number;
  minWithdrawal: number;
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

function formatRub(amount: number) {
  return `${new Intl.NumberFormat("ru-RU").format(amount)} ₽`;
}

function maskCard(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 19);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

function shortId(id: string) {
  const digits = id.replace(/\D/g, "");
  if (digits.length >= 8) return digits.slice(0, 9);
  return id.slice(-9).toUpperCase();
}

type WithdrawalStatus = Props["withdrawalRequests"][number]["status"];

function mapStatus(s: WithdrawalStatus): { label: string; cls: string } {
  if (s === "COMPLETED") return { label: "Платёж направлен", cls: "border border-green-500 bg-green-500/10 text-green-400" };
  if (s === "PROCESSING") return { label: "В работе", cls: "border border-amber-500 bg-amber-500/10 text-amber-400" };
  if (s === "PENDING") return { label: "Ожидание", cls: "border border-amber-500 bg-amber-500/10 text-amber-400" };
  if (s === "REJECTED") return { label: "Отклонено", cls: "border border-red-500 bg-red-500/10 text-red-400" };
  return { label: "Ошибка", cls: "border border-red-500 bg-red-500/10 text-red-400" };
}

function IconEarned() {
  return <img src="/cabinets/respondent/wallet-1.svg" alt="Заработано" className="h-7 w-7" />;
}

function IconAvailable() {
  return <img src="/cabinets/respondent/wallet-2.svg" alt="Доступно сейчас" className="h-7 w-7" />;
}

function IconWithdrawn() {
  return <img src="/cabinets/respondent/wallet-3.svg" alt="Уже выведено" className="h-7 w-7" />;
}

export default function RespondentWalletClient({
  balance,
  totalEarned,
  totalSpent,
  minWithdrawal,
  transactions,
  withdrawalRequests,
}: Props) {
  const router = useRouter();
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [method, setMethod] = useState<WithdrawalMethod>("CARD");
  const [amount, setAmount] = useState(() => String(minWithdrawal));
  const [cardNumber, setCardNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [bankId, setBankId] = useState("");
  const [sbpBanksList, setSbpBanksList] = useState<Array<{ bank_id: string; name: string }>>([]);
  const [sbpBanksHint, setSbpBanksHint] = useState<string | null>(null);
  const [sbpListLoading, setSbpListLoading] = useState(false);
  const [sbpContractForbidden, setSbpContractForbidden] = useState(false);
  const [walletNumber, setWalletNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, startTransition] = useTransition();

  const numericAmount = useMemo(() => Number(amount.replace(/[^\d]/g, "")), [amount]);
  const earningTransactions = transactions.filter((t) => t.amount > 0);

  function clearSbpPrefetchState() {
    setSbpBanksList([]);
    setSbpBanksHint(null);
    setSbpListLoading(false);
    setSbpContractForbidden(false);
    setBankId("");
  }

  function chooseWithdrawMethod(next: WithdrawalMethod) {
    if (method === "SBP" && next !== "SBP") clearSbpPrefetchState();
    setMethod(next);
  }

  useEffect(() => {
    if (!showWithdrawModal || method !== "SBP") return;
    let cancelled = false;
    (async () => {
      setSbpBanksHint(null);
      setSbpContractForbidden(false);
      setSbpListLoading(true);
      const res = await fetch("/api/payments/sbp-banks", { credentials: "include", cache: "no-store" });
      const data = (await res.json().catch(() => ({}))) as {
        banks?: Array<{ bank_id: string; name: string }>;
        error?: string; detail?: string | null; yukassaCode?: string | null;
        sbpAvailability?: string; userMessage?: string; merchantHint?: string; technical?: string;
      };
      if (cancelled) return;
      setSbpListLoading(false);
      if (data.sbpAvailability === "contract_forbidden") {
        setSbpBanksList([]); setBankId(""); setSbpContractForbidden(true);
        setSbpBanksHint(typeof data.userMessage === "string" && data.userMessage.trim() ? data.userMessage.trim() : "Вывод через СБП сейчас недоступен. Выберите карту или ЮMoney.");
        return;
      }
      if (Array.isArray(data.banks) && data.banks.length > 0) {
        setSbpBanksList(data.banks);
        setBankId((prev) => prev && data.banks!.some((b) => b.bank_id === prev) ? prev : data.banks![0].bank_id);
        return;
      }
      setSbpBanksList([]); setBankId("");
      const fallback = data.error === "PAYOUTS_NOT_CONFIGURED"
        ? "Список банков СБП недоступен: не настроены ключи выплат."
        : data.error === "UNAUTHORIZED"
          ? "Сессия недействительна. Обновите страницу."
          : "Не удалось загрузить список банков ЮKassa для СБП.";
      const tail = typeof data.detail === "string" && data.detail.trim() ? ` Технически: ${data.detail.trim()}` : "";
      setSbpBanksHint(`${fallback}${tail}`);
    })();
    return () => { cancelled = true; };
  }, [showWithdrawModal, method]);

  function resetModal() {
    setShowWithdrawModal(false); setStep(1); setMethod("CARD"); setAmount(String(minWithdrawal));
    setCardNumber(""); setPhone(""); clearSbpPrefetchState(); setWalletNumber(""); setError(null);
  }

  function buildRequisites(): Record<string, string> {
    if (method === "CARD") return { cardNumber: cardNumber.replace(/\s/g, "") };
    if (method === "SBP") return { phone, bankId };
    return { walletNumber };
  }

  function handleSubmit() {
    setError(null); setSuccessMessage(null);
    if (numericAmount < minWithdrawal) { setError(`Минимальная сумма вывода — ${formatRub(minWithdrawal)}`); return; }
    if (numericAmount > balance) { setError("Сумма вывода не может превышать текущий баланс"); return; }
    const cardDigits = cardNumber.replace(/\D/g, "");
    if (method === "CARD" && (cardDigits.length < 16 || cardDigits.length > 19)) { setError("Укажите номер карты 16–19 цифр"); return; }
    if (method === "SBP" && phone.trim().length < 10) { setError("Введите номер телефона для СБП"); return; }
    if (method === "SBP" && sbpContractForbidden) { setError("СБП для вывода отключён на стороне ЮKassa. Выберите карту или ЮMoney."); return; }
    if (method === "SBP" && !bankId) { setError("Выберите банк из списка"); return; }
    const walletDigits = walletNumber.replace(/\D/g, "");
    if (method === "WALLET" && (walletDigits.length < 11 || walletDigits.length > 33)) { setError("Номер кошелька ЮMoney — от 11 до 33 цифр"); return; }
    startTransition(async () => {
      const result = await createWithdrawalAction({ amount: numericAmount, method, requisites: buildRequisites() });
      if (result.error) { setError(result.error); return; }
      resetModal();
      setSuccessMessage("Заявка на вывод создана. Статус выплаты обновится автоматически.");
      router.refresh();
    });
  }

  const inputCls = "h-12 w-full rounded-xl border border-dash-border bg-dash-bg px-4 text-[14px] text-dash-body outline-none focus:border-[#6D3AE2]/50 focus:ring-2 focus:ring-[#6D3AE2]/10 transition-colors";

  const statCards = [
    { label: "Заработано",      value: formatRub(totalEarned), icon: <IconEarned /> },
    { label: "Доступно сейчас", value: formatRub(balance),     icon: <IconAvailable /> },
    { label: "Уже выведено",    value: formatRub(totalSpent),  icon: <IconWithdrawn /> },
  ];

  return (
    <div className="space-y-5">
      {successMessage && (
        <div className="rounded-[14px] border border-green-500/20 bg-green-500/10 p-4 text-[13px] font-medium text-green-400">
          {successMessage}
        </div>
      )}

      {/* ── TOP ROW: баланс + 3 стат-карточки ── */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">

        {/* Карточка баланса — col-span-2 на мобайле, 1 на xl */}
        <div className="col-span-2 xl:col-span-1 flex flex-col justify-between rounded-[18px] border border-dash-border bg-dash-card p-5 min-h-[160px]">
          <p className="text-[26px] font-bold leading-none text-[#7244F5] tabular-nums break-all">
            {formatRub(balance)}
          </p>
          <p className="mt-1 text-[13px] font-medium text-dash-muted">Доступный баланс</p>
          <p className="mt-3 text-[12px] leading-[1.5] text-dash-muted">
            Минимальная сумма вывода — {formatRub(minWithdrawal)}
          </p>
          <button
            type="button"
            onClick={() => setShowWithdrawModal(true)}
            disabled={balance < minWithdrawal}
            className="mt-4 w-full rounded-[10px] bg-[#7244F5] py-2.5 text-[13px] font-semibold text-white transition-all hover:bg-[#6238DC] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Вывести средства
          </button>
        </div>

        {/* 3 стат-карточки */}
        {statCards.map((card) => (
          <div key={card.label} className="flex flex-col justify-between rounded-[18px] border border-dash-border bg-dash-card p-5 min-h-[160px]">
            {/* Иконка вверху */}
            <div className="flex h-[42px] w-[42px] items-center justify-center rounded-[11px] bg-[#EEE8FF] dark:bg-[#6D3AE2]/20">
              {card.icon}
            </div>
            {/* Число и подпись — внизу слева */}
            <div>
              <p className="text-[28px] xl:text-[32px] font-bold leading-none text-dash-heading tabular-nums break-all">
                {card.value}
              </p>
              <p className="mt-1.5 text-[14px] text-dash-muted">
                {card.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── BOTTOM ROW: таблицы ── */}
      <div className="grid gap-4 lg:grid-cols-2">

        {/* Заявки на вывод */}
        <div className="rounded-[18px] border border-dash-border bg-dash-card">
          <div className="border-b border-dash-border px-4 py-4 sm:px-6">
            <div className="flex items-center gap-2">
              <h2 className="text-[16px] font-semibold text-dash-heading sm:text-[17px]">Заявки на вывод</h2>
              {withdrawalRequests.length > 0 && (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-dash-bg text-[12px] font-semibold text-dash-muted">
                  {withdrawalRequests.length}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-[12px] text-dash-muted sm:text-[13px]">Статус всех заявок на вывод средств.</p>
          </div>
          {withdrawalRequests.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-left">
                <thead>
                  <tr className="border-b border-dash-border bg-dash-bg/40">
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-dash-muted sm:px-5">Заявка №</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-dash-muted sm:px-5">Дата</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-dash-muted sm:px-5">Сумма</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-dash-muted sm:px-5">Статус</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dash-border">
                  {withdrawalRequests.map((req) => {
                    const st = mapStatus(req.status);
                    return (
                      <tr key={req.id} className="transition-colors hover:bg-dash-bg/30">
                        <td className="px-4 py-3 text-[12px] font-medium text-dash-body sm:px-5 sm:py-4 sm:text-[13px]">{shortId(req.id)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-[12px] text-dash-body sm:px-5 sm:py-4 sm:text-[13px]">{req.date}</td>
                        <td className="px-4 py-3 text-[13px] font-semibold tabular-nums text-dash-body sm:px-5 sm:py-4 sm:text-[14px]">{formatRub(req.amount)}</td>
                        <td className="px-4 py-3 sm:px-5 sm:py-4">
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold sm:px-3 sm:py-1 sm:text-[12px] ${st.cls}`}>
                            {st.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex min-h-32 items-center justify-center p-6 text-center">
              <p className="text-[13px] text-dash-muted">
                Пока заявок нет. Когда вы отправите первую заявку, она появится здесь.
              </p>
            </div>
          )}
        </div>

        {/* История начислений */}
        <div className="rounded-[18px] border border-dash-border bg-dash-card">
          <div className="border-b border-dash-border px-4 py-4 sm:px-6">
            <div className="flex items-center gap-2">
              <h2 className="text-[16px] font-semibold text-dash-heading sm:text-[17px]">История начислений</h2>
              {earningTransactions.length > 0 && (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-dash-bg text-[12px] font-semibold text-dash-muted">
                  {earningTransactions.length}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-[12px] text-dash-muted sm:text-[13px]">
              Все вознаграждения за успешно пройденные опросы.
            </p>
          </div>
          {earningTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[360px] text-left">
                <thead>
                  <tr className="border-b border-dash-border bg-dash-bg/40">
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-dash-muted sm:px-5">Опрос</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-dash-muted sm:px-5">Дата</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-dash-muted sm:px-5">Сумма</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dash-border">
                  {earningTransactions.map((item) => (
                    <tr key={item.id} className="transition-colors hover:bg-dash-bg/30">
                      <td className="max-w-36 truncate px-4 py-3 text-[12px] text-dash-body sm:max-w-[180px] sm:px-5 sm:py-4 sm:text-[13px]">{item.description}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-[12px] text-dash-body sm:px-5 sm:py-4 sm:text-[13px]">{item.date}</td>
                      <td className="px-4 py-3 text-[13px] font-semibold tabular-nums text-green-500 dark:text-green-400 sm:px-5 sm:py-4 sm:text-[14px]">
                        +{formatRub(Math.abs(item.amount))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex min-h-32 items-center justify-center p-6 text-center">
              <p className="text-[13px] text-dash-muted">
                Начислений пока нет. После первых завершённых опросов здесь появится история.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── МОДАЛКА ВЫВОДА ── */}
      <Modal
        open={showWithdrawModal}
        title="Вывод средств"
        onClose={() => { if (!isLoading) resetModal(); }}
        footer={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-[13px] text-dash-muted">Минимальная сумма — {formatRub(minWithdrawal)}</div>
            {step === 1 ? (
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={method === "SBP" && (sbpListLoading || sbpContractForbidden)}
                className="rounded-xl bg-[#6D3AE2] px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-[#7B4FF0] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Далее →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="rounded-xl bg-[#6D3AE2] px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-[#7B4FF0] disabled:opacity-60"
              >
                {isLoading ? "Отправляем..." : "Подать заявку"}
              </button>
            )}
          </div>
        }
      >
        {step === 1 ? (
          <div className="grid gap-3">
            <div className="grid gap-3 md:grid-cols-3">
              {[
                { value: "CARD" as const,   title: "Банковская карта", text: "Перевод на карту" },
                { value: "SBP" as const,    title: "СБП",              text: "По номеру телефона" },
                { value: "WALLET" as const, title: "ЮMoney",           text: "Перевод на кошелёк" },
              ].map((item) => {
                const active = method === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => chooseWithdrawMethod(item.value)}
                    className={[
                      "rounded-[14px] border p-4 text-left transition-colors",
                      active ? "border-[#6D3AE2] bg-[#6D3AE2]/10" : "border-dash-border bg-dash-bg hover:border-[#6D3AE2]/30",
                    ].join(" ")}
                  >
                    <div className="text-[13px] font-semibold text-dash-heading">{item.title}</div>
                    <div className="mt-1 text-[12px] text-dash-muted">{item.text}</div>
                  </button>
                );
              })}
            </div>
            {method === "SBP" && (
              <div className={[
                "rounded-xl border px-4 py-3 text-[13px]",
                sbpContractForbidden || (sbpBanksHint && !sbpListLoading)
                  ? "border-amber-500/25 bg-amber-500/10 text-amber-200"
                  : "border-dash-border bg-dash-bg text-dash-muted",
              ].join(" ")}>
                {sbpBanksHint
                  ? sbpBanksHint
                  : sbpListLoading
                    ? "Проверяем доступность СБП…"
                    : sbpBanksList.length > 0
                      ? `Список банков получен (${sbpBanksList.length}). Перейдите далее.`
                      : "Не удалось получить банки. Выберите другой способ."}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {method === "CARD" && (
              <label className="grid gap-2">
                <span className="text-[13px] font-medium text-dash-heading">Номер карты</span>
                <input value={cardNumber} onChange={(e) => setCardNumber(maskCard(e.target.value))} className={inputCls} placeholder="0000 0000 0000 0000" />
              </label>
            )}
            {method === "SBP" && (
              <>
                <label className="grid gap-2">
                  <span className="text-[13px] font-medium text-dash-heading">Номер телефона</span>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} placeholder="+7 999 123-45-67" />
                </label>
                <label className="grid gap-2">
                  <span className="text-[13px] font-medium text-dash-heading">Банк (участник СБП)</span>
                  {sbpBanksHint && (
                    <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-[13px] text-amber-200">
                      {sbpBanksHint}
                    </div>
                  )}
                  {sbpBanksList.length > 0 && (
                    <select value={bankId} onChange={(e) => setBankId(e.target.value)} className={inputCls}>
                      {sbpBanksList.map((b) => <option key={b.bank_id} value={b.bank_id}>{b.name}</option>)}
                    </select>
                  )}
                  {!sbpContractForbidden && sbpBanksList.length === 0 && (
                    <div className="rounded-xl border border-dash-border bg-dash-bg px-4 py-3 text-[13px] text-dash-muted">
                      {sbpListLoading ? "Загружаем список банков…" : "Не удалось показать банки."}
                    </div>
                  )}
                </label>
              </>
            )}
            {method === "WALLET" && (
              <label className="grid gap-2">
                <span className="text-[13px] font-medium text-dash-heading">Номер кошелька</span>
                <input value={walletNumber} onChange={(e) => setWalletNumber(e.target.value)} className={inputCls} placeholder="11–33 цифр номера ЮMoney…" />
              </label>
            )}
            <label className="grid gap-2">
              <span className="text-[13px] font-medium text-dash-heading">Сумма</span>
              <input type="number" min={minWithdrawal} max={balance} value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} />
            </label>
            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-[13px] text-red-400">
                {error}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}