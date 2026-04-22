"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSurveyAction } from "@/actions/surveys";
import StepAudience from "@/components/survey-builder/StepAudience";
import StepBasic from "@/components/survey-builder/StepBasic";
import StepBudget from "@/components/survey-builder/StepBudget";
import StepQuestions from "@/components/survey-builder/StepQuestions";
import { EMPTY_DRAFT, type SurveyDraft } from "@/types/survey";

type Props = {
  balance: number;
};

const steps = [
  { id: 1, title: "Основное" },
  { id: 2, title: "Вопросы" },
  { id: 3, title: "Аудитория" },
  { id: 4, title: "Бюджет" },
] as const;

const DRAFT_STORAGE_KEY = "opinflow:client-survey-draft:v1";

type PersistedDraftState = {
  step: number;
  draft: SurveyDraft;
};

function normalizeDraft(value: unknown): SurveyDraft | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const raw = value as Partial<SurveyDraft>;

  return {
    ...EMPTY_DRAFT,
    ...raw,
    questions: Array.isArray(raw.questions) ? raw.questions : EMPTY_DRAFT.questions,
    targetCities: Array.isArray(raw.targetCities) ? raw.targetCities : EMPTY_DRAFT.targetCities,
    targetIncomes: Array.isArray(raw.targetIncomes) ? raw.targetIncomes : EMPTY_DRAFT.targetIncomes,
    targetInterests: Array.isArray(raw.targetInterests) ? raw.targetInterests : EMPTY_DRAFT.targetInterests,
    targetEmploymentStatuses: Array.isArray(raw.targetEmploymentStatuses)
      ? raw.targetEmploymentStatuses
      : EMPTY_DRAFT.targetEmploymentStatuses,
    targetIndustries: Array.isArray(raw.targetIndustries) ? raw.targetIndustries : EMPTY_DRAFT.targetIndustries,
    targetMaritalStatuses: Array.isArray(raw.targetMaritalStatuses)
      ? raw.targetMaritalStatuses
      : EMPTY_DRAFT.targetMaritalStatuses,
    title: typeof raw.title === "string" ? raw.title : EMPTY_DRAFT.title,
    description: typeof raw.description === "string" ? raw.description : EMPTY_DRAFT.description,
    category: typeof raw.category === "string" ? raw.category : EMPTY_DRAFT.category,
    targetGender:
      raw.targetGender === "male" || raw.targetGender === "female" || raw.targetGender === "any"
        ? raw.targetGender
        : EMPTY_DRAFT.targetGender,
    targetAgeMin: typeof raw.targetAgeMin === "number" ? raw.targetAgeMin : EMPTY_DRAFT.targetAgeMin,
    targetAgeMax: typeof raw.targetAgeMax === "number" ? raw.targetAgeMax : EMPTY_DRAFT.targetAgeMax,
    targetHasChildren:
      raw.targetHasChildren === "yes" || raw.targetHasChildren === "no" || raw.targetHasChildren === "any"
        ? raw.targetHasChildren
        : EMPTY_DRAFT.targetHasChildren,
    maxResponses: typeof raw.maxResponses === "number" ? raw.maxResponses : EMPTY_DRAFT.maxResponses,
    reward: typeof raw.reward === "number" ? raw.reward : EMPTY_DRAFT.reward,
    startsAt: typeof raw.startsAt === "string" ? raw.startsAt : EMPTY_DRAFT.startsAt,
    endsAt: typeof raw.endsAt === "string" ? raw.endsAt : EMPTY_DRAFT.endsAt,
  };
}

