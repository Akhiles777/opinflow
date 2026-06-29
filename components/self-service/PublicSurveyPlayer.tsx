"use client";

import { useState, useTransition } from "react";
import type { Question } from "@/types/survey";
import QuestionRenderer from "@/components/survey-player/QuestionRenderer";
import { submitSelfServiceResponseAction } from "@/actions/self-service-surveys";

type Props = {
  slug: string;
  title: string;
  description?: string;
  estimatedTime?: number;
  questions: Question[];
};

export default function PublicSurveyPlayer({ slug, title, description, estimatedTime, questions }: Props) {
  const [step, setStep] = useState<"info" | "survey" | "done">("info");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Validate required questions
  function validateAnswers(): string | null {
    for (const q of questions) {
      if (!q.required) continue;
      const val = answers[q.id];
      if (val === undefined || val === null || val === "") return `Ответьте на вопрос: «${q.title}»`;
      if (Array.isArray(val) && val.length === 0) return `Ответьте на вопрос: «${q.title}»`;
    }
    return null;
  }

  function handleInfoNext(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) { setError("Введите ваше имя"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Введите корректный email");
      return;
    }
    setStep("survey");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const qErr = validateAnswers();
    if (qErr) { setError(qErr); return; }

    startTransition(async () => {
      const result = await submitSelfServiceResponseAction({ slug, email: email.trim(), name: name.trim(), answers });
      if ("error" in result) {
        setError(result.error);
      } else {
        setStep("done");
      }
    });
  }

  if (step === "done") {
    return (
      <div className="rounded-2xl border border-dash-border bg-dash-card p-10 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
          ✅
        </div>
        <h2 className="text-xl font-bold text-dash-heading">Спасибо за участие!</h2>
        <p className="mt-2 text-sm text-dash-muted">Ваши ответы успешно сохранены.</p>
        <p className="mt-1 text-sm text-dash-muted">
          Мы отправили письмо на <strong className="text-dash-heading">{email}</strong> — в нём ссылка на личный кабинет.
        </p>
      </div>
    );
  }

  if (step === "info") {
    return (
      <div className="rounded-2xl border border-dash-border bg-dash-card overflow-hidden">
        {/* Header */}
        <div className="border-b border-dash-border px-8 py-6">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-brand mb-1">Анкета</p>
          <h1 className="text-xl font-bold text-dash-heading">{title}</h1>
          {description && <p className="mt-1 text-sm text-dash-muted">{description}</p>}
          {estimatedTime && (
            <p className="mt-2 text-xs text-dash-muted">≈ {estimatedTime} мин</p>
          )}
        </div>

        {/* Contact form */}
        <form onSubmit={handleInfoNext} className="p-8 space-y-5">
          <p className="text-sm text-dash-muted">
            Чтобы сохранить ваши ответы, укажите имя и email. Мы не отправляем спам.
          </p>

          <div className="space-y-1">
            <label className="block text-[13px] font-medium text-dash-heading">Ваше имя</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Как вас зовут?"
              className="w-full rounded-xl border border-dash-border bg-dash-bg px-4 py-2.5 text-sm text-dash-heading placeholder:text-dash-muted focus:border-brand focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[13px] font-medium text-dash-heading">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full rounded-xl border border-dash-border bg-dash-bg px-4 py-2.5 text-sm text-dash-heading placeholder:text-dash-muted focus:border-brand focus:outline-none"
            />
          </div>

          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-500">{error}</p>
          )}

          <button
            type="submit"
            className="w-full rounded-xl bg-brand py-3 text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
          >
            Начать опрос →
          </button>
        </form>
      </div>
    );
  }

  // Survey step
  return (
    <div className="rounded-2xl border border-dash-border bg-dash-card overflow-hidden">
      <div className="border-b border-dash-border px-8 py-5">
        <h2 className="text-base font-semibold text-dash-heading">{title}</h2>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        {questions.map((q, idx) => (
          <div key={q.id} className="space-y-3">
            <div className="flex items-start gap-2">
              <span className="mt-0.5 text-xs font-bold text-brand shrink-0">{idx + 1}.</span>
              <div>
                <p className="text-[14px] font-medium text-dash-heading">
                  {q.title}
                  {q.required && <span className="ml-1 text-red-500">*</span>}
                </p>
                {q.description && <p className="mt-0.5 text-xs text-dash-muted">{q.description}</p>}
              </div>
            </div>
            <QuestionRenderer
              question={q}
              value={answers[q.id]}
              onChange={(val) => setAnswers((prev) => ({ ...prev, [q.id]: val }))}
            />
          </div>
        ))}

        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-500">{error}</p>
        )}

        <div className="flex items-center justify-between gap-4 border-t border-dash-border pt-6">
          <button
            type="button"
            onClick={() => { setStep("info"); setError(null); }}
            className="rounded-xl border border-dash-border px-5 py-2.5 text-[13px] font-medium text-dash-muted hover:text-dash-heading transition-colors"
          >
            ← Назад
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-xl bg-brand px-8 py-2.5 text-[14px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? "Отправляем…" : "Отправить ответы"}
          </button>
        </div>
      </form>
    </div>
  );
}
