"use client";

import Link from "next/link";
import type { SurveyDraft } from "@/types/survey";

type Props = {
  draft: SurveyDraft;
  balance: number;
  onChange: (patch: Partial<SurveyDraft>) => void;
};

export default function StepBudget({ draft, balance, onChange }: Props) {
  const total = draft.maxResponses * draft.reward;
  const commission = total * 0.15;
  const budget = total + commission;
  const hasEnough = balance >= budget;
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
      <div className="grid gap-5">
        <div className="rounded-2xl border border-dash-border bg-dash-card p-5">
          <div className="text-sm font-medium text-dash-muted">Количество респондентов</div>
          <div className="mt-4 flex items-center gap-3">
            <button type="button" onClick={() => onChange({ maxResponses: Math.max(10, draft.maxResponses - 10) })} className="rounded-xl border border-dash-border bg-dash-bg px-4 py-3 text-lg font-semibold text-dash-heading transition-colors hover:border-brand/30 hover:text-brand">
              -10
            </button>
            <input
              type="number"
              min={10}
              step={10}
              value={draft.maxResponses}
              onChange={(event) => onChange({ maxResponses: Math.max(10, Number(event.target.value) || 10) })}
              className="h-12 flex-1 rounded-xl border border-dash-border bg-dash-bg px-4 text-base text-dash-body outline-none focus:border-brand/40"
            />
            <button type="button" onClick={() => onChange({ maxResponses: draft.maxResponses + 10 })} className="rounded-xl border border-dash-border bg-dash-bg px-4 py-3 text-lg font-semibold text-dash-heading transition-colors hover:border-brand/30 hover:text-brand">
              +10
            </button>
          </div>
        </div>

        <label className="grid gap-2 rounded-2xl border border-dash-border bg-dash-card p-5">
          <span className="text-sm font-medium text-dash-muted">Вознаграждение за одного</span>
          <div className="relative">
            <input
              type="number"
              min={20}
              value={draft.reward}
              onChange={(event) => onChange({ reward: Math.max(20, Number(event.target.value) || 20) })}
              className="h-12 w-full rounded-xl border border-dash-border bg-dash-bg px-4 pr-12 text-base text-dash-body outline-none focus:border-brand/40"
            />
            <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-dash-muted">₽</span>
          </div>
        </label>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="grid gap-2 rounded-2xl border border-dash-border bg-dash-card p-5">
            <span className="text-sm font-medium text-dash-muted">Дата начала</span>
            <input
              type="date"
              min={today}
              value={draft.startsAt}
              onChange={(event) => onChange({ startsAt: event.target.value })}
              className="h-12 rounded-xl border border-dash-border bg-dash-bg px-4 text-base text-dash-body outline-none focus:border-brand/40"
            />
          </label>
          <label className="grid gap-2 rounded-2xl border border-dash-border bg-dash-card p-5">
            <span className="text-sm font-medium text-dash-muted">Дата окончания</span>
            <input
              type="date"
              min={draft.startsAt || today}
              value={draft.endsAt}
              onChange={(event) => onChange({ endsAt: event.target.value })}
              className="h-12 rounded-xl border border-dash-border bg-dash-bg px-4 text-base text-dash-body outline-none focus:border-brand/40"
            />
          </label>
        </div>
      </div>

      <aside className="h-fit rounded-2xl border border-white/8 bg-surface-900 p-6 text-white xl:sticky xl:top-6">
        <div className="text-sm uppercase tracking-[0.22em] text-white/35">Итог бюджета</div>
        <div className="mt-6 grid gap-3 text-sm text-white/60">
          <div className="flex justify-between gap-4">
            <span>{draft.maxResponses} × {draft.reward} ₽</span>
            <span>{total.toLocaleString("ru-RU")} ₽</span>
          </div>
          <div className="flex justify-between gap-4 text-white/40">
            <span>Комиссия платформы (15%)</span>
            <span>{commission.toLocaleString("ru-RU")} ₽</span>
          </div>
          <div className="my-2 border-t border-white/10" />
          <div className="flex justify-between gap-4 font-display text-2xl font-bold text-white">
            <span>Итого</span>
            <span>{budget.toLocaleString("ru-RU")} ₽</span>
          </div>
        </div>

        {!hasEnough ? (
          <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            <div className="font-semibold">Недостаточно средств. Пополните баланс.</div>
            <Link href="/client/wallet" className="mt-3 inline-flex text-sm font-semibold text-red-200 transition-colors hover:text-white">
              Пополнить →
            </Link>
          </div>
        ) : null}

        <div className="mt-6 text-sm text-white/40">Баланс кошелька: {balance.toLocaleString("ru-RU")} ₽</div>
      </aside>
    </div>
  );
}