export default function SurveyBuilder({ balance }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<SurveyDraft>(EMPTY_DRAFT);
  const [error, setError] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [isSubmitting, startTransition] = useTransition();

  const totalBudget = useMemo(() => draft.maxResponses * draft.reward * 1.15, [draft.maxResponses, draft.reward]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!raw) {
        setHydrated(true);
        return;
      }

      const parsed = JSON.parse(raw) as Partial<PersistedDraftState>;
      const restoredDraft = normalizeDraft(parsed.draft);
      const restoredStep =
        typeof parsed.step === "number" && parsed.step >= 1 && parsed.step <= 4 ? parsed.step : 1;

      if (restoredDraft) {
        setDraft(restoredDraft);
        setStep(restoredStep);
        setDraftStatus("Черновик восстановлен");
      }
    } catch {
      window.localStorage.removeItem(DRAFT_STORAGE_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    const saveTimer = window.setTimeout(() => {
      window.localStorage.setItem(
        DRAFT_STORAGE_KEY,
        JSON.stringify({
          step,
          draft,
        } satisfies PersistedDraftState),
      );
      setDraftStatus((current) => (current === "Черновик восстановлен" ? current : "Черновик сохранён"));
    }, 300);

    return () => {
      window.clearTimeout(saveTimer);
    };
  }, [draft, step, hydrated]);

  function updateDraft(patch: Partial<SurveyDraft>) {
    setDraft((prev) => ({ ...prev, ...patch }));
    setError(null);
  }

  function clearDraft() {
    window.localStorage.removeItem(DRAFT_STORAGE_KEY);
    setDraft(EMPTY_DRAFT);
    setStep(1);
    setError(null);
    setDraftStatus("Черновик очищен");
  }

  function validateStep(currentStep: number) {
    if (currentStep === 1) {
      if (draft.title.trim().length < 5) return "Название должно содержать минимум 5 символов";
      if (!draft.category.trim()) return "Выберите категорию";
    }

    if (currentStep === 2) {
      if (draft.questions.length < 1) return "Добавьте хотя бы один вопрос";
      for (const question of draft.questions) {
        if (!question.title.trim()) return "У каждого вопроса должен быть заполнен заголовок";
        if (["SINGLE_CHOICE", "MULTIPLE_CHOICE", "RANKING"].includes(question.type) && question.options.filter((item) => item.trim()).length < 2) {
          return "У вопросов с вариантами должно быть минимум 2 варианта ответа";
        }
        if (question.type === "MATRIX") {
          if (question.matrixRows.filter((item) => item.trim()).length < 1) {
            return "У матричного вопроса должна быть хотя бы одна строка";
          }
          if (question.matrixCols.filter((item) => item.trim()).length < 2) {
            return "У матричного вопроса должно быть минимум 2 столбца";
          }
        }
      }
    }

    if (currentStep === 3) {
      if (draft.targetAgeMin > draft.targetAgeMax) {
        return "Минимальный возраст не может быть больше максимального";
      }
    }

    if (currentStep === 4) {
      if (draft.maxResponses < 10) return "Минимум 10 респондентов";
      if (draft.reward < 20) return "Минимальное вознаграждение — 20 ₽";
      if (!draft.endsAt) return "Укажите дату окончания";
      if (draft.startsAt && draft.endsAt && draft.endsAt < draft.startsAt) {
        return "Дата окончания должна быть позже даты начала";
      }
    }

    return null;
  }

  function goNext() {
    const validationError = validateStep(step);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setStep((prev) => Math.min(prev + 1, 4));
  }

  function handleSubmit() {
    const validationError = validateStep(4);
    if (validationError) {
      setError(validationError);
      return;
    }

    startTransition(async () => {
      try {
        const result = await createSurveyAction(draft);
        if (result.error || !result.success) {
          setError(result.error ?? "Не удалось создать опрос");
          return;
        }

        window.localStorage.removeItem(DRAFT_STORAGE_KEY);
        setDraftStatus(null);
        router.push(`/client/surveys/${result.surveyId}`);
      } catch {
        setError("Не удалось создать опрос. Попробуйте ещё раз.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-dash-border bg-dash-card p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="grid flex-1 gap-4 md:grid-cols-4">
            {steps.map((item, index) => {
              const active = item.id === step;
              const done = item.id < step;
              return (
                <div key={item.id} className="flex items-center gap-3">
                  <div className={[
                    "flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold",
                    active
                      ? "bg-brand text-white"
                      : done
                        ? "bg-brand/20 text-brand"
                        : "bg-dash-border text-dash-muted",
                  ].join(" ")}>
                    {done ? "✓" : item.id}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-dash-heading">{item.title}</div>
                    {index < steps.length - 1 ? (
                      <div className={[
                        "mt-2 h-1 rounded-full",
                        done ? "bg-brand/30" : "bg-dash-border",
                      ].join(" ")} />
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3 lg:justify-end">
            {draftStatus ? <div className="text-sm font-medium text-dash-muted">{draftStatus}</div> : null}
            <button
              type="button"
              onClick={clearDraft}
              className="rounded-xl border border-dash-border bg-dash-bg px-4 py-2 text-sm font-semibold text-dash-heading transition-colors hover:border-brand/30 hover:text-brand"
            >
              Очистить черновик
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-dash-border bg-dash-card p-6 sm:p-8">
        {step === 1 ? <StepBasic draft={draft} onChange={updateDraft} /> : null}
        {step === 2 ? <StepQuestions draft={draft} questions={draft.questions} onChange={(questions) => updateDraft({ questions })} /> : null}
        {step === 3 ? <StepAudience draft={draft} onChange={updateDraft} /> : null}
        {step === 4 ? <StepBudget draft={draft} balance={balance} onChange={updateDraft} /> : null}
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-medium text-red-500">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => {
            setError(null);
            setStep((prev) => Math.max(prev - 1, 1));
          }}
          className={[
            "rounded-xl border px-5 py-3 text-sm font-semibold transition-colors",
            step === 1
              ? "pointer-events-none border-dash-border bg-dash-bg text-dash-muted opacity-50"
              : "border-dash-border bg-dash-bg text-dash-heading hover:border-brand/30 hover:text-brand",
          ].join(" ")}
        >
          Назад
        </button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="text-sm text-dash-muted">Итого к списанию: {totalBudget.toLocaleString("ru-RU")} ₽</div>
          {step < 4 ? (
            <button type="button" onClick={goNext} className="rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-mid">
              Далее
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || balance < totalBudget}
              className="rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-mid disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Публикуем..." : "Опубликовать"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
