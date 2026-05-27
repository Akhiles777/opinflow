"use client";

import Link from "next/link";
import { useState } from "react";
import type { SurveyDraft } from "@/types/survey";

type Props = {
  draft: SurveyDraft;
  balance: number;
  commissionRate: number;
  onChange: (patch: Partial<SurveyDraft>) => void;
};

const MIN_RESPONSES = 20;
const MIN_REWARD    = 50;

export default function StepBudget({ draft, balance, commissionRate, onChange }: Props) {
  const [responsesInput, setResponsesInput] = useState(String(draft.maxResponses));
  const [rewardInput,    setRewardInput]    = useState(String(draft.reward));

  const total      = draft.maxResponses * draft.reward;
  const commission = total * commissionRate;
  const budget     = total + commission;
  const hasEnough  = balance >= budget;
  const today      = new Date().toISOString().split("T")[0];

  const responsesError = draft.maxResponses < MIN_RESPONSES
    ? `Минимальное количество респондентов — ${MIN_RESPONSES}`
    : null;

  const rewardError = draft.reward < MIN_REWARD
    ? `Минимальное вознаграждение — ${MIN_REWARD} ₽`
    : null;

  function handleResponsesChange(raw: string) {
    setResponsesInput(raw);
    const num = parseInt(raw, 10);
    if (!isNaN(num) && num > 0) {
      onChange({ maxResponses: num });
    }
  }

  function handleResponsesBlur() {
    const num = parseInt(responsesInput, 10);
    const clamped = isNaN(num) || num < MIN_RESPONSES ? MIN_RESPONSES : num;
    setResponsesInput(String(clamped));
    onChange({ maxResponses: clamped });
  }

  function handleRewardChange(raw: string) {
    setRewardInput(raw);
    const num = parseInt(raw, 10);
    if (!isNaN(num) && num > 0) {
      onChange({ reward: num });
    }
  }

  function handleRewardBlur() {
    const num = parseInt(rewardInput, 10);
    const clamped = isNaN(num) || num < MIN_REWARD ? MIN_REWARD : num;
    setRewardInput(String(clamped));
    onChange({ reward: clamped });
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
      <div className="grid gap-5">

        {/* Количество респондентов */}
        <div className="rounded-2xl border border-dash-border bg-dash-card p-5">
          <div className="text-sm font-medium text-dash-muted">Количество респондентов</div>
          <p className="mt-0.5 text-xs text-dash-muted/70">Минимум {MIN_RESPONSES} человек</p>
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                const next = Math.max(MIN_RESPONSES, draft.maxResponses - 10);
                setResponsesInput(String(next));
                onChange({ maxResponses: next });
              }}
              className="rounded-xl border border-dash-border bg-dash-bg px-4 py-3 text-lg font-semibold text-dash-heading transition-colors hover:border-brand/30 hover:text-brand"
            >
              −10
            </button>
            <input
              type="number"
              min={MIN_RESPONSES}
              step={10}
              value={responsesInput}
              onChange={(e) => handleResponsesChange(e.target.value)}
              onBlur={handleResponsesBlur}
              className={`h-12 flex-1 rounded-xl border bg-dash-bg px-4 text-base text-dash-body outline-none transition-colors focus:border-brand/40 ${
                responsesError ? "border-red-400" : "border-dash-border"
              }`}
            />
            <button
              type="button"
              onClick={() => {
                const next = draft.maxResponses + 10;
                setResponsesInput(String(next));
                onChange({ maxResponses: next });
              }}
              className="rounded-xl border border-dash-border bg-dash-bg px-4 py-3 text-lg font-semibold text-dash-heading transition-colors hover:border-brand/30 hover:text-brand"
            >
              +10
            </button>
          </div>
          {responsesError && (
            <p className="mt-2 text-xs font-medium text-red-500">{responsesError}</p>
          )}
        </div>

        {/* Вознаграждение */}
        <div className="rounded-2xl border border-dash-border bg-dash-card p-5">
          <label className="block text-sm font-medium text-dash-muted">
            Вознаграждение за одного
          </label>
          <p className="mt-0.5 text-xs text-dash-muted/70">Минимум {MIN_REWARD} ₽</p>
          <div className="relative mt-3">
            <input
              type="number"
              min={MIN_REWARD}
              value={rewardInput}
              onChange={(e) => handleRewardChange(e.target.value)}
              onBlur={handleRewardBlur}
              className={`h-12 w-full rounded-xl border bg-dash-bg px-4 pr-12 text-base text-dash-body outline-none transition-colors focus:border-brand/40 ${
                rewardError ? "border-red-400" : "border-dash-border"
              }`}
            />
            <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-dash-muted">₽</span>
          </div>
          {rewardError && (
            <p className="mt-2 text-xs font-medium text-red-500">{rewardError}</p>
          )}
        </div>

        {/* Даты */}
        <div className="grid gap-5 md:grid-cols-2">
          <label className="grid gap-2 rounded-2xl border border-dash-border bg-dash-card p-5">
            <span className="text-sm font-medium text-dash-muted">Дата начала</span>
            <input
              type="date"
              min={today}
              value={draft.startsAt}
              onChange={(e) => onChange({ startsAt: e.target.value })}
              className="h-12 rounded-xl border border-dash-border bg-dash-bg px-4 text-base text-dash-body outline-none focus:border-brand/40"
            />
          </label>
          <label className="grid gap-2 rounded-2xl border border-dash-border bg-dash-card p-5">
            <span className="text-sm font-medium text-dash-muted">Дата окончания</span>
            <input
              type="date"
              min={draft.startsAt || today}
              value={draft.endsAt}
              onChange={(e) => onChange({ endsAt: e.target.value })}
              className="h-12 rounded-xl border border-dash-border bg-dash-bg px-4 text-base text-dash-body outline-none focus:border-brand/40"
            />
          </label>
        </div>
      </div>

      {/* Итог бюджета */}
      <aside className="h-fit rounded-2xl border border-white/8 bg-surface-900 p-6 text-white xl:sticky xl:top-6">
        <div className="text-sm uppercase tracking-[0.22em] text-white/35">Итог бюджета</div>
        <div className="mt-6 grid gap-3 text-sm text-white/60">
          <div className="flex justify-between gap-4">
            <span>{draft.maxResponses} × {draft.reward} ₽</span>
            <span>{total.toLocaleString("ru-RU")} ₽</span>
          </div>
          <div className="flex justify-between gap-4 text-white/40">
            <span>Комиссия платформы ({commissionRate * 100}%)</span>
            <span>{commission.toLocaleString("ru-RU")} ₽</span>
          </div>
          <div className="my-2 border-t border-white/10" />
          <div className="flex justify-between gap-4 font-display text-2xl font-bold text-white">
            <span>Итого</span>
            <span>{budget.toLocaleString("ru-RU")} ₽</span>
          </div>
        </div>

        {!hasEnough && (
          <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            <div className="font-semibold">Недостаточно средств. Пополните баланс.</div>
            <Link href="/client/wallet" className="mt-3 inline-flex text-sm font-semibold text-red-200 transition-colors hover:text-white">
              Пополнить →
            </Link>
          </div>
        )}

        <div className="mt-6 text-sm text-white/40">
          Баланс кошелька: {balance.toLocaleString("ru-RU")} ₽
        </div>
      </aside>
    </div>
  );
}
