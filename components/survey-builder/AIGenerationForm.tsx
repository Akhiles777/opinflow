"use client";

import { useState, useTransition } from "react";
import { generateSurveyWithAI } from "@/actions/ai-survey-generation";
import type { GeneratedSurveyDraft } from "@/actions/ai-survey-generation";

const PLACEHOLDERS = [
  "Хочу понять, почему клиенты уходят к конкурентам после первой покупки",
  "Нужно оценить удовлетворённость сотрудников условиями труда и выяснить основные проблемы",
  "Исследование спроса на доставку готовых блюд в формате подписки среди работающих людей",
];

const INDUSTRIES = [
  { value: "ecommerce", label: "E-commerce / Интернет-магазины" },
  { value: "services", label: "Услуги" },
  { value: "horeca", label: "HoReCa (Рестораны / Отели)" },
  { value: "education", label: "Образование" },
  { value: "healthcare", label: "Здравоохранение" },
  { value: "other", label: "Другое" },
];

type Props = {
  balance: number;
  onSuccess: (draft: GeneratedSurveyDraft) => void;
};

export default function AIGenerationForm({ balance, onSuccess }: Props) {
  const [description, setDescription] = useState("");
  const [industry, setIndustry] = useState("");
  const [audience, setAudience] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [placeholderIdx] = useState(() => Math.floor(Math.random() * PLACEHOLDERS.length));
  const [isPending, startTransition] = useTransition();

  const canSubmit = description.trim().length >= 20 && !isPending;
  const hasEnough = balance >= 50;

  function handleSubmit() {
    if (!canSubmit || !hasEnough) return;
    setError(null);
    startTransition(async () => {
      const result = await generateSurveyWithAI({
        taskDescription: description.trim(),
        industry: industry as "ecommerce" | "services" | "horeca" | "education" | "healthcare" | "other" | undefined || undefined,
        targetAudience: audience.trim() || undefined,
      });
      if (result.success) {
        onSuccess(result.survey);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-2xl border border-brand/20 bg-brand/5 p-4 text-sm text-site-body">
        <p className="font-semibold text-site-heading">Как это работает</p>
        <p className="mt-1 text-site-muted">
          Опишите вашу исследовательскую задачу, и ИИ сгенерирует 8–12 вопросов. Вы сможете
          отредактировать их перед публикацией.
        </p>
      </div>

      {/* Task description */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-site-heading">
          Задача исследования <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={PLACEHOLDERS[placeholderIdx]}
            rows={5}
            maxLength={1000}
            disabled={isPending}
            className="w-full resize-none rounded-xl border border-site-border bg-site-section px-4 py-3 text-sm text-site-body placeholder:text-site-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand disabled:opacity-60"
          />
          <span
            className={`absolute bottom-2 right-3 text-xs ${
              description.length < 20 ? "text-red-400" : "text-site-muted"
            }`}
          >
            {description.length}/1000
          </span>
        </div>
        {description.length > 0 && description.length < 20 && (
          <p className="text-xs text-red-500">Минимум 20 символов</p>
        )}
      </div>

      {/* Industry */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-site-heading">
          Отрасль <span className="text-site-muted">(необязательно)</span>
        </label>
        <select
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          disabled={isPending}
          className="w-full rounded-xl border border-site-border bg-site-section px-4 py-3 text-sm text-site-body focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand disabled:opacity-60"
        >
          <option value="">Не указана</option>
          {INDUSTRIES.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Target audience */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-site-heading">
          Целевая аудитория <span className="text-site-muted">(необязательно)</span>
        </label>
        <input
          type="text"
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          placeholder="Например: женщины 25-45 лет, покупающие онлайн"
          maxLength={200}
          disabled={isPending}
          className="w-full rounded-xl border border-site-border bg-site-section px-4 py-3 text-sm text-site-body placeholder:text-site-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand disabled:opacity-60"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* CTA */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-site-muted">
          Стоимость генерации:{" "}
          <span className={`font-semibold ${hasEnough ? "text-site-heading" : "text-red-500"}`}>
            50 ₽
          </span>
          {!hasEnough && <span className="ml-1 text-red-500">(недостаточно средств)</span>}
        </p>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || !hasEnough}
          className="flex min-w-[200px] items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Генерируем вопросы…
            </>
          ) : (
            "Сгенерировать опрос с ИИ"
          )}
        </button>
      </div>

      {isPending && (
        <p className="text-center text-xs text-site-muted">
          Это займёт 10–30 секунд. Не закрывайте страницу.
        </p>
      )}
    </div>
  );
}
