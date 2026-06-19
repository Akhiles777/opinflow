"use client";

import { useState, useEffect, useTransition } from "react";
import SurveyBuilder from "@/components/survey-builder/SurveyBuilder";
import AIGenerationForm from "@/components/survey-builder/AIGenerationForm";
import AIDraftReview from "@/components/survey-builder/AIDraftReview";
import type { GeneratedSurveyDraft, AiQuestionType, TemplateRow } from "@/actions/ai-survey-generation";
import { getMyTemplatesAction, deleteTemplateAction } from "@/actions/ai-survey-generation";
import type { SurveyDraft } from "@/types/survey";

const DRAFT_KEY = "opinflow:client-survey-draft:v1";

type Tab = "manual" | "ai" | "templates";
type AIStep = "form" | "review";

type Props = {
  balance: number;
  commissionRate: number;
  minReward: number;
  userName?: string | null;
  userEmail?: string | null;
};

// Converts a template's Question[] to GeneratedSurveyDraft for AIDraftReview
function templateToGeneratedDraft(name: string, questions: TemplateRow["questions"]): GeneratedSurveyDraft {
  const allowedTypes: AiQuestionType[] = [
    "SINGLE_CHOICE", "MULTIPLE_CHOICE", "SCALE", "RANKING", "OPEN_TEXT",
  ];
  return {
    title: name,
    questions: questions
      .filter((q) => allowedTypes.includes(q.type as AiQuestionType))
      .map((q) => ({
        text: q.title,
        type: q.type as AiQuestionType,
        options: q.options.length > 0 ? q.options : undefined,
        isRequired: q.required,
      })),
    targetingRecommendation: "",
  };
}

export default function SurveyCreateTabs({ balance, commissionRate, minReward, userName, userEmail }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("manual");
  const [aiStep, setAiStep] = useState<AIStep>("form");
  const [aiGeneratedDraft, setAiGeneratedDraft] = useState<GeneratedSurveyDraft | null>(null);
  const [reviewSource, setReviewSource] = useState<"ai" | "template">("ai");

  // SurveyBuilder remount key — incrementing forces re-mount + localStorage re-read
  const [builderKey, setBuilderKey] = useState(0);

  // Templates
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [templatesLoaded, setTemplatesLoaded] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [, startDeleteTransition] = useTransition();

  function loadTemplates() {
    getMyTemplatesAction().then((rows) => {
      setTemplates(rows);
      setTemplatesLoaded(true);
    });
  }

  useEffect(() => {
    if (activeTab === "templates" && !templatesLoaded) {
      loadTemplates();
    }
  }, [activeTab, templatesLoaded]);

  // ── AI generation flow ───────────────────────────────────────────────────

  function handleAISuccess(draft: GeneratedSurveyDraft) {
    setAiGeneratedDraft(draft);
    setReviewSource("ai");
    setAiStep("review");
  }

  // ── Template selection flow ──────────────────────────────────────────────

  function handleTemplateSelect(template: TemplateRow) {
    const genDraft = templateToGeneratedDraft(template.name, template.questions);
    setAiGeneratedDraft(genDraft);
    setReviewSource("template");
    setAiStep("review");
    setActiveTab("ai");
  }

  function handleDeleteTemplate(id: string) {
    setIsDeletingId(id);
    startDeleteTransition(async () => {
      await deleteTemplateAction(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      setIsDeletingId(null);
    });
  }

  // ── Confirm draft → write to localStorage → remount SurveyBuilder ────────

  function handleDraftConfirm(surveyDraft: SurveyDraft) {
    // AIDraftReview already wrote to localStorage; we just force SurveyBuilder remount
    setBuilderKey((k) => k + 1);
    setActiveTab("manual");
    setAiStep("form");
    setAiGeneratedDraft(null);
  }

  // ── Tab navigation ───────────────────────────────────────────────────────

  function goTab(tab: Tab) {
    setActiveTab(tab);
    if (tab !== "ai") {
      setAiStep("form");
    }
  }

  const showTabs = !(activeTab === "ai" && aiStep === "review");

  const TAB_ITEMS: { id: Tab; label: string }[] = [
    { id: "manual", label: "Создать вручную" },
    { id: "ai", label: "✦ Создать с ИИ" },
    { id: "templates", label: "Из шаблона" },
  ];

  return (
    <div>
      {/* Tab bar */}
      {showTabs && (
        <div className="mb-6 flex flex-wrap gap-1 rounded-2xl border border-site-border bg-site-section p-1 sm:w-fit">
          {TAB_ITEMS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => goTab(t.id)}
              className={`rounded-xl px-5 py-2.5 text-sm font-medium transition-colors ${
                activeTab === t.id
                  ? "bg-white text-site-heading shadow-sm dark:bg-site-card"
                  : "text-site-muted hover:text-site-heading"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Manual tab — key forces remount when AI draft is confirmed */}
      {activeTab === "manual" && (
        <SurveyBuilder
          key={`builder-${builderKey}`}
          balance={balance}
          commissionRate={commissionRate}
          minReward={minReward}
          userName={userName}
          userEmail={userEmail}
        />
      )}

      {/* AI tab */}
      {activeTab === "ai" && (
        <>
          {aiStep === "form" && (
            <AIGenerationForm balance={balance} onSuccess={handleAISuccess} />
          )}
          {aiStep === "review" && aiGeneratedDraft && (
            <AIDraftReview
              draft={aiGeneratedDraft}
              fromTemplate={reviewSource === "template"}
              onConfirm={handleDraftConfirm}
              onBack={() => {
                setAiStep("form");
                if (reviewSource === "template") setActiveTab("templates");
              }}
            />
          )}
        </>
      )}

      {/* Templates tab */}
      {activeTab === "templates" && (
        <div className="mx-auto max-w-2xl">
          {!templatesLoaded ? (
            <div className="flex items-center gap-2 text-sm text-site-muted">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Загружаем шаблоны…
            </div>
          ) : templates.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-site-border bg-site-section p-10 text-center">
              <p className="text-sm font-medium text-site-heading">Шаблонов пока нет</p>
              <p className="mt-2 text-sm text-site-muted">
                Создайте опрос с помощью ИИ, отредактируйте вопросы и сохраните как шаблон —
                тогда сможете быстро запускать похожие опросы без повторной генерации.
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
              <p className="text-sm text-site-muted">{templates.length} шаблон{templates.length === 1 ? "" : templates.length < 5 ? "а" : "ов"}</p>
              {templates.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 rounded-2xl border border-site-border bg-site-card p-4"
                >
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-semibold text-site-heading">{t.name}</p>
                    <p className="mt-0.5 text-xs text-site-muted">
                      {t.questions.length} вопрос{t.questions.length === 1 ? "" : t.questions.length < 5 ? "а" : "ов"} ·{" "}
                      {new Date(t.createdAt).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => handleTemplateSelect(t)}
                      className="rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-brand-dark"
                    >
                      Использовать
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTemplate(t.id)}
                      disabled={isDeletingId === t.id}
                      className="rounded-lg border border-site-border px-3 py-2 text-xs text-site-muted hover:border-red-300 hover:text-red-500 disabled:opacity-40"
                      aria-label="Удалить шаблон"
                    >
                      {isDeletingId === t.id ? "…" : "✕"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
