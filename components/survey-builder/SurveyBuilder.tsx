"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSurveyAction, saveDraftAction, deleteSurveyAction } from "@/actions/surveys";
import StepAudience from "@/components/survey-builder/StepAudience";
import StepBasic from "@/components/survey-builder/StepBasic";
import StepBudget from "@/components/survey-builder/StepBudget";
import StepQuestions from "@/components/survey-builder/StepQuestions";
import { EMPTY_DRAFT, type SurveyDraft } from "@/types/survey";

type Props = {
  balance: number;
  commissionRate: number;
  minReward: number;
  userName?: string | null;
  userEmail?: string | null;
  initialDraftId?: string;
  initialDraftStep?: number;
  initialDraftData?: SurveyDraft;
};

const STEP_TITLES = ["Основное", "Вопросы", "Аудитория", "Бюджет"];
const DRAFT_KEY = "opinflow:client-survey-draft:v1";

type PersistedDraft = { step: number; draft: SurveyDraft };

function normalizeDraft(value: unknown): SurveyDraft | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Partial<SurveyDraft>;
  return {
    ...EMPTY_DRAFT,
    ...raw,
    questions: Array.isArray(raw.questions) ? raw.questions : EMPTY_DRAFT.questions,
    targetCities: Array.isArray(raw.targetCities) ? raw.targetCities : EMPTY_DRAFT.targetCities,
    targetIncomes: Array.isArray(raw.targetIncomes) ? raw.targetIncomes : EMPTY_DRAFT.targetIncomes,
    targetInterests: Array.isArray(raw.targetInterests) ? raw.targetInterests : EMPTY_DRAFT.targetInterests,
    targetEmploymentStatuses: Array.isArray(raw.targetEmploymentStatuses) ? raw.targetEmploymentStatuses : EMPTY_DRAFT.targetEmploymentStatuses,
    targetIndustries: Array.isArray(raw.targetIndustries) ? raw.targetIndustries : EMPTY_DRAFT.targetIndustries,
    targetMaritalStatuses: Array.isArray(raw.targetMaritalStatuses) ? raw.targetMaritalStatuses : EMPTY_DRAFT.targetMaritalStatuses,
    title: typeof raw.title === "string" ? raw.title : EMPTY_DRAFT.title,
    description: typeof raw.description === "string" ? raw.description : EMPTY_DRAFT.description,
    category: typeof raw.category === "string" ? raw.category : EMPTY_DRAFT.category,
    targetGender: raw.targetGender === "male" || raw.targetGender === "female" || raw.targetGender === "any" ? raw.targetGender : EMPTY_DRAFT.targetGender,
    targetAgeMin: typeof raw.targetAgeMin === "number" ? raw.targetAgeMin : EMPTY_DRAFT.targetAgeMin,
    targetAgeMax: typeof raw.targetAgeMax === "number" ? raw.targetAgeMax : EMPTY_DRAFT.targetAgeMax,
    targetHasChildren: raw.targetHasChildren === "yes" || raw.targetHasChildren === "no" || raw.targetHasChildren === "any" ? raw.targetHasChildren : EMPTY_DRAFT.targetHasChildren,
    maxResponses: typeof raw.maxResponses === "number" ? raw.maxResponses : EMPTY_DRAFT.maxResponses,
    reward: typeof raw.reward === "number" ? raw.reward : EMPTY_DRAFT.reward,
    startsAt: typeof raw.startsAt === "string" ? raw.startsAt : EMPTY_DRAFT.startsAt,
    endsAt: typeof raw.endsAt === "string" ? raw.endsAt : EMPTY_DRAFT.endsAt,
  };
}

function estimateReach(draft: SurveyDraft) {
  let reach = 25000;
  if (draft.targetGender !== "any") reach *= 0.7;
  if (draft.targetAgeMin > 18 || draft.targetAgeMax < 65) reach *= 0.7;
  if (draft.targetCities.length > 0) reach *= 0.7;
  if (draft.targetIncomes.length > 0) reach *= 0.7;
  if (draft.targetInterests.length > 0) reach *= 0.7;
  if (draft.targetHasChildren !== "any") reach *= 0.7;
  if (draft.targetEmploymentStatuses.length > 0) reach *= 0.7;
  if (draft.targetIndustries.length > 0) reach *= 0.7;
  if (draft.targetMaritalStatuses.length > 0) reach *= 0.7;
  return Math.max(500, Math.round(reach));
}

