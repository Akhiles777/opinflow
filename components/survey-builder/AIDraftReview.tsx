"use client";

import { useState, useTransition, useRef } from "react";
import type { GeneratedSurveyDraft, AiQuestionType } from "@/actions/ai-survey-generation";
import { saveAsTemplateAction } from "@/actions/ai-survey-generation";
import type { Question } from "@/types/survey";
import { AIWizardProgress } from "@/components/survey-builder/AISurveySettings";

const TYPE_LABELS: Record<AiQuestionType, string> = {
  SINGLE_CHOICE: "Одиночный выбор",
  MULTIPLE_CHOICE: "Множественный выбор",
  SCALE: "Шкала оценки",
  RANKING: "Ранжирование",
  OPEN_TEXT: "Открытый ответ",
};

const NEEDS_OPTIONS: AiQuestionType[] = ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "RANKING"];

type DraftQ = {
  id: string;
  text: string;
  type: AiQuestionType;
  options: string[];
  required: boolean;
};

function makeId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function getDefaultOptions(type: AiQuestionType): string[] {
  if (NEEDS_OPTIONS.includes(type)) return ["Вариант 1", "Вариант 2", "Вариант 3"];
  return [];
}

function getDefaultSettings(type: AiQuestionType): Record<string, unknown> {
  if (type === "SCALE") return { min: 1, max: 10, minLabel: "Совсем нет", maxLabel: "Определённо да" };
  if (type === "OPEN_TEXT") return { maxLength: 500, placeholder: "Введите ваш ответ..." };
  return {};
}

function toSurveyQuestion(q: DraftQ): Question {
  return {
    id: q.id,
    type: q.type,
    title: q.text,
    description: "",
    required: q.required,
    mediaUrl: null,
    options: NEEDS_OPTIONS.includes(q.type) ? q.options.filter(Boolean) : [],
    matrixRows: [],
    matrixCols: [],
    settings: getDefaultSettings(q.type),
    logic: [],
  };
}

type Props = {
  draft: GeneratedSurveyDraft;
  onConfirm: (title: string, questions: Question[]) => void;
  onBack: () => void;
  fromTemplate?: boolean;
  onTransferToManual?: (title: string, questions: Question[]) => void;
};

