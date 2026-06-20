"use client";

import { useState, useEffect, useTransition } from "react";
import SurveyBuilder from "@/components/survey-builder/SurveyBuilder";
import AIGenerationForm from "@/components/survey-builder/AIGenerationForm";
import AIDraftReview from "@/components/survey-builder/AIDraftReview";
import AISurveySettings from "@/components/survey-builder/AISurveySettings";
import type { GeneratedSurveyDraft, AiQuestionType, TemplateRow } from "@/actions/ai-survey-generation";
import { getMyTemplatesAction, deleteTemplateAction } from "@/actions/ai-survey-generation";
import type { Question } from "@/types/survey";

type Tab = "manual" | "ai" | "templates";
type AIStep = "form" | "review" | "settings";

type Props = {
  balance: number;
  commissionRate: number;
  minReward: number;
  userName?: string | null;
  userEmail?: string | null;
};

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

export default function SurveyCreateTabs({ balance, commissionRate, minReward, userName, userEmail }: Props) {
  const [tab, setTab] = useState<Tab>("manual");
  const [aiStep, setAiStep] = useState<AIStep>("form");
  const [aiDraft, setAiDraft] = useState<GeneratedSurveyDraft | null>(null);
  const [fromTemplate, setFromTemplate] = useState(false);
  const [aiCharged, setAiCharged] = useState(false);

  // Data passed from review → settings
  const [settingsTitle, setSettingsTitle] = useState("");
  const [settingsQuestions, setSettingsQuestions] = useState<Question[]>([]);

  // Templates
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

  // ── AI wizard handlers ───────────────────────────────────────────────────

  function onAISuccess(draft: GeneratedSurveyDraft) {
    setAiDraft(draft);
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

  // ── Tab navigation ───────────────────────────────────────────────────────

  function goTab(t: Tab) {
    setTab(t);
    if (t !== "ai") setAiStep("form");
  }

  const showTabs = !(tab === "ai" && (aiStep === "review" || aiStep === "settings"));
  const effectiveBalance = balance - (aiCharged ? 50 : 0);

  return (
    <div>
      {/* Tab switcher */}
      {showTabs && (
        <div className="mb-6 flex flex-wrap gap-1 rounded-2xl border border-site-border bg-site-section p-1 sm:w-fit">
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
                  ? "bg-white text-site-heading shadow-sm dark:bg-site-card"
                  : "text-site-muted hover:text-site-heading"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Manual tab ──────────────────────────────────────────────────── */}
      {tab === "manual" && (
        <SurveyBuilder
          balance={balance}
          commissionRate={commissionRate}
          minReward={minReward}
          userName={userName}
          userEmail={userEmail}
        />
      )}

      {/* ── AI wizard tab ───────────────────────────────────────────────── */}
      {tab === "ai" && (
        <>
          {aiStep === "form" && (
            <AIGenerationForm balance={balance} onSuccess={onAISuccess} />
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
            <AISurveySettings
              title={settingsTitle}
              questions={settingsQuestions}
              balance={effectiveBalance}
              commissionRate={commissionRate}
              minReward={minReward}
              onBack={onSettingsBack}
            />
          )}
        </>
      )}

      {/* ── Templates tab ───────────────────────────────────────────────── */}
      {tab === "templates" && (
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
              <p className="text-sm font-semibold text-site-heading">Шаблонов пока нет</p>
              <p className="mt-2 text-sm text-site-muted">
                Создайте опрос с ИИ, отредактируйте вопросы и нажмите «Сохранить как шаблон» —
                затем сможете быстро запускать похожие опросы.
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
              <p className="text-xs text-site-muted">
                {templates.length} шаблон{templates.length === 1 ? "" : templates.length < 5 ? "а" : "ов"}
              </p>
              {templates.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 rounded-2xl border border-site-border bg-site-card p-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-site-heading">{t.name}</p>
                    <p className="mt-0.5 text-xs text-site-muted">
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
                      className="rounded-lg border border-site-border px-3 py-2 text-xs text-site-muted hover:border-red-300 hover:text-red-500 disabled:opacity-40"
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
    </div>
  );
}
