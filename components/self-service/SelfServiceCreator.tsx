"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { SurveyDraft, Question } from "@/types/survey";
import { EMPTY_DRAFT } from "@/types/survey";
import StepBasic from "@/components/survey-builder/StepBasic";
import StepQuestions from "@/components/survey-builder/StepQuestions";
import StepAudience from "@/components/survey-builder/StepAudience";
import StepBudget from "@/components/survey-builder/StepBudget";
import AIGenerationForm from "@/components/survey-builder/AIGenerationForm";
import AIDraftReview from "@/components/survey-builder/AIDraftReview";
import SelfServiceAISettings from "./SelfServiceAISettings";
import { createSelfServiceSurveyAction } from "@/actions/self-service-surveys";
import type { GeneratedSurveyDraft, AiQuestionType, TemplateRow } from "@/actions/ai-survey-generation";
import { getMyTemplatesAction, deleteTemplateAction } from "@/actions/ai-survey-generation";

const FREE_LIMIT = 5;

type Tab = "manual" | "ai" | "templates";
type AIStep = "form" | "review" | "settings";

type Props = {
  existingCount: number;
  balance: number;
  commissionRate: number;
  minReward: number;
};

const FREE_STEPS = ["Основное", "Вопросы"];
const PAID_STEPS = ["Основное", "Вопросы", "Аудитория", "Бюджет"];

function templateToGeneratedDraft(name: string, questions: TemplateRow["questions"]): GeneratedSurveyDraft {
  const allowed: AiQuestionType[] = ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "SCALE", "RANKING", "OPEN_TEXT"];
  return {
    title: name,
    questions: questions
      .filter((q) => allowed.includes(q.type as AiQuestionType))
      .map((q) => ({
        text: q.title,
        type: q.type as AiQuestionType,
        options: q.options.length > 0 ? q.options : undefined,
        isRequired: q.required,
      })),
    targetingRecommendation: "",
  };
}

