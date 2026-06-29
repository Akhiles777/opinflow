"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { SurveyDraft } from "@/types/survey";
import { EMPTY_DRAFT } from "@/types/survey";
import StepBasic from "@/components/survey-builder/StepBasic";
import StepQuestions from "@/components/survey-builder/StepQuestions";
import StepAudience from "@/components/survey-builder/StepAudience";
import StepBudget from "@/components/survey-builder/StepBudget";
import { createSelfServiceSurveyAction } from "@/actions/self-service-surveys";

const FREE_LIMIT = 5;

type Props = { existingCount: number };

const FREE_STEPS = ["Основное", "Вопросы"];
const PAID_STEPS = ["Основное", "Вопросы", "Аудитория", "Бюджет"];

export default function SelfServiceCreator({ existingCount }: Props) {
  const isFree = existingCount < FREE_LIMIT;
  const STEPS = isFree ? FREE_STEPS : PAID_STEPS;

  const router = useRouter();
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<SurveyDraft>({ ...EMPTY_DRAFT });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateDraft(patch: Partial<SurveyDraft>) {
    setDraft((prev) => ({ ...prev, ...patch }));
  }

  function validateStep(s: number): string | null {
    if (s === 1) {
      if (!draft.title.trim() || draft.title.trim().length < 5) return "Название — минимум 5 символов";
      if (!draft.category) return "Выберите категорию";
    }
    if (s === 2) {
      if (draft.questions.length === 0) return "Добавьте хотя бы один вопрос";
      for (const q of draft.questions) {
        if (!q.title.trim()) return "У каждого вопроса должен быть заголовок";
        if (["SINGLE_CHOICE", "MULTIPLE_CHOICE", "RANKING"].includes(q.type) &&
          q.options.filter((o) => o.trim()).length < 2)
          return "Вопросам с вариантами нужно минимум 2 варианта";
      }
    }
    if (!isFree && s === 4) {
      if (!draft.maxResponses || draft.maxResponses < 10) return "Минимум 10 респондентов";
      if (!draft.reward || draft.reward < 20) return "Минимальное вознаграждение — 20 ₽";
      if (!draft.endsAt) return "Укажите дату окончания";
    }
    return null;
  }

  function handleNext() {
    const err = validateStep(step);
    if (err) { setError(err); return; }
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length));
  }

  function handleSubmit() {
    const err = validateStep(step);
    if (err) { setError(err); return; }
    setError(null);

    startTransition(async () => {
      const input = isFree
        ? { title: draft.title, description: draft.description, category: draft.category, questions: draft.questions }
        : {
            title: draft.title,
            description: draft.description,
            category: draft.category,
            questions: draft.questions,
            maxResponses: draft.maxResponses,
            reward: draft.reward,
            startsAt: draft.startsAt || undefined,
            endsAt: draft.endsAt || undefined,
          };

      const result = await createSelfServiceSurveyAction(input);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      router.push(`/client/surveys/self-service/${result.surveyId}`);
    });
  }

  const isLastStep = step === STEPS.length;

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_296px] lg:items-start">
      {/* Main card */}
      <div className="rounded-[18px] border border-dash-border bg-dash-card">
        {/* Step header */}
        <div className="flex items-center justify-between border-b border-dash-border px-6 py-4">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[18px] font-bold text-[#7244F5]">{step}/{STEPS.length}</span>
            <span className="ml-1 text-[18px] font-semibold text-dash-heading">{STEPS[step - 1]}</span>
          </div>
        </div>

        {/* Step content */}
        <div className="min-h-[440px] p-6">
          {step === 1 && <StepBasic draft={draft} onChange={updateDraft} />}
          {step === 2 && (
            <StepQuestions
              draft={draft}
              questions={draft.questions}
              onChange={(q) => updateDraft({ questions: q })}
            />
          )}
          {!isFree && step === 3 && <StepAudience draft={draft} onChange={updateDraft} />}
          {!isFree && step === 4 && <StepBudget draft={draft} onChange={updateDraft} />}
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-500">
            {error}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between border-t border-dash-border px-6 py-4">
          <button
            type="button"
            onClick={() => { setError(null); setStep((s) => Math.max(s - 1, 1)); }}
            disabled={step === 1}
            className="rounded-xl border border-dash-border px-5 py-2.5 text-[13px] font-semibold text-dash-muted transition-colors hover:text-dash-heading disabled:opacity-40"
          >
            ← Назад
          </button>

          {isLastStep ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
              className="rounded-xl bg-[#7244F5] px-8 py-2.5 text-[14px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isPending ? "Создаём…" : isFree ? "Опубликовать" : "Опубликовать и оплатить"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              className="rounded-xl bg-[#7244F5] px-8 py-2.5 text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
            >
              Далее →
            </button>
          )}
        </div>
      </div>

      {/* Sidebar info */}
      <div className="rounded-[18px] border border-dash-border bg-dash-card p-5 space-y-4">
        <p className="text-[13px] font-semibold text-dash-heading">Анкета для своей базы</p>
        {isFree ? (
          <>
            <p className="text-[12px] text-dash-muted leading-relaxed">
              Это бесплатная анкета. Поделитесь ссылкой со своей аудиторией — собирайте ответы без ограничений.
            </p>
            <ul className="space-y-1.5 text-[12px] text-dash-muted">
              <li>✔ Без оплаты</li>
              <li>✔ Неограниченных ответов</li>
              <li>✔ Авто-добавление в пул платформы</li>
              <li>✔ ИИ-аналитика — 1 000 ₽ (опционально)</li>
            </ul>
          </>
        ) : (
          <>
            <p className="text-[12px] text-dash-muted leading-relaxed">
              Лимит бесплатных анкет исчерпан. Эта анкета создаётся по стандартным тарифам платформы — как обычный опрос из пула.
            </p>
            <p className="text-[12px] text-dash-muted leading-relaxed">
              Бюджет спишется сразу при публикации. Ссылку для своей базы вы получите на странице результатов.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
