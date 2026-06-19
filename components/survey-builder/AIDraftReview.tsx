"use client";

import { useState, useTransition } from "react";
import type { GeneratedSurveyDraft, GeneratedQuestion, AiQuestionType } from "@/actions/ai-survey-generation";
import { saveDraftAction } from "@/actions/surveys";
import { EMPTY_DRAFT, QUESTION_TYPE_LABELS, createEmptyQuestion } from "@/types/survey";
import type { SurveyDraft, Question } from "@/types/survey";

const AI_QUESTION_TYPE_LABELS: Record<AiQuestionType, string> = {
  SINGLE_CHOICE: "Одиночный выбор",
  MULTIPLE_CHOICE: "Множественный выбор",
  SCALE: "Шкала оценки",
  RANKING: "Ранжирование",
  OPEN_TEXT: "Открытый ответ",
};

type EditableQuestion = GeneratedQuestion & { id: string };

function getDefaultSettings(type: AiQuestionType): Record<string, unknown> {
  if (type === "SCALE") return { min: 1, max: 10, minLabel: "Совсем нет", maxLabel: "Определённо да" };
  if (type === "OPEN_TEXT") return { maxLength: 500, placeholder: "Введите ваш ответ..." };
  return {};
}

function aiQuestionToSurveyQuestion(q: EditableQuestion, index: number): Question {
  return {
    id: q.id,
    type: q.type,
    title: q.text,
    description: "",
    required: q.isRequired,
    mediaUrl: null,
    options: q.options ?? [],
    matrixRows: [],
    matrixCols: [],
    settings: getDefaultSettings(q.type),
    logic: [],
  };
}

function aiDraftToSurveyDraft(title: string, questions: EditableQuestion[]): SurveyDraft {
  return {
    ...EMPTY_DRAFT,
    title,
    questions: questions.map((q, i) => aiQuestionToSurveyQuestion(q, i)),
  };
}

type Props = {
  draft: GeneratedSurveyDraft;
  onConfirm: (surveyDraft: SurveyDraft) => void;
  onBack: () => void;
};

