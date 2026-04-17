"use client";

import { useMemo, useState, useTransition } from "react";
import { DndContext, PointerSensor, closestCenter, type DragEndEvent, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { uploadSurveyMediaAction } from "@/actions/surveys";
import {
  createEmptyQuestion,
  QUESTION_TYPE_LABELS,
  type LogicRule,
  type Question,
  type QuestionType,
} from "@/types/survey";

type Props = {
  questions: Question[];
  onChange: (questions: Question[]) => void;
};

const QUESTION_TYPES: QuestionType[] = [
  "SINGLE_CHOICE",
  "MULTIPLE_CHOICE",
  "SCALE",
  "MATRIX",
  "RANKING",
  "OPEN_TEXT",
];

const OPERATOR_OPTIONS: Array<{ value: LogicRule["operator"]; label: string }> = [
  { value: "equals", label: "равно" },
  { value: "not_equals", label: "не равно" },
  { value: "contains", label: "содержит" },
];

const ACTION_OPTIONS: Array<{ value: LogicRule["action"]; label: string }> = [
  { value: "show", label: "Показать вопрос" },
  { value: "hide", label: "Скрыть вопрос" },
];

function arrayReplace(list: string[], index: number, value: string) {
  return list.map((item, currentIndex) => (currentIndex === index ? value : item));
}

function trimEmpty(list: string[]) {
  return list.map((item) => item.trim()).filter(Boolean);
}

function normalizeLogicOrder(questions: Question[]) {
  return questions.map((question, index) => {
    const previousIds = new Set(questions.slice(0, index).map((item) => item.id));
    return {
      ...question,
      logic: question.logic.filter((rule) => previousIds.has(rule.ifQuestionId)),
    };
  });
}

function getQuestionValueSuggestions(question: Question | undefined) {
  if (!question) return [] as string[];

  if (question.type === "MATRIX") {
    return trimEmpty(question.matrixCols);
  }

  return trimEmpty(question.options);
}

function Toggle({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "relative h-6 w-10 rounded-full transition-colors",
        active ? "bg-brand" : "bg-dash-border",
      ].join(" ")}
    >
      <span
        className={[
          "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform",
          active ? "translate-x-4" : "translate-x-0",
        ].join(" ")}
      />
    </button>
  );
}

