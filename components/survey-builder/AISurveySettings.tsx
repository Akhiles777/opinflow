"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSurveyAction } from "@/actions/surveys";
import { EMPTY_DRAFT } from "@/types/survey";
import type { Question } from "@/types/survey";
import AIWizardProgress from "@/components/survey-builder/AIWizardProgress";

const CATEGORIES = ["Маркетинг", "Продукт", "Потребительские", "HR", "UX", "Другое"];
const MIN_RESPONSES = 20;

type Props = {
  title: string;
  questions: Question[];
  balance: number;
  commissionRate: number;
  minReward: number;
  onBack: () => void;
};

function todayStr() {
  return new Date().toISOString().split("T")[0];
}
function plusDaysStr(days: number) {
  return new Date(Date.now() + days * 86_400_000).toISOString().split("T")[0];
}

export default function AISurveySettings({ title, questions, balance, commissionRate, minReward, onBack }: Props) {
  const router = useRouter();
  const today = todayStr();

  const [surveyTitle, setSurveyTitle] = useState(title.trim() || "");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [maxResponses, setMaxResponses] = useState(50);
  const [reward, setReward] = useState(Math.max(minReward, 50));
  const [startsAt, setStartsAt] = useState(today);
  const [endsAt, setEndsAt] = useState(plusDaysStr(7));
  const [questionsOpen, setQuestionsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const base = maxResponses * reward;
  const fee = Math.round(base * commissionRate);
  const total = base + fee;
  const hasEnough = balance >= total;

  function handleResponsesInput(raw: string) {
    const n = parseInt(raw, 10);
    if (!isNaN(n)) setMaxResponses(n);
  }
  function handleResponsesBlur() {
    setMaxResponses((v) => Math.max(MIN_RESPONSES, v));
  }
  function handleRewardInput(raw: string) {
    const n = parseInt(raw, 10);
    if (!isNaN(n)) setReward(n);
  }
  function handleRewardBlur() {
    setReward((v) => Math.max(minReward, v));
  }

  function validate(): string | null {
    if (surveyTitle.trim().length < 5) return "Название должно содержать минимум 5 символов";
    if (!category) return "Выберите категорию";
    if (questions.length < 1) return "Нет вопросов";
    if (maxResponses < MIN_RESPONSES) return `Минимум ${MIN_RESPONSES} респондентов`;
    if (reward < minReward) return `Минимальное вознаграждение — ${minReward} ₽`;
    if (!endsAt) return "Укажите дату окончания";
    if (endsAt < startsAt) return "Дата окончания должна быть позже даты начала";
    if (!hasEnough) return `Недостаточно средств. Нужно ${total.toLocaleString("ru")} ₽, на балансе ${balance.toLocaleString("ru")} ₽`;
    return null;
  }

  function handlePublish() {
    const err = validate();
    if (err) { setError(err); return; }
    setError(null);

    startTransition(async () => {
      const result = await createSurveyAction({
        ...EMPTY_DRAFT,
        title: surveyTitle.trim(),
        description,
        category,
        questions,
        maxResponses,
        reward,
        startsAt,
        endsAt,
      });
      if (result?.error) {
        setError(result.error);
      } else {
        router.push("/client/surveys");
        router.refresh();
      }
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Progress */}
      <AIWizardProgress step={3} />

      {/* Back */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-site-muted hover:text-site-heading"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
        Назад к вопросам
      </button>

      {/* Questions summary */}
      <div className="rounded-2xl border border-site-border bg-site-section">
        <button
          type="button"
          onClick={() => setQuestionsOpen((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-site-heading"
        >
          <span>Вопросы опроса ({questions.length})</span>
          <svg
            className={`h-4 w-4 text-site-muted transition-transform ${questionsOpen ? "rotate-180" : ""}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        {questionsOpen && (
          <ol className="divide-y divide-site-border border-t border-site-border">
            {questions.map((q, i) => (
              <li key={q.id} className="px-4 py-2.5 text-sm text-site-body">
                <span className="mr-2 text-xs font-semibold text-site-muted">{i + 1}.</span>
                {q.title}
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Title */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-site-heading">
          Название опроса <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={surveyTitle}
          onChange={(e) => setSurveyTitle(e.target.value)}
          placeholder="Например: Оценка нового мобильного банка"
          className="w-full rounded-xl border border-site-border bg-site-section px-4 py-3 text-sm text-site-heading placeholder:text-site-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
      </div>

      {/* Category */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-site-heading">
          Категория <span className="text-red-500">*</span>
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-xl border border-site-border bg-site-section px-4 py-3 text-sm text-site-body focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        >
          <option value="">— Выберите категорию —</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-site-heading">
          Описание{" "}
          <span className="text-xs font-normal text-site-muted">(необязательно)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Коротко опишите цель исследования"
          rows={3}
          className="w-full resize-none rounded-xl border border-site-border bg-site-section px-4 py-3 text-sm text-site-body placeholder:text-site-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
      </div>

      {/* Budget */}
      <div className="space-y-4 rounded-2xl border border-site-border p-5">
        <p className="text-sm font-semibold text-site-heading">Бюджет</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-site-muted">
              Кол-во респондентов (мин. {MIN_RESPONSES})
            </label>
            <input
              type="number"
              min={MIN_RESPONSES}
              step={10}
              value={maxResponses}
              onChange={(e) => handleResponsesInput(e.target.value)}
              onBlur={handleResponsesBlur}
              className="w-full rounded-xl border border-site-border bg-site-section px-4 py-2.5 text-sm text-site-body focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-site-muted">
              Вознаграждение за ответ (мин. {minReward} ₽)
            </label>
            <div className="relative">
              <input
                type="number"
                min={minReward}
                step={10}
                value={reward}
                onChange={(e) => handleRewardInput(e.target.value)}
                onBlur={handleRewardBlur}
                className="w-full rounded-xl border border-site-border bg-site-section px-4 py-2.5 pr-8 text-sm text-site-body focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-site-muted">₽</span>
            </div>
          </div>
        </div>

        {/* Budget breakdown */}
        <div className={`rounded-xl px-4 py-3 text-sm ${hasEnough ? "bg-green-50 dark:bg-green-950/30" : "bg-red-50 dark:bg-red-950/30"}`}>
          <div className={`space-y-1 ${hasEnough ? "text-green-800 dark:text-green-200" : "text-red-800 dark:text-red-200"}`}>
            <div className="flex justify-between">
              <span>Выплаты ({maxResponses} × {reward} ₽)</span>
              <span>{base.toLocaleString("ru")} ₽</span>
            </div>
            <div className="flex justify-between">
              <span>Комиссия платформы ({Math.round(commissionRate * 100)}%)</span>
              <span>{fee.toLocaleString("ru")} ₽</span>
            </div>
            <div className="flex justify-between border-t border-current/20 pt-1.5 font-semibold">
              <span>Итого к списанию</span>
              <span>{total.toLocaleString("ru")} ₽</span>
            </div>
            <div className="flex justify-between pt-0.5 text-xs opacity-70">
              <span>Баланс после оплаты</span>
              <span className={balance - total < 0 ? "text-red-600 font-medium" : ""}>
                {(balance - total).toLocaleString("ru")} ₽
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-site-heading">Дата начала</label>
          <input
            type="date"
            min={today}
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className="w-full rounded-xl border border-site-border bg-site-section px-4 py-3 text-sm text-site-body focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-site-heading">
            Дата окончания <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            min={startsAt || today}
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            className="w-full rounded-xl border border-site-border bg-site-section px-4 py-3 text-sm text-site-body focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Publish CTA */}
      <button
        type="button"
        onClick={handlePublish}
        disabled={isPending}
        className="w-full rounded-xl bg-brand py-3.5 text-sm font-semibold text-white shadow-[0_6px_18px_rgba(114,68,245,0.35)] hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending
          ? "Публикуем опрос…"
          : `Опубликовать опрос · ${total.toLocaleString("ru")} ₽`}
      </button>
    </div>
  );
}