export default function AIDraftReview({ draft, onConfirm, onBack }: Props) {
  const [title, setTitle] = useState(draft.title);
  const [questions, setQuestions] = useState<EditableQuestion[]>(
    () => draft.questions.map((q) => ({ ...q, id: crypto.randomUUID() }))
  );
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isSaving, startSavingTransition] = useTransition();

  function moveUp(idx: number) {
    if (idx === 0) return;
    setQuestions((prev) => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  }

  function moveDown(idx: number) {
    setQuestions((prev) => {
      if (idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  }

  function deleteQuestion(idx: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateQuestion(idx: number, patch: Partial<EditableQuestion>) {
    setQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, ...patch } : q))
    );
  }

  function addOption(qIdx: number) {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx ? { ...q, options: [...(q.options ?? []), ""] } : q
      )
    );
  }

  function updateOption(qIdx: number, optIdx: number, value: string) {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx
          ? { ...q, options: (q.options ?? []).map((o, oi) => (oi === optIdx ? value : o)) }
          : q
      )
    );
  }

  function removeOption(qIdx: number, optIdx: number) {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx
          ? { ...q, options: (q.options ?? []).filter((_, oi) => oi !== optIdx) }
          : q
      )
    );
  }

  function addQuestion() {
    const newQ = createEmptyQuestion("SINGLE_CHOICE");
    setQuestions((prev) => [
      ...prev,
      { id: newQ.id, text: newQ.title, type: "SINGLE_CHOICE", options: newQ.options, isRequired: true },
    ]);
  }

  function handleTypeChange(idx: number, newType: AiQuestionType) {
    const needsOptions = ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "RANKING"].includes(newType);
    const currentQ = questions[idx];
    const hadOptions = currentQ.options && currentQ.options.length > 0;
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === idx
          ? {
              ...q,
              type: newType,
              options: needsOptions ? (hadOptions ? q.options : ["Вариант 1", "Вариант 2", "Вариант 3"]) : undefined,
            }
          : q
      )
    );
  }

  function handleSaveAsDraft() {
    setSaveStatus(null);
    startSavingTransition(async () => {
      const surveyDraft = aiDraftToSurveyDraft(title.trim() || "Без названия", questions);
      const result = await saveDraftAction(surveyDraft);
      if (result && "error" in result) {
        setSaveStatus(`Ошибка: ${result.error}`);
      } else {
        setSaveStatus("Черновик сохранён");
      }
    });
  }

  function handleContinue() {
    const surveyDraft = aiDraftToSurveyDraft(title.trim() || "Без названия", questions);
    onConfirm(surveyDraft);
  }

  const needsOptions = (type: AiQuestionType) =>
    ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "RANKING"].includes(type);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-site-muted hover:text-site-heading"
        >
          ← Назад
        </button>
        <span className="text-site-muted">|</span>
        <p className="text-sm text-site-muted">Сгенерировано ИИ · 50 ₽ списано</p>
      </div>

      {/* Targeting recommendation */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
          Рекомендация по аудитории
        </p>
        <p className="mt-1 text-sm text-blue-900">{draft.targetingRecommendation}</p>
      </div>

      {/* Survey title */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-site-heading">Название опроса</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-xl border border-site-border bg-site-section px-4 py-3 text-sm font-medium text-site-heading placeholder:text-site-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
      </div>

      {/* Questions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-site-heading">
            Вопросы ({questions.length})
          </p>
          <button
            onClick={addQuestion}
            className="rounded-lg border border-brand px-3 py-1.5 text-xs font-medium text-brand hover:bg-brand/5"
          >
            + Добавить вопрос
          </button>
        </div>

        {questions.map((q, idx) => (
          <div
            key={q.id}
            className="rounded-2xl border border-site-border bg-site-card p-4 shadow-sm"
          >
            <div className="flex items-start gap-3">
              {/* Order controls */}
              <div className="flex flex-col gap-1 pt-1">
                <button
                  onClick={() => moveUp(idx)}
                  disabled={idx === 0}
                  className="rounded p-0.5 text-site-muted hover:text-site-heading disabled:opacity-30"
                  title="Выше"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 15l-6-6-6 6" />
                  </svg>
                </button>
                <span className="text-center text-xs font-medium text-site-muted">{idx + 1}</span>
                <button
                  onClick={() => moveDown(idx)}
                  disabled={idx === questions.length - 1}
                  className="rounded p-0.5 text-site-muted hover:text-site-heading disabled:opacity-30"
                  title="Ниже"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
              </div>

              {/* Question content */}
              <div className="flex-1 space-y-3">
                {/* Question text */}
                <input
                  type="text"
                  value={q.text}
                  onChange={(e) => updateQuestion(idx, { text: e.target.value })}
                  placeholder="Текст вопроса"
                  className="w-full rounded-lg border border-site-border bg-site-section px-3 py-2 text-sm text-site-heading placeholder:text-site-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />

                {/* Type + Required */}
                <div className="flex items-center gap-3">
                  <select
                    value={q.type}
                    onChange={(e) => handleTypeChange(idx, e.target.value as AiQuestionType)}
                    className="flex-1 rounded-lg border border-site-border bg-site-section px-3 py-2 text-xs text-site-body focus:border-brand focus:outline-none"
                  >
                    {(Object.keys(AI_QUESTION_TYPE_LABELS) as AiQuestionType[]).map((t) => (
                      <option key={t} value={t}>
                        {AI_QUESTION_TYPE_LABELS[t]}
                      </option>
                    ))}
                  </select>
                  <label className="flex items-center gap-1.5 text-xs text-site-muted">
                    <input
                      type="checkbox"
                      checked={q.isRequired}
                      onChange={(e) => updateQuestion(idx, { isRequired: e.target.checked })}
                      className="h-3.5 w-3.5 rounded accent-brand"
                    />
                    Обязательный
                  </label>
                </div>

                {/* Options (for choice/ranking types) */}
                {needsOptions(q.type) && (
                  <div className="space-y-2">
                    {(q.options ?? []).map((opt, optIdx) => (
                      <div key={optIdx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => updateOption(idx, optIdx, e.target.value)}
                          placeholder={`Вариант ${optIdx + 1}`}
                          className="flex-1 rounded-lg border border-site-border bg-site-section px-3 py-1.5 text-xs text-site-body placeholder:text-site-muted focus:border-brand focus:outline-none"
                        />
                        <button
                          onClick={() => removeOption(idx, optIdx)}
                          disabled={(q.options ?? []).length <= 2}
                          className="text-site-muted hover:text-red-500 disabled:opacity-30"
                          title="Удалить вариант"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addOption(idx)}
                      className="text-xs text-brand hover:underline"
                    >
                      + Добавить вариант
                    </button>
                  </div>
                )}
              </div>

              {/* Delete question */}
              <button
                onClick={() => deleteQuestion(idx)}
                disabled={questions.length <= 1}
                className="mt-1 text-site-muted hover:text-red-500 disabled:opacity-30"
                title="Удалить вопрос"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer actions */}
      <div className="flex flex-col gap-3 border-t border-site-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveAsDraft}
            disabled={isSaving}
            className="rounded-xl border border-site-border px-4 py-2.5 text-sm font-medium text-site-heading hover:bg-site-section disabled:opacity-60"
          >
            {isSaving ? "Сохраняем…" : "Сохранить как черновик"}
          </button>
          {saveStatus && (
            <span
              className={`text-xs ${saveStatus.startsWith("Ошибка") ? "text-red-500" : "text-green-600"}`}
            >
              {saveStatus}
            </span>
          )}
        </div>
        <button
          onClick={handleContinue}
          className="rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Продолжить к настройке опроса →
        </button>
      </div>
    </div>
  );
}
