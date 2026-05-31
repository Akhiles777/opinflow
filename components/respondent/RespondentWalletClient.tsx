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

const S = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.75", strokeLinecap: "round" as const, strokeLinejoin: "round" as const, width: 20, height: 20 };

function IconEarned() {
  return (
    <svg {...S}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2" />
    </svg>
  );
}
function IconAvailable() {
  return (
    <svg {...S}>
      <rect x="2" y="6" width="20" height="13" rx="3" />
      <path d="M2 10h20M6 15h4" />
    </svg>
  );
}
function IconWithdrawn() {
  return (
    <svg {...S}>
      <path d="M4 7h16a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 20 19H4a1.5 1.5 0 0 1-1.5-1.5V8A1.5 1.5 0 0 1 4 7Z" />
      <path d="M4 7V5.5A2.5 2.5 0 0 1 6.5 3H17" />
      <path d="M16 13h2" />
      <circle cx="16.5" cy="13" r=".6" fill="currentColor" stroke="none" />
      <path d="M12 10.5v3M10.5 12l1.5 1.5 1.5-1.5" />
    </svg>
  );
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
  const [amount, setAmount] = useState("500");
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
  const earningTransactions = transactions.filter((t) => t.type === "Начисление");

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
      const fallback = data.error === "PAYOUTS_NOT_CONFIGURED" ? "Список банков СБП недоступен: не настроены ключи выплат." : data.error === "UNAUTHORIZED" ? "Сессия недействительна. Обновите страницу." : "Не удалось загрузить список банков ЮKassa для СБП.";
      const tail = typeof data.detail === "string" && data.detail.trim() ? ` Технически: ${data.detail.trim()}` : "";
      setSbpBanksHint(`${fallback}${tail}`);
    })();
    return () => { cancelled = true; };
  }, [showWithdrawModal, method]);

  function resetModal() {
    setShowWithdrawModal(false); setStep(1); setMethod("CARD"); setAmount("500");
    setCardNumber(""); setPhone(""); clearSbpPrefetchState(); setWalletNumber(""); setError(null);
  }

  function buildRequisites(): Record<string, string> {
    if (method === "CARD") return { cardNumber: cardNumber.replace(/\s/g, "") };
    if (method === "SBP") return { phone, bankId };
    return { walletNumber };
  }

  function handleSubmit() {
    setError(null); setSuccessMessage(null);
    if (numericAmount < 500) { setError("Минимальная сумма вывода — 500 ₽"); return; }
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

  return (
    <div className="space-y-5">
      {successMessage && (
        <div className="rounded-[14px] border border-green-500/20 bg-green-500/10 p-4 text-[13px] font-medium text-green-400">
          {successMessage}
        </div>
      )}

      {/* ── TOP ROW: баланс (1fr) + 3 стат-карточки (2fr) ─────────────── */}
      <div className="grid gap-5 lg:grid-cols-[1fr_2fr]">

        {/* Баланс */}
        <div className="rounded-[18px] border border-dash-border bg-dash-card p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[36px] font-bold leading-none text-[#6D3AE2]">{formatRub(balance)}</p>
              <p className="mt-2 text-[13px] font-medium text-dash-muted">Доступный баланс</p>
              <p className="mt-3 max-w-[280px] text-[13px] leading-[1.5] text-dash-muted">
                Вознаграждения за опросы поступают сюда. Отправляйте заявки на вывод и отслеживайте их статус в одном месте. Минимальная сумма вывода — 500&nbsp;₽
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowWithdrawModal(true)}
              disabled={balance < 500}
              className="shrink-0 self-start rounded-xl bg-[#6D3AE2] px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#7B4FF0] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Вывести средства
            </button>
          </div>
        </div>

        {/* 3 стат-карточки */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Заработано", value: totalEarned, icon: <IconEarned /> },
            { label: "Доступно сейчас", value: balance, icon: <IconAvailable /> },
            { label: "Уже выведено", value: totalSpent, icon: <IconWithdrawn /> },
          ].map(({ label, value, icon }) => (
            <div key={label} className="flex flex-col rounded-[18px] border border-dash-border bg-dash-card p-5">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#6D3AE2]/15 text-[#6D3AE2]">
                {icon}
              </div>
              <p className="text-[22px] font-bold leading-none text-dash-heading">{formatRub(value)}</p>
              <p className="mt-1.5 text-[12px] font-medium text-dash-muted">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── BOTTOM ROW: таблицы ──────────────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-2">

        {/* Заявки на вывод */}
        <div className="rounded-[18px] border border-dash-border bg-dash-card p-6">
          <div className="mb-1 flex items-center gap-2">
            <h2 className="text-[16px] font-semibold text-dash-heading">Заявки на вывод</h2>
            <span className="rounded-full bg-dash-border px-2 py-0.5 text-[12px] font-medium text-dash-muted">
              {withdrawalRequests.length}
            </span>
          </div>
          <p className="mb-5 text-[13px] text-dash-muted">Статус всех заявок на вывод средств.</p>

          {withdrawalRequests.length > 0 ? (
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-dash-border">
                  {["ЗАЯВКА №", "ДАТА", "СУММА", "СТАТУС"].map((h) => (
                    <th key={h} className="pb-3 text-left text-[11px] font-semibold uppercase tracking-wider text-dash-muted first:pl-0">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {withdrawalRequests.map((item) => {
                  const { label, cls } = mapStatus(item.status);
                  return (
                    <tr key={item.id} className="border-b border-dash-border/50 last:border-0">
                      <td className="py-3.5 font-mono text-dash-body">{shortId(item.id)}</td>
                      <td className="py-3.5 text-dash-muted">{item.date.slice(0, 8)}</td>
                      <td className="py-3.5 font-medium text-dash-heading">{formatRub(item.amount)}</td>
                      <td className="py-3.5">
                        <span className={`inline-flex rounded px-2 py-0.5 text-[11px] font-semibold ${cls}`}>
                          {label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="py-4 text-[13px] text-dash-muted">
              Пока заявок нет. Когда вы отправите первую заявку, она появится здесь.
            </p>
          )}
        </div>

        {/* История начислений */}
        <div className="rounded-[18px] border border-dash-border bg-dash-card p-6">
          <div className="mb-1 flex items-center gap-2">
            <h2 className="text-[16px] font-semibold text-dash-heading">История начислений</h2>
            <span className="rounded-full bg-dash-border px-2 py-0.5 text-[12px] font-medium text-dash-muted">
              {earningTransactions.length}
            </span>
          </div>
          <p className="mb-5 text-[13px] text-dash-muted">
            Все вознаграждения за успешно пройденные опросы отображаются здесь.
          </p>

          {earningTransactions.length > 0 ? (
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-dash-border">
                  {["ОПРОС", "ДАТА", "СУММА"].map((h) => (
                    <th key={h} className="pb-3 text-left text-[11px] font-semibold uppercase tracking-wider text-dash-muted first:pl-0">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {earningTransactions.map((item) => (
                  <tr key={item.id} className="border-b border-dash-border/50 last:border-0">
                    <td className="max-w-[180px] truncate py-3.5 text-dash-body">{item.description}</td>
                    <td className="py-3.5 text-dash-muted">{item.date.slice(0, 8)}</td>
                    <td className="py-3.5 font-medium text-green-400">+{formatRub(Math.abs(item.amount))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="py-4 text-[13px] text-dash-muted">
              Начислений пока нет. После первых завершённых опросов здесь появится история вознаграждений.
            </p>
          )}
        </div>
      </div>

      {/* ── МОДАЛКА ВЫВОДА ───────────────────────────────────────────────── */}
      <Modal
        open={showWithdrawModal}
        title="Вывод средств"
        onClose={() => { if (!isLoading) resetModal(); }}
        footer={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-[13px] text-dash-muted">Минимальная сумма — 500 ₽</div>
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
                { value: "CARD" as const, title: "Банковская карта", text: "Перевод на карту" },
                { value: "SBP" as const, title: "СБП", text: "По номеру телефона" },
                { value: "WALLET" as const, title: "ЮMoney", text: "Перевод на кошелёк" },
              ].map((item) => {
                const active = method === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => chooseWithdrawMethod(item.value)}
                    className={["rounded-[14px] border p-4 text-left transition-colors", active ? "border-[#6D3AE2] bg-[#6D3AE2]/10" : "border-dash-border bg-dash-bg hover:border-[#6D3AE2]/30"].join(" ")}
                  >
                    <div className="text-[13px] font-semibold text-dash-heading">{item.title}</div>
                    <div className="mt-1 text-[12px] text-dash-muted">{item.text}</div>
                  </button>
                );
              })}
            </div>
            {method === "SBP" && (
              <div className={["rounded-xl border px-4 py-3 text-[13px]", sbpContractForbidden || (sbpBanksHint && !sbpListLoading) ? "border-amber-500/25 bg-amber-500/10 text-amber-200" : "border-dash-border bg-dash-bg text-dash-muted"].join(" ")}>
                {sbpBanksHint ? sbpBanksHint : sbpListLoading ? "Проверяем доступность СБП…" : sbpBanksList.length > 0 ? `Список банков получен (${sbpBanksList.length}). Перейдите далее.` : "Не удалось получить банки. Выберите другой способ."}
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
                  {sbpBanksHint && <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-[13px] text-amber-200">{sbpBanksHint}</div>}
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
              <input type="number" min={500} max={balance} value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} />
            </label>
            {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-[13px] text-red-400">{error}</div>}
          </div>
        )}
      </Modal>
    </div>
  );
}
