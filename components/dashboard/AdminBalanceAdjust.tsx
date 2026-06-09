"use client";

import { useState, useTransition } from "react";
import { Wallet, CheckCircle } from "lucide-react";
import { adminAdjustBalanceAction } from "@/actions/admin-settings";

type Props = {
  userId: string;
  currentBalance: number;
  userName: string;
};

export default function AdminBalanceAdjust({ userId, currentBalance, userName }: Props) {
  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState<"credit" | "debit">("credit");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    setError(null);
    setSuccess(false);

    const parsed = parseFloat(amount.replace(",", "."));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError("Введите корректную сумму");
      return;
    }

    startTransition(async () => {
      const res = await adminAdjustBalanceAction({ userId, amount: parsed, direction, note });
      if (res.error) { setError(res.error); return; }
      setSuccess(true);
      setAmount("");
      setNote("");
      setTimeout(() => setSuccess(false), 3000);
    });
  }

  const inputCls =
    "h-10 w-full rounded-xl border border-dash-border bg-dash-bg px-4 text-sm text-dash-body placeholder:text-dash-muted focus:outline-none focus:ring-2 focus:ring-brand/20";

  return (
    <div className="mt-6 rounded-2xl border border-dash-border bg-dash-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <Wallet className="h-5 w-5 text-brand" />
        <p className="text-[15px] font-semibold text-dash-heading">Корректировка баланса</p>
      </div>
      <p className="mb-4 text-sm text-dash-muted">
        Текущий баланс <span className="font-semibold text-dash-heading">{userName}</span>:{" "}
        <span className="font-semibold text-dash-heading">
          {currentBalance.toLocaleString("ru-RU")} ₽
        </span>
      </p>

      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
        {/* Direction toggle */}
        <div className="flex gap-1 rounded-xl border border-dash-border bg-dash-bg p-1 w-fit">
          {(["credit", "debit"] as const).map((dir) => (
            <button
              key={dir}
              type="button"
              onClick={() => setDirection(dir)}
              className={[
                "rounded-[10px] px-4 py-1.5 text-[13px] font-semibold transition-colors",
                direction === dir
                  ? dir === "credit"
                    ? "bg-emerald-500 text-white"
                    : "bg-red-500 text-white"
                  : "text-dash-muted hover:text-dash-heading",
              ].join(" ")}
            >
              {dir === "credit" ? "Пополнить" : "Списать"}
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm text-dash-muted">Сумма (₽)</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className={`mt-1 ${inputCls}`}
              required
            />
          </label>
          <label className="block">
            <span className="text-sm text-dash-muted">Причина / комментарий</span>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Например: бонус за активность"
              className={`mt-1 ${inputCls}`}
              required
            />
          </label>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
        {success && (
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <CheckCircle className="h-4 w-4 shrink-0" />
            Баланс успешно скорректирован
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className={[
            "rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50",
            direction === "credit"
              ? "bg-emerald-500 hover:bg-emerald-600"
              : "bg-red-500 hover:bg-red-600",
          ].join(" ")}
        >
          {isPending
            ? "Применяем..."
            : direction === "credit"
              ? "Пополнить баланс"
              : "Списать с баланса"}
        </button>
      </form>
    </div>
  );
}
