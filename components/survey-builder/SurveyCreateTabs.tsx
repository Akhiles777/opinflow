"use client";

import { useState } from "react";
import SurveyBuilder from "@/components/survey-builder/SurveyBuilder";
import AIGenerationForm from "@/components/survey-builder/AIGenerationForm";
import AIDraftReview from "@/components/survey-builder/AIDraftReview";
import type { GeneratedSurveyDraft } from "@/actions/ai-survey-generation";
import type { SurveyDraft } from "@/types/survey";

type Tab = "manual" | "ai";
type AIStep = "form" | "review";

type Props = {
  balance: number;
  commissionRate: number;
  minReward: number;
  userName?: string | null;
  userEmail?: string | null;
};

export default function SurveyCreateTabs({
  balance,
  commissionRate,
  minReward,
  userName,
  userEmail,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("manual");
  const [aiStep, setAiStep] = useState<AIStep>("form");
  const [aiGeneratedDraft, setAiGeneratedDraft] = useState<GeneratedSurveyDraft | null>(null);
  const [initialDraft, setInitialDraft] = useState<SurveyDraft | undefined>(undefined);

  function handleAISuccess(draft: GeneratedSurveyDraft) {
    setAiGeneratedDraft(draft);
    setAiStep("review");
  }

  function handleAIDraftConfirm(surveyDraft: SurveyDraft) {
    setInitialDraft(surveyDraft);
    setActiveTab("manual");
    setAiStep("form");
    setAiGeneratedDraft(null);
  }

  function handleTabChange(tab: Tab) {
    setActiveTab(tab);
    if (tab === "ai") {
      setAiStep("form");
    }
  }

  return (
    <div>
      {/* Tab switcher — hidden during AI review */}
      {!(activeTab === "ai" && aiStep === "review") && (
        <div className="mb-6 flex gap-1 rounded-2xl border border-site-border bg-site-section p-1 sm:w-fit">
          <button
            onClick={() => handleTabChange("manual")}
            className={`rounded-xl px-5 py-2.5 text-sm font-medium transition-colors ${
              activeTab === "manual"
                ? "bg-white text-site-heading shadow-sm dark:bg-site-card"
                : "text-site-muted hover:text-site-heading"
            }`}
          >
            Создать вручную
          </button>
          <button
            onClick={() => handleTabChange("ai")}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-colors ${
              activeTab === "ai"
                ? "bg-white text-site-heading shadow-sm dark:bg-site-card"
                : "text-site-muted hover:text-site-heading"
            }`}
          >
            <svg className="h-4 w-4 text-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            Создать с помощью ИИ
          </button>
        </div>
      )}

      {/* Manual tab — remount key forces re-init when initialDraft changes */}
      {activeTab === "manual" && (
        <SurveyBuilder
          key={initialDraft ? `ai-${initialDraft.title}` : "manual"}
          balance={balance}
          commissionRate={commissionRate}
          minReward={minReward}
          userName={userName}
          userEmail={userEmail}
          initialDraft={initialDraft}
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
              onConfirm={handleAIDraftConfirm}
              onBack={() => setAiStep("form")}
            />
          )}
        </>
      )}
    </div>
  );
}