function SortableQuestionCard({
  question,
  expanded,
  previousQuestions,
  onToggle,
  onDelete,
  onUpdate,
}: {
  question: Question;
  expanded: boolean;
  previousQuestions: Question[];
  onToggle: () => void;
  onDelete: () => void;
  onUpdate: (patch: Partial<Question>) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: question.id });
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, startUploadTransition] = useTransition();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  function updateLogicRule(index: number, patch: Partial<LogicRule>) {
    onUpdate({
      logic: question.logic.map((rule, currentIndex) => (currentIndex === index ? { ...rule, ...patch } : rule)),
    });
  }

  function addLogicRule() {
    if (previousQuestions.length === 0) {
      setUploadError("Сначала добавьте хотя бы один предыдущий вопрос для настройки логики.");
      return;
    }

    const sourceQuestion = previousQuestions[previousQuestions.length - 1];
    const suggestions = getQuestionValueSuggestions(sourceQuestion);

    setUploadError(null);
    onUpdate({
      logic: [
        ...question.logic,
        {
          ifQuestionId: sourceQuestion.id,
          operator: "equals",
          value: suggestions[0] ?? "",
          action: "show",
        },
      ],
    });
  }

  function removeLogicRule(index: number) {
    onUpdate({ logic: question.logic.filter((_, currentIndex) => currentIndex !== index) });
  }

  function handleMediaUpload(file: File | null) {
    if (!file) return;

    setUploadError(null);
    startUploadTransition(async () => {
      const formData = new FormData();
      formData.append("file", file);
      const result = await uploadSurveyMediaAction(formData);

      if (result.error || !result.success) {
        setUploadError(result.error ?? "Не удалось загрузить изображение");
        return;
      }

      onUpdate({ mediaUrl: result.url });
    });
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        "rounded-2xl border border-dash-border bg-dash-card p-5 transition-shadow",
        expanded ? "shadow-md" : "hover:shadow-sm",
        isDragging ? "opacity-80" : "opacity-100",
      ].join(" ")}
    >
      <div className="flex items-start gap-4">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="mt-1 rounded-lg border border-dash-border bg-dash-bg px-2 py-1 text-base text-dash-muted"
          aria-label="Перетащить вопрос"
        >
          ⠿
        </button>

        <button type="button" onClick={onToggle} className="min-w-0 flex-1 text-left">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
            {QUESTION_TYPE_LABELS[question.type]}
          </div>
          <div className="mt-2 font-semibold text-dash-heading">
            {question.title.trim() || "Новый вопрос без заголовка"}
          </div>
          {question.description ? <div className="mt-1 text-sm text-dash-muted">{question.description}</div> : null}
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            {question.mediaUrl ? (
              <span className="rounded-full border border-brand/20 bg-brand/10 px-3 py-1 font-semibold text-brand">
                Есть изображение
              </span>
            ) : null}
            {question.logic.length > 0 ? (
              <span className="rounded-full border border-dash-border bg-dash-bg px-3 py-1 font-semibold text-dash-muted">
                {question.logic.length} правил логики
              </span>
            ) : null}
          </div>
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
        >
          Удалить
        </button>
      </div>

      {expanded ? (
        <div className="mt-6 grid gap-5 border-t border-dash-border pt-5">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-dash-muted">Текст вопроса</span>
            <input
              value={question.title}
              onChange={(event) => onUpdate({ title: event.target.value })}
              className="h-12 rounded-xl border border-dash-border bg-dash-bg px-4 text-base text-dash-body outline-none transition-colors focus:border-brand/40"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-dash-muted">Описание</span>
            <input
              value={question.description}
              onChange={(event) => onUpdate({ description: event.target.value })}
              className="h-12 rounded-xl border border-dash-border bg-dash-bg px-4 text-base text-dash-body outline-none transition-colors focus:border-brand/40"
            />
          </label>

          <div className="grid gap-3 rounded-2xl border border-dash-border bg-dash-bg p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-medium text-dash-heading">Изображение к вопросу</div>
                <div className="text-sm text-dash-muted">JPG, PNG или WEBP до 5 МБ. Подойдёт для карточек, упаковки или скриншотов.</div>
              </div>
              {question.mediaUrl ? (
                <button
                  type="button"
                  onClick={() => onUpdate({ mediaUrl: null })}
                  className="rounded-xl border border-dash-border bg-dash-card px-3 py-2 text-sm font-semibold text-dash-heading transition-colors hover:text-red-500"
                >
                  Удалить
                </button>
              ) : null}
            </div>

            {question.mediaUrl ? (
              <img src={question.mediaUrl} alt="Медиа вопроса" className="max-h-72 w-full rounded-2xl border border-dash-border object-cover" />
            ) : null}

            <label className="flex cursor-pointer items-center justify-center rounded-2xl border border-dashed border-dash-border bg-dash-card px-4 py-4 text-sm font-semibold text-dash-heading transition-colors hover:border-brand/30 hover:text-brand">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(event) => handleMediaUpload(event.target.files?.[0] ?? null)}
              />
              {isUploading ? "Загружаем изображение..." : question.mediaUrl ? "Заменить изображение" : "Загрузить изображение"}
            </label>
          </div>

          {(question.type === "SINGLE_CHOICE" || question.type === "MULTIPLE_CHOICE" || question.type === "RANKING") ? (
            <div className="grid gap-3">
              <div className="text-sm font-medium text-dash-muted">Варианты ответа</div>
              {question.options.map((option, index) => (
                <div key={`${question.id}-option-${index}`} className="flex items-center gap-3">
                  <input
                    value={option}
                    onChange={(event) => onUpdate({ options: arrayReplace(question.options, index, event.target.value) })}
                    className="h-11 flex-1 rounded-xl border border-dash-border bg-dash-bg px-4 text-base text-dash-body outline-none transition-colors focus:border-brand/40"
                  />
                  <button
                    type="button"
                    onClick={() => onUpdate({ options: question.options.filter((_, itemIndex) => itemIndex !== index) })}
                    className="rounded-xl border border-dash-border bg-dash-bg px-3 py-2 text-sm font-semibold text-dash-muted transition-colors hover:text-dash-heading"
                  >
                    Удалить
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => onUpdate({ options: [...question.options, `Вариант ${question.options.length + 1}`] })}
                className="w-fit rounded-xl border border-dash-border bg-dash-bg px-4 py-2 text-sm font-semibold text-dash-heading transition-colors hover:border-brand/30 hover:text-brand"
              >
                Добавить вариант
              </button>
            </div>
          ) : null}

          {question.type === "SCALE" ? (
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-dash-muted">Минимум</span>
                <input
                  type="number"
                  value={Number(question.settings.min ?? 1)}
                  onChange={(event) => onUpdate({ settings: { ...question.settings, min: Number(event.target.value) } })}
                  className="h-11 rounded-xl border border-dash-border bg-dash-bg px-4 text-base text-dash-body outline-none focus:border-brand/40"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium text-dash-muted">Максимум</span>
                <input
                  type="number"
                  value={Number(question.settings.max ?? 10)}
                  onChange={(event) => onUpdate({ settings: { ...question.settings, max: Number(event.target.value) } })}
                  className="h-11 rounded-xl border border-dash-border bg-dash-bg px-4 text-base text-dash-body outline-none focus:border-brand/40"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium text-dash-muted">Подпись слева</span>
                <input
                  value={String(question.settings.minLabel ?? "")}
                  onChange={(event) => onUpdate({ settings: { ...question.settings, minLabel: event.target.value } })}
                  className="h-11 rounded-xl border border-dash-border bg-dash-bg px-4 text-base text-dash-body outline-none focus:border-brand/40"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium text-dash-muted">Подпись справа</span>
                <input
                  value={String(question.settings.maxLabel ?? "")}
                  onChange={(event) => onUpdate({ settings: { ...question.settings, maxLabel: event.target.value } })}
                  className="h-11 rounded-xl border border-dash-border bg-dash-bg px-4 text-base text-dash-body outline-none focus:border-brand/40"
                />
              </label>
            </div>
          ) : null}

          {question.type === "MATRIX" ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="grid gap-3">
                <div className="text-sm font-medium text-dash-muted">Строки матрицы</div>
                {question.matrixRows.map((row, index) => (
                  <div key={`${question.id}-row-${index}`} className="flex items-center gap-3">
                    <input
                      value={row}
                      onChange={(event) => onUpdate({ matrixRows: arrayReplace(question.matrixRows, index, event.target.value) })}
                      className="h-11 flex-1 rounded-xl border border-dash-border bg-dash-bg px-4 text-base text-dash-body outline-none focus:border-brand/40"
                    />
                    <button
                      type="button"
                      onClick={() => onUpdate({ matrixRows: question.matrixRows.filter((_, currentIndex) => currentIndex !== index) })}
                      className="rounded-xl border border-dash-border bg-dash-bg px-3 py-2 text-sm font-semibold text-dash-muted transition-colors hover:text-dash-heading"
                    >
                      Удалить
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => onUpdate({ matrixRows: [...question.matrixRows, `Критерий ${question.matrixRows.length + 1}`] })}
                  className="w-fit rounded-xl border border-dash-border bg-dash-bg px-4 py-2 text-sm font-semibold text-dash-heading transition-colors hover:border-brand/30 hover:text-brand"
                >
                  Добавить строку
                </button>
              </div>
              <div className="grid gap-3">
                <div className="text-sm font-medium text-dash-muted">Столбцы матрицы</div>
                {question.matrixCols.map((column, index) => (
                  <div key={`${question.id}-col-${index}`} className="flex items-center gap-3">
                    <input
                      value={column}
                      onChange={(event) => onUpdate({ matrixCols: arrayReplace(question.matrixCols, index, event.target.value) })}
                      className="h-11 flex-1 rounded-xl border border-dash-border bg-dash-bg px-4 text-base text-dash-body outline-none focus:border-brand/40"
                    />
                    <button
                      type="button"
                      onClick={() => onUpdate({ matrixCols: question.matrixCols.filter((_, currentIndex) => currentIndex !== index) })}
                      className="rounded-xl border border-dash-border bg-dash-bg px-3 py-2 text-sm font-semibold text-dash-muted transition-colors hover:text-dash-heading"
                    >
                      Удалить
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => onUpdate({ matrixCols: [...question.matrixCols, `Оценка ${question.matrixCols.length + 1}`] })}
                  className="w-fit rounded-xl border border-dash-border bg-dash-bg px-4 py-2 text-sm font-semibold text-dash-heading transition-colors hover:border-brand/30 hover:text-brand"
                >
                  Добавить столбец
                </button>
              </div>
            </div>
          ) : null}

          {question.type === "OPEN_TEXT" ? (
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-dash-muted">Максимум символов</span>
                <input
                  type="number"
                  value={Number(question.settings.maxLength ?? 500)}
                  onChange={(event) => onUpdate({ settings: { ...question.settings, maxLength: Number(event.target.value) } })}
                  className="h-11 rounded-xl border border-dash-border bg-dash-bg px-4 text-base text-dash-body outline-none focus:border-brand/40"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium text-dash-muted">Placeholder</span>
                <input
                  value={String(question.settings.placeholder ?? "")}
                  onChange={(event) => onUpdate({ settings: { ...question.settings, placeholder: event.target.value } })}
                  className="h-11 rounded-xl border border-dash-border bg-dash-bg px-4 text-base text-dash-body outline-none focus:border-brand/40"
                />
              </label>
            </div>
          ) : null}

          <div className="grid gap-4 rounded-2xl border border-dash-border bg-dash-bg p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="font-medium text-dash-heading">Условная логика</div>
                <div className="text-sm text-dash-muted">Можно показать или скрыть вопрос в зависимости от ответа на один из предыдущих.</div>
              </div>
              <button
                type="button"
                onClick={addLogicRule}
                className="rounded-xl border border-dash-border bg-dash-card px-4 py-2 text-sm font-semibold text-dash-heading transition-colors hover:border-brand/30 hover:text-brand"
              >
                Добавить правило
              </button>
            </div>

            {question.logic.length === 0 ? (
              <div className="rounded-xl border border-dash-border bg-dash-card px-4 py-3 text-sm text-dash-muted">
                Правила не добавлены. Этот вопрос будет идти в обычном порядке.
              </div>
            ) : (
              <div className="grid gap-3">
                {question.logic.map((rule, index) => {
                  const sourceQuestion = previousQuestions.find((item) => item.id === rule.ifQuestionId) ?? previousQuestions[0];
                  const valueSuggestions = getQuestionValueSuggestions(sourceQuestion);

                  return (
                    <div key={`${question.id}-logic-${index}`} className="rounded-2xl border border-dash-border bg-dash-card p-4">
                      <div className="grid gap-3 lg:grid-cols-[1.2fr_0.9fr_1fr_0.9fr_auto]">
                        <label className="grid gap-2">
                          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-dash-muted">Вопрос-источник</span>
                          <select
                            value={rule.ifQuestionId}
                            onChange={(event) => {
                              const nextSource = previousQuestions.find((item) => item.id === event.target.value);
                              const suggestions = getQuestionValueSuggestions(nextSource);
                              updateLogicRule(index, {
                                ifQuestionId: event.target.value,
                                value: suggestions[0] ?? rule.value,
                              });
                            }}
                            className="h-11 rounded-xl border border-dash-border bg-dash-bg px-4 text-sm text-dash-body outline-none focus:border-brand/40"
                          >
                            {previousQuestions.map((item, sourceIndex) => (
                              <option key={item.id} value={item.id}>
                                {sourceIndex + 1}. {item.title.trim() || QUESTION_TYPE_LABELS[item.type]}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="grid gap-2">
                          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-dash-muted">Оператор</span>
                          <select
                            value={rule.operator}
                            onChange={(event) => updateLogicRule(index, { operator: event.target.value as LogicRule["operator"] })}
                            className="h-11 rounded-xl border border-dash-border bg-dash-bg px-4 text-sm text-dash-body outline-none focus:border-brand/40"
                          >
                            {OPERATOR_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </label>

                        <label className="grid gap-2">
                          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-dash-muted">Значение</span>
                          <input
                            value={rule.value}
                            onChange={(event) => updateLogicRule(index, { value: event.target.value })}
                            list={`${question.id}-logic-values-${index}`}
                            className="h-11 rounded-xl border border-dash-border bg-dash-bg px-4 text-sm text-dash-body outline-none focus:border-brand/40"
                            placeholder="Например: Да"
                          />
                          {valueSuggestions.length > 0 ? (
                            <datalist id={`${question.id}-logic-values-${index}`}>
                              {valueSuggestions.map((item) => (
                                <option key={item} value={item} />
                              ))}
                            </datalist>
                          ) : null}
                        </label>

                        <label className="grid gap-2">
                          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-dash-muted">Действие</span>
                          <select
                            value={rule.action}
                            onChange={(event) => updateLogicRule(index, { action: event.target.value as LogicRule["action"] })}
                            className="h-11 rounded-xl border border-dash-border bg-dash-bg px-4 text-sm text-dash-body outline-none focus:border-brand/40"
                          >
                            {ACTION_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </label>

                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() => removeLogicRule(index)}
                            className="h-11 rounded-xl border border-dash-border bg-dash-bg px-4 text-sm font-semibold text-dash-muted transition-colors hover:text-red-500"
                          >
                            Удалить
                          </button>
                        </div>
                      </div>

                      {valueSuggestions.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {valueSuggestions.map((item) => (
                            <button
                              key={`${question.id}-logic-hint-${index}-${item}`}
                              type="button"
                              onClick={() => updateLogicRule(index, { value: item })}
                              className="rounded-full border border-dash-border bg-dash-bg px-3 py-1 text-xs font-semibold text-dash-muted transition-colors hover:border-brand/30 hover:text-brand"
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-dash-border bg-dash-bg px-4 py-3">
            <div>
              <div className="font-medium text-dash-heading">Обязательный вопрос</div>
              <div className="text-sm text-dash-muted">Если выключить, пользователь сможет пропустить этот вопрос.</div>
            </div>
            <Toggle active={question.required} onClick={() => onUpdate({ required: !question.required })} />
          </div>

          {uploadError ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm font-medium text-red-500">
              {uploadError}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default function StepQuestions({ questions, onChange }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(questions[0]?.id ?? null);
  const [showTypeMenu, setShowTypeMenu] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const ids = useMemo(() => questions.map((question) => question.id), [questions]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = questions.findIndex((question) => question.id === active.id);
    const newIndex = questions.findIndex((question) => question.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    onChange(normalizeLogicOrder(arrayMove(questions, oldIndex, newIndex)));
  }

  function updateQuestion(id: string, patch: Partial<Question>) {
    onChange(questions.map((question) => (question.id === id ? { ...question, ...patch } : question)));
  }

  function addQuestion(type: QuestionType) {
    const nextQuestion = createEmptyQuestion(type);
    onChange([...questions, nextQuestion]);
    setExpandedId(nextQuestion.id);
    setShowTypeMenu(false);
  }

  return (
    <div className="space-y-4">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {questions.map((question, index) => (
              <SortableQuestionCard
                key={question.id}
                question={question}
                previousQuestions={questions.slice(0, index)}
                expanded={expandedId === question.id}
                onToggle={() => setExpandedId((current) => (current === question.id ? null : question.id))}
                onDelete={() => {
                  onChange(
                    normalizeLogicOrder(
                      questions
                        .filter((item) => item.id !== question.id)
                        .map((item) => ({
                          ...item,
                          logic: item.logic.filter((rule) => rule.ifQuestionId !== question.id),
                        })),
                    ),
                  );
                  if (expandedId === question.id) setExpandedId(null);
                }}
                onUpdate={(patch) => updateQuestion(question.id, patch)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="relative">
        <button
          type="button"
          onClick={() => setShowTypeMenu((value) => !value)}
          className="w-full rounded-2xl border-2 border-dashed border-dash-border bg-dash-bg p-6 text-sm font-semibold text-dash-muted transition-colors hover:border-brand/40 hover:bg-brand/5 hover:text-dash-heading"
        >
          + Добавить вопрос
        </button>

        {showTypeMenu ? (
          <div className="absolute left-0 right-0 top-[calc(100%+12px)] z-20 grid gap-2 rounded-2xl border border-dash-border bg-dash-card p-3 shadow-xl lg:right-auto lg:w-[320px]">
            {QUESTION_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => addQuestion(type)}
                className="rounded-xl px-4 py-3 text-left text-sm font-semibold text-dash-heading transition-colors hover:bg-dash-bg hover:text-brand"
              >
                {QUESTION_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