export default function AIDraftReview({ draft, onConfirm, onBack, fromTemplate, onTransferToManual }: Props) {
  const [title, setTitle] = useState(draft.title);
  const [questions, setQuestions] = useState<DraftQ[]>(() =>
    draft.questions.map((q) => ({
      id: makeId(),
      text: q.text,
      type: q.type,
      options: q.options && q.options.length > 0 ? [...q.options] : getDefaultOptions(q.type),
      required: q.isRequired,
    }))
  );

  // Sentinel ref — we scroll to it after adding a question
  const listEndRef = useRef<HTMLDivElement>(null);

  // Template save state
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState(draft.title);
  const [templateStatus, setTemplateStatus] = useState<string | null>(null);
  const [isSavingTemplate, startSaveTransition] = useTransition();
  const templateInputRef = useRef<HTMLInputElement>(null);

  // ── Question mutators ────────────────────────────────────────────────────

  function setText(idx: number, value: string) {
    setQuestions((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], text: value };
      return next;
    });
  }

  function setType(idx: number, newType: AiQuestionType) {
    setQuestions((prev) => {
      const next = [...prev];
      const q = next[idx];
      const hadOptions = q.options.length > 0;
      next[idx] = {
        ...q,
        type: newType,
        options: NEEDS_OPTIONS.includes(newType)
          ? hadOptions ? q.options : getDefaultOptions(newType)
          : [],
      };
      return next;
    });
  }

  function setRequired(idx: number, value: boolean) {
    setQuestions((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], required: value };
      return next;
    });
  }

  function setOption(qIdx: number, optIdx: number, value: string) {
    setQuestions((prev) => {
      const next = [...prev];
      const opts = [...next[qIdx].options];
      opts[optIdx] = value;
      next[qIdx] = { ...next[qIdx], options: opts };
      return next;
    });
  }

  function addOption(qIdx: number) {
    setQuestions((prev) => {
      const next = [...prev];
      const opts = [...next[qIdx].options, ""];
      next[qIdx] = { ...next[qIdx], options: opts };
      return next;
    });
  }

  function removeOption(qIdx: number, optIdx: number) {
    setQuestions((prev) => {
      const next = [...prev];
      const opts = next[qIdx].options.filter((_, i) => i !== optIdx);
      next[qIdx] = { ...next[qIdx], options: opts };
      return next;
    });
  }

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

  function addQuestion() {
    setQuestions((prev) => [
      ...prev,
      {
        id: makeId(),
        text: "",
        type: "SINGLE_CHOICE",
        options: ["Вариант 1", "Вариант 2", "Вариант 3"],
        required: true,
      },
    ]);
    // Scroll to the sentinel div placed after the list — runs after React flushes the new item
    requestAnimationFrame(() => {
      listEndRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  // ── Template save ────────────────────────────────────────────────────────

  function openTemplateModal() {
    setTemplateName(title || "Шаблон опроса");
    setTemplateStatus(null);
    setShowTemplateModal(true);
    setTimeout(() => templateInputRef.current?.focus(), 50);
  }

  function handleSaveTemplate() {
    startSaveTransition(async () => {
      const surveyQuestions = questions.map(toSurveyQuestion);
      const result = await saveAsTemplateAction(templateName, surveyQuestions);
      if (result.success) {
        setTemplateStatus("✓ Шаблон сохранён");
        setTimeout(() => setShowTemplateModal(false), 1200);
      } else {
        setTemplateStatus(result.error);
      }
    });
  }

  // ── Continue to settings step ────────────────────────────────────────────

  function handleContinue() {
    onConfirm(title.trim() || "Без названия", questions.map(toSurveyQuestion));
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {/* Wizard progress */}
      {!fromTemplate && <AIWizardProgress step={2} />}

      {/* Back link */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-site-muted hover:text-site-heading"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
        {fromTemplate ? "Назад к шаблонам" : "Назад"}
      </button>

      {/* Targeting recommendation (AI-only) */}
      {!fromTemplate && draft.targetingRecommendation && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 dark:border-blue-900 dark:bg-blue-950/30">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
            Рекомендация ИИ по аудитории
          </p>
          <p className="mt-1 text-sm text-blue-900 dark:text-blue-200">{draft.targetingRecommendation}</p>
        </div>
      )}

      {/* Survey title */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-site-heading">
          Название опроса
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Название опроса"
          className="w-full rounded-xl border border-site-border bg-site-section px-4 py-3 text-sm text-site-heading placeholder:text-site-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
      </div>

      {/* Questions list */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-site-heading">Вопросы ({questions.length})</p>
          <button
            type="button"
            onClick={addQuestion}
            className="rounded-lg border border-brand px-3 py-1.5 text-xs font-medium text-brand hover:bg-brand/5"
          >
            + Добавить вопрос
          </button>
        </div>

        <div className="space-y-3">
          {questions.map((q, idx) => (
            <div
              key={q.id}
              className="rounded-2xl border border-site-border bg-site-card p-4"
            >
              <div className="flex gap-3">
                {/* Up/Down controls */}
                <div className="flex flex-col items-center gap-0.5 pt-1">
                  <button
                    type="button"
                    onClick={() => moveUp(idx)}
                    disabled={idx === 0}
                    className="rounded p-1 text-site-muted hover:text-site-heading disabled:opacity-25"
                    aria-label="Выше"
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M18 15l-6-6-6 6" />
                    </svg>
                  </button>
                  <span className="text-center text-xs font-semibold text-site-muted">{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => moveDown(idx)}
                    disabled={idx === questions.length - 1}
                    className="rounded p-1 text-site-muted hover:text-site-heading disabled:opacity-25"
                    aria-label="Ниже"
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                </div>

                {/* Question body */}
                <div className="flex-1 space-y-2.5">
                  {/* Text */}
                  <input
                    type="text"
                    value={q.text}
                    onChange={(e) => setText(idx, e.target.value)}
                    placeholder="Текст вопроса"
                    className="w-full rounded-lg border border-site-border bg-site-bg px-3 py-2 text-sm text-site-heading placeholder:text-site-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  />

                  {/* Type + Required */}
                  <div className="flex flex-wrap items-center gap-3">
                    <select
                      value={q.type}
                      onChange={(e) => setType(idx, e.target.value as AiQuestionType)}
                      className="rounded-lg border border-site-border bg-site-bg px-3 py-1.5 text-xs text-site-body focus:border-brand focus:outline-none"
                    >
                      {(Object.keys(TYPE_LABELS) as AiQuestionType[]).map((t) => (
                        <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                      ))}
                    </select>
                    <label className="flex cursor-pointer items-center gap-1.5 text-xs text-site-muted">
                      <input
                        type="checkbox"
                        checked={q.required}
                        onChange={(e) => setRequired(idx, e.target.checked)}
                        className="h-3.5 w-3.5 cursor-pointer rounded accent-brand"
                      />
                      Обязательный
                    </label>
                  </div>

                  {/* Options */}
                  {NEEDS_OPTIONS.includes(q.type) && (
                    <div className="space-y-1.5 pl-1">
                      {q.options.map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-2">
                          <span className="text-xs text-site-muted">{optIdx + 1}.</span>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => setOption(idx, optIdx, e.target.value)}
                            placeholder={`Вариант ${optIdx + 1}`}
                            className="flex-1 rounded-lg border border-site-border bg-site-bg px-3 py-1.5 text-xs text-site-body placeholder:text-site-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                          />
                          <button
                            type="button"
                            onClick={() => removeOption(idx, optIdx)}
                            disabled={q.options.length <= 2}
                            className="p-1 text-site-muted hover:text-red-500 disabled:opacity-25"
                            aria-label="Удалить вариант"
                          >
                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
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
                  type="button"
                  onClick={() => deleteQuestion(idx)}
                  disabled={questions.length <= 1}
                  className="mt-1 shrink-0 p-1 text-site-muted hover:text-red-500 disabled:opacity-25"
                  aria-label="Удалить вопрос"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
          {/* Sentinel — scrollIntoView target after adding a question */}
          <div ref={listEndRef} />
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-3 border-t border-site-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={openTemplateModal}
            className="rounded-xl border border-site-border px-4 py-2.5 text-sm font-medium text-site-heading hover:bg-site-section"
          >
            Сохранить как шаблон
          </button>
          {onTransferToManual && (
            <button
              type="button"
              onClick={() => onTransferToManual(title.trim() || "Без названия", questions.map(toSurveyQuestion))}
              title="Перенести все вопросы в ручной конструктор для детальной настройки"
              className="rounded-xl border border-site-border px-4 py-2.5 text-sm font-medium text-site-muted hover:bg-site-section hover:text-site-heading"
            >
              Открыть в конструкторе
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={handleContinue}
          className="rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Далее: параметры опроса →
        </button>
      </div>

      {/* Template name modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-site-card p-6 shadow-xl">
            <h3 className="text-base font-semibold text-site-heading">Сохранить как шаблон</h3>
            <p className="mt-1 text-sm text-site-muted">
              Шаблон сохранит вопросы. Вы сможете создавать новые опросы на его основе.
            </p>
            <input
              ref={templateInputRef}
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Название шаблона"
              className="mt-4 w-full rounded-xl border border-site-border bg-site-section px-4 py-2.5 text-sm text-site-heading placeholder:text-site-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              onKeyDown={(e) => { if (e.key === "Enter") handleSaveTemplate(); }}
            />
            {templateStatus && (
              <p className={`mt-2 text-xs ${templateStatus.startsWith("✓") ? "text-green-600" : "text-red-500"}`}>
                {templateStatus}
              </p>
            )}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setShowTemplateModal(false)}
                className="flex-1 rounded-xl border border-site-border py-2.5 text-sm font-medium text-site-muted hover:text-site-heading"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleSaveTemplate}
                disabled={isSavingTemplate || !templateName.trim()}
                className="flex-1 rounded-xl bg-brand py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
              >
                {isSavingTemplate ? "Сохраняем…" : "Сохранить"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