type ServerSaveStatus = "idle" | "saving" | "saved" | "error";

export default function SurveyBuilder({ balance, commissionRate, minReward, userName, userEmail, initialDraftId, initialDraftStep, initialDraftData }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(initialDraftStep ?? 1);
  const [draft, setDraft] = useState<SurveyDraft>(initialDraftData ?? EMPTY_DRAFT);
  const [error, setError] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState<string | null>(initialDraftData ? "Черновик восстановлен" : null);
  const [hydrated, setHydrated] = useState(!!initialDraftData);
  const [isSubmitting, startTransition] = useTransition();

  // Server-side draft tracking
  const [serverDraftId, setServerDraftId] = useState<string | null>(initialDraftId ?? null);
  const [serverSaveStatus, setServerSaveStatus] = useState<ServerSaveStatus>("idle");
  const isDirtyRef = useRef(false);
  const draftRef = useRef(draft);
  const stepRef = useRef(step);

  useEffect(() => { draftRef.current = draft; }, [draft]);
  useEffect(() => { stepRef.current = step; }, [step]);

  const totalBase = draft.maxResponses * draft.reward;
  const commission = Math.round(totalBase * commissionRate);
  const totalBudget = totalBase + commission;
  const hasEnough = balance >= totalBudget;
  const reach = useMemo(() => estimateReach(draft), [draft]);

  const initials = (userName || userEmail || "UX").slice(0, 2).toUpperCase();
  const displayName = userName || (userEmail ? userEmail.split("@")[0] : "UX");

  // Restore draft from localStorage (only if no server draft was loaded)
  useEffect(() => {
    if (initialDraftData) return; // server draft takes priority
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (!raw) { setHydrated(true); return; }
      const parsed = JSON.parse(raw) as Partial<PersistedDraft>;
      const restored = normalizeDraft(parsed.draft);
      const restoredStep = typeof parsed.step === "number" && parsed.step >= 1 && parsed.step <= 4 ? parsed.step : 1;
      if (restored) { setDraft(restored); setStep(restoredStep); setDraftStatus("Черновик восстановлен"); }
    } catch { window.localStorage.removeItem(DRAFT_KEY); }
    finally { setHydrated(true); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Local autosave (300ms debounce)
  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setTimeout(() => {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ step, draft } satisfies PersistedDraft));
      setDraftStatus((cur) => cur === "Черновик восстановлен" ? cur : "Черновик сохранён");
      isDirtyRef.current = true;
    }, 300);
    return () => window.clearTimeout(timer);
  }, [draft, step, hydrated]);

  // Server autosave helper
  const doServerSave = useCallback(async (currentDraft: SurveyDraft, currentStep: number) => {
    setServerSaveStatus("saving");
    try {
      const result = await saveDraftAction(currentDraft, serverDraftId ?? undefined, currentStep);
      if ("success" in result) {
        setServerDraftId(result.surveyId ?? null);
        isDirtyRef.current = false;
        setServerSaveStatus("saved");
        setTimeout(() => setServerSaveStatus((s) => s === "saved" ? "idle" : s), 3000);
      } else {
        setServerSaveStatus("error");
        setTimeout(() => setServerSaveStatus((s) => s === "error" ? "idle" : s), 5000);
      }
    } catch {
      setServerSaveStatus("error");
      setTimeout(() => setServerSaveStatus((s) => s === "error" ? "idle" : s), 5000);
    }
  }, [serverDraftId]);

  // Server autosave every 30 seconds if dirty
  useEffect(() => {
    if (!hydrated) return;
    const interval = setInterval(() => {
      if (isDirtyRef.current) {
        void doServerSave(draftRef.current, stepRef.current);
      }
    }, 30_000);
    return () => clearInterval(interval);
  }, [hydrated, doServerSave]);

  // Fire-and-forget save on page unload
  useEffect(() => {
    function handleUnload() {
      if (isDirtyRef.current) {
        void saveDraftAction(draftRef.current, serverDraftId ?? undefined, stepRef.current);
      }
    }
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [serverDraftId]);

  function updateDraft(patch: Partial<SurveyDraft>) {
    setDraft((prev) => ({ ...prev, ...patch }));
    setError(null);
    isDirtyRef.current = true;
  }

  function clearDraft() {
    window.localStorage.removeItem(DRAFT_KEY);
    setDraft(EMPTY_DRAFT);
    setStep(1);
    setError(null);
    setDraftStatus("Черновик очищен");
    isDirtyRef.current = false;
    if (serverDraftId) {
      void deleteSurveyAction(serverDraftId);
      setServerDraftId(null);
    }
  }

  function validateStep(s: number) {
    if (s === 1) {
      if (draft.title.trim().length < 5) return "Название должно содержать минимум 5 символов";
      if (!draft.category.trim()) return "Выберите категорию";
    }
    if (s === 2) {
      if (draft.questions.length < 1) return "Добавьте хотя бы один вопрос";
      for (const q of draft.questions) {
        if (!q.title.trim()) return "У каждого вопроса должен быть заполнен заголовок";
        if (["SINGLE_CHOICE", "MULTIPLE_CHOICE", "RANKING"].includes(q.type) && q.options.filter((o) => o.trim()).length < 2) {
          return "У вопросов с вариантами должно быть минимум 2 варианта ответа";
        }
        if (q.type === "MATRIX") {
          if (q.matrixRows.filter((r) => r.trim()).length < 1) return "У матричного вопроса должна быть хотя бы одна строка";
          if (q.matrixCols.filter((c) => c.trim()).length < 2) return "У матричного вопроса должно быть минимум 2 столбца";
        }
      }
    }
    if (s === 3 && draft.targetAgeMin > draft.targetAgeMax) return "Минимальный возраст не может быть больше максимального";
    if (s === 4) {
      if (draft.maxResponses < 10) return "Минимум 10 респондентов";
      if (draft.reward < minReward) return `Минимальное вознаграждение — ${minReward} ₽`;
      if (!draft.endsAt) return "Укажите дату окончания";
      if (draft.startsAt && draft.endsAt && draft.endsAt < draft.startsAt) return "Дата окончания должна быть позже даты начала";
    }
    return null;
  }

  function goNext() {
    const err = validateStep(step);
    if (err) { setError(err); return; }
    setError(null);
    const nextStep = Math.min(step + 1, 4);
    setStep(nextStep);
    void doServerSave(draft, nextStep);
  }

  function handleSubmit() {
    const err = validateStep(4);
    if (err) { setError(err); return; }
    startTransition(async () => {
      try {
        const result = await createSurveyAction(draft);
        if (result.error || !result.success) { setError(result.error ?? "Не удалось создать опрос"); return; }
        window.localStorage.removeItem(DRAFT_KEY);
        // Delete server draft after successful publish
        if (serverDraftId) {
          void deleteSurveyAction(serverDraftId);
        }
        router.push(`/client/surveys/${result.surveyId}`);
      } catch { setError("Не удалось создать опрос. Попробуйте ещё раз."); }
    });
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_296px] lg:items-start">

      {/* ── Main card ───────────────────────────────────────── */}
      <div className="rounded-[18px] border border-dash-border bg-dash-card">

        {/* Step header */}
        <div className="flex items-center justify-between border-b border-dash-border px-6 py-4">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[18px] font-bold text-[#7244F5]">{step}/4</span>
            <span className="ml-1 text-[18px] font-semibold text-dash-heading">{STEP_TITLES[step - 1]}</span>
          </div>
          <div className="flex items-center gap-3">
            {serverSaveStatus === "saving" && (
              <span className="text-[12px] text-dash-muted">Сохраняется…</span>
            )}
            {serverSaveStatus === "saved" && (
              <span className="text-[12px] text-green-500">Сохранено</span>
            )}
            {serverSaveStatus === "error" && (
              <span className="text-[12px] text-red-400">Не удалось сохранить</span>
            )}
            <button
              type="button"
              onClick={clearDraft}
              className="rounded-xl border border-dash-border bg-dash-bg px-4 py-2 text-[13px] font-semibold text-dash-muted transition-colors hover:text-dash-heading"
            >
              Очистить черновик
            </button>
          </div>
        </div>

        {/* Step content */}
        <div className="min-h-110 p-6">
          {step === 1 ? <StepBasic draft={draft} onChange={updateDraft} /> : null}
          {step === 2 ? <StepQuestions draft={draft} questions={draft.questions} onChange={(q) => updateDraft({ questions: q })} /> : null}
          {step === 3 ? <StepAudience draft={draft} onChange={updateDraft} /> : null}
          {step === 4 ? <StepBudget draft={draft} onChange={updateDraft} /> : null}
        </div>

        {/* Error */}
        {error ? (
          <div className="mx-6 mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-500">
            {error}
          </div>
        ) : null}

        {/* Nav buttons */}
        <div className="flex items-center justify-between border-t border-dash-border px-6 py-4">
          <button
            type="button"
            onClick={() => {
              setError(null);
              const prevStep = Math.max(step - 1, 1);
              setStep(prevStep);
              if (prevStep !== step) void doServerSave(draft, prevStep);
            }}
            disabled={step === 1}
            className="rounded-xl border border-dash-border bg-dash-card px-5 py-2.5 text-[13px] font-semibold text-dash-heading transition-colors hover:bg-dash-bg disabled:pointer-events-none disabled:opacity-40"
          >
            Назад
          </button>

          {step < 4 ? (
            <button
              type="button"
              onClick={goNext}
              className="rounded-xl bg-[#7244F5] px-6 py-2.5 text-[13px] font-semibold text-white shadow-[0_6px_18px_rgba(114,68,245,0.4)] transition-all hover:bg-[#6238DC]"
            >
              Далее
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !hasEnough}
              className="rounded-xl bg-[#7244F5] px-6 py-2.5 text-[13px] font-semibold text-white shadow-[0_6px_18px_rgba(114,68,245,0.4)] transition-all hover:bg-[#6238DC] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Публикуем..." : "Опубликовать"}
            </button>
          )}
        </div>
      </div>

      {/* ── Right sidebar ────────────────────────────────────── */}
      <div className="space-y-4 lg:sticky lg:top-6">

        {step === 1 ? (
          /* User card */
          <div className="rounded-[18px] border border-dash-border bg-dash-card p-5">
            <div className="flex h-30 items-center justify-center rounded-xl bg-dash-bg">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#EEE8FF] text-[20px] font-semibold text-[#7244F5]">
                {initials}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-[15px] font-semibold text-dash-heading">{displayName}</p>
              {userEmail ? <p className="mt-0.5 text-[13px] text-dash-muted">{userEmail}</p> : null}
            </div>
          </div>
        ) : (
          <>
            {/* Итог бюджета */}
            <div className="rounded-[18px] border border-dash-border bg-dash-card p-5">
              <p className="text-[16px] font-semibold text-dash-heading">Итог бюджета</p>

              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-[14px] text-dash-body">
                  <span>{draft.maxResponses} × {draft.reward} ₽</span>
                  <span>{totalBase.toLocaleString("ru-RU")} ₽</span>
                </div>
                <div className="flex justify-between text-[13px] text-dash-muted">
                  <span>Комиссия платформы ({Math.round(commissionRate * 100)}%)</span>
                  <span>{commission.toLocaleString("ru-RU")} ₽</span>
                </div>
              </div>

              <div className="my-3 border-t border-dash-border" />

              <div className="flex items-baseline justify-between">
                <span className="text-[14px] text-dash-muted">Итого</span>
                <span className="text-[28px] font-bold leading-none text-[#7244F5] tabular-nums">
                  {totalBudget.toLocaleString("ru-RU")} ₽
                </span>
              </div>

              {!hasEnough ? (
                <div className="mt-4 rounded-xl border border-dashed border-red-300 bg-red-50 px-3 py-2.5 text-[12px] text-red-500">
                  Недостаточно средств. Пополните баланс.
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <Link
                  href="/client/wallet"
                  className="rounded-xl border border-dash-border bg-dash-bg px-4 py-2 text-[13px] font-semibold text-dash-heading transition-colors hover:bg-dash-card"
                >
                  Пополнить баланс
                </Link>
                <span className="text-[12px] text-dash-muted">
                  Баланс кошелька: {balance.toLocaleString("ru-RU")} ₽
                </span>
              </div>
            </div>

            {/* Подбор аудитории */}
            <div className="rounded-[18px] border border-dash-border bg-dash-card p-5">
              <p className="text-[16px] font-semibold text-dash-heading">Подбор аудитории</p>
              <p className="mt-3 text-[32px] font-bold text-[#7244F5] tabular-nums">
                ~{reach.toLocaleString("ru-RU")}
              </p>
              <p className="mt-0.5 text-[13px] text-dash-muted">Расчётный охват</p>
              <p className="mt-3 text-[13px] leading-relaxed text-dash-muted">
                Это примерная оценка доступной аудитории на основе выбранных фильтров. Чем жёстче сегментация, тем ниже доступный охват и тем дольше может идти набор.
              </p>
            </div>
          </>
        )}

        {draftStatus ? (
          <p className="text-center text-[12px] text-dash-muted">{draftStatus}</p>
        ) : null}
      </div>
    </div>
  );
}