export default function SelfServiceCreator({ existingCount, balance, commissionRate, minReward }: Props) {
  const isFree = existingCount < FREE_LIMIT;
  const STEPS = isFree ? FREE_STEPS : PAID_STEPS;

  const router = useRouter();

  // ── Tabs & AI state ──────────────────────────────────────────────────────
  const [tab, setTab] = useState<Tab>("manual");
  const [aiStep, setAiStep] = useState<AIStep>("form");
  const [aiDraft, setAiDraft] = useState<GeneratedSurveyDraft | null>(null);
  const [fromTemplate, setFromTemplate] = useState(false);
  const [aiCharged, setAiCharged] = useState(false);

  // Data passed from review → settings
  const [settingsTitle, setSettingsTitle] = useState("");
  const [settingsQuestions, setSettingsQuestions] = useState<Question[]>([]);

  // ── Templates ────────────────────────────────────────────────────────────
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [templatesLoaded, setTemplatesLoaded] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [, startDelete] = useTransition();

  useEffect(() => {
    if (tab === "templates" && !templatesLoaded) {
      getMyTemplatesAction().then((rows) => {
        setTemplates(rows);
        setTemplatesLoaded(true);
      });
    }
  }, [tab, templatesLoaded]);

  // ── Manual wizard state ──────────────────────────────────────────────────
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<SurveyDraft>({ ...EMPTY_DRAFT });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const effectiveBalance = balance - (aiCharged ? 50 : 0);

  function updateDraft(patch: Partial<SurveyDraft>) {
    setDraft((prev) => ({ ...prev, ...patch }));
  }

  // ── Manual validation ────────────────────────────────────────────────────
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
      if ("error" in result) { setError(result.error); return; }
      router.push(`/client/surveys/self-service/${result.surveyId}`);
    });
  }

  // ── AI handlers ──────────────────────────────────────────────────────────
  function onAISuccess(generated: GeneratedSurveyDraft) {
    setAiDraft(generated);
    setFromTemplate(false);
    setAiCharged(true);
    setAiStep("review");
  }

  function onReviewConfirm(title: string, questions: Question[]) {
    setSettingsTitle(title);
    setSettingsQuestions(questions);
    setAiStep("settings");
  }

  function onSettingsBack() {
    setAiStep("review");
  }

  // ── Template handlers ────────────────────────────────────────────────────
  function onTemplateSelect(t: TemplateRow) {
    setAiDraft(templateToGeneratedDraft(t.name, t.questions));
    setFromTemplate(true);
    setAiCharged(false);
    setAiStep("review");
    setTab("ai");
  }

  function onDeleteTemplate(id: string) {
    setDeletingId(id);
    startDelete(async () => {
      await deleteTemplateAction(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      setDeletingId(null);
    });
  }

  // ── Navigation ───────────────────────────────────────────────────────────
  function goTab(t: Tab) {
    setTab(t);
    if (t !== "ai") setAiStep("form");
  }

  const showTabs = !(tab === "ai" && (aiStep === "review" || aiStep === "settings"));
  const isLastStep = step === STEPS.length;

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_296px] lg:items-start">
      {/* Main content */}
      <div>
        {/* Tab switcher */}
        {showTabs && (
          <div className="mb-6 flex flex-wrap gap-1 rounded-2xl border border-dash-border bg-dash-bg p-1 sm:w-fit">
            {(
              [
                { id: "manual" as Tab, label: "Создать вручную" },
                { id: "ai" as Tab, label: "✦ Создать с ИИ" },
                { id: "templates" as Tab, label: "Из шаблона" },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => goTab(item.id)}
                className={`rounded-xl px-5 py-2.5 text-sm font-medium transition-colors ${
                  tab === item.id
                    ? "bg-dash-card text-dash-heading shadow-sm"
                    : "text-dash-muted hover:text-dash-heading"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}

        {/* ── AI tab ────────────────────────────────────────────────────── */}
        {tab === "ai" && (
          <>
            {aiStep === "form" && (
              <AIGenerationForm balance={effectiveBalance} onSuccess={onAISuccess} />
            )}

            {aiStep === "review" && aiDraft && (
              <AIDraftReview
                draft={aiDraft}
                fromTemplate={fromTemplate}
                onConfirm={onReviewConfirm}
                onBack={() => {
                  if (fromTemplate) { goTab("templates"); } else { setAiStep("form"); }
                }}
              />
            )}

            {aiStep === "settings" && (
              <SelfServiceAISettings
                title={settingsTitle}
                questions={settingsQuestions}
                existingCount={existingCount}
                balance={effectiveBalance}
                commissionRate={commissionRate}
                minReward={minReward}
                onBack={onSettingsBack}
              />
            )}
          </>
        )}

        {/* ── Templates tab ─────────────────────────────────────────────── */}
        {tab === "templates" && (
          <div className="mx-auto max-w-2xl">
            {!templatesLoaded ? (
              <div className="flex items-center gap-2 text-sm text-dash-muted">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Загружаем шаблоны…
              </div>
            ) : templates.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-dash-border bg-dash-card p-10 text-center">
                <p className="text-sm font-semibold text-dash-heading">Шаблонов пока нет</p>
                <p className="mt-2 text-sm text-dash-muted">
                  Создайте анкету с ИИ, отредактируйте вопросы и нажмите «Сохранить как шаблон» —
                  затем быстро запускайте похожие анкеты.
                </p>
                <button
                  type="button"
                  onClick={() => goTab("ai")}
                  className="mt-5 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
                >
                  Создать с помощью ИИ
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-dash-muted">
                  {templates.length} шаблон{templates.length === 1 ? "" : templates.length < 5 ? "а" : "ов"}
                </p>
                {templates.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-3 rounded-2xl border border-dash-border bg-dash-card p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-dash-heading">{t.name}</p>
                      <p className="mt-0.5 text-xs text-dash-muted">
                        {t.questions.length} вопрос{t.questions.length < 2 ? "" : t.questions.length < 5 ? "а" : "ов"} ·{" "}
                        {new Date(t.createdAt).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => onTemplateSelect(t)}
                        className="rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-brand-dark"
                      >
                        Использовать
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteTemplate(t.id)}
                        disabled={deletingId === t.id}
                        aria-label="Удалить шаблон"
                        className="rounded-lg border border-dash-border px-3 py-2 text-xs text-dash-muted hover:border-red-400/50 hover:text-red-400 disabled:opacity-40"
                      >
                        {deletingId === t.id ? "…" : "✕"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Manual tab ────────────────────────────────────────────────── */}
        {tab === "manual" && (
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

            {/* Moderation note on last step */}
            {isLastStep && (
              <div className="mx-6 mb-4 rounded-xl border border-amber-400/30 bg-amber-50/50 px-4 py-3 text-[12px] text-amber-700">
                После публикации анкета отправится на модерацию. Ссылка для аудитории станет активна после одобрения.
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
                  {isPending ? "Отправляем…" : "Отправить на модерацию"}
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
        )}
      </div>

      {/* Sidebar */}
      <div className="rounded-[18px] border border-dash-border bg-dash-card p-5 space-y-4">
        <p className="text-[13px] font-semibold text-dash-heading">Анкета для своей базы</p>
        {isFree ? (
          <>
            <p className="text-[12px] text-dash-muted leading-relaxed">
              Это бесплатная анкета. После одобрения поделитесь ссылкой со своей аудиторией.
            </p>
            <ul className="space-y-1.5 text-[12px] text-dash-muted">
              <li>✔ Без оплаты</li>
              <li>✔ Неограниченных ответов</li>
              <li>✔ ИИ-аналитика — 1 000 ₽ (опционально)</li>
              <li className="text-[#7244F5]">✦ Генерация вопросов ИИ — 50 ₽</li>
            </ul>
          </>
        ) : (
          <>
            <p className="text-[12px] text-dash-muted leading-relaxed">
              Лимит бесплатных анкет исчерпан. Эта анкета создаётся по стандартным тарифам платформы.
            </p>
            <ul className="space-y-1.5 text-[12px] text-dash-muted">
              <li className="text-[#7244F5]">✦ Генерация вопросов ИИ — 50 ₽</li>
            </ul>
          </>
        )}
        <div className="border-t border-dash-border pt-3 space-y-1">
          <p className="text-[11px] text-dash-muted">
            Баланс: <span className="font-semibold text-dash-heading">{balance.toLocaleString("ru-RU")} ₽</span>
          </p>
          {balance < 50 && tab === "ai" && aiStep === "form" && (
            <a href="/client/wallet" className="block text-[11px] text-brand underline">
              Пополнить кошелёк
            </a>
          )}
        </div>
        <div className="rounded-xl border border-amber-400/20 bg-amber-50/40 px-3 py-2">
          <p className="text-[11px] text-amber-700 leading-relaxed">
            Все анкеты проходят модерацию перед публикацией.
          </p>
        </div>
      </div>
    </div>
  );
}
