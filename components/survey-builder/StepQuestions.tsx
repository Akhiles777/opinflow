"use client";

import { useMemo, useState } from "react";
import { DndContext, PointerSensor, closestCenter, type DragEndEvent, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createEmptyQuestion, QUESTION_TYPE_LABELS, type Question, type QuestionType } from "@/types/survey";

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

function arrayReplace(list: string[], index: number, value: string) {
  return list.map((item, currentIndex) => (currentIndex === index ? value : item));
}

function SortableQuestionCard({
  question,
  expanded,
  onToggle,
  onDelete,
  onUpdate,
}: {
  question: Question;
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onUpdate: (patch: Partial<Question>) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: question.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

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
        </button>

        <button type="button" onClick={onDelete} className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
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
                  <input
                    key={`${question.id}-row-${index}`}
                    value={row}
                    onChange={(event) => onUpdate({ matrixRows: arrayReplace(question.matrixRows, index, event.target.value) })}
                    className="h-11 rounded-xl border border-dash-border bg-dash-bg px-4 text-base text-dash-body outline-none focus:border-brand/40"
                  />
                ))}
                <button type="button" onClick={() => onUpdate({ matrixRows: [...question.matrixRows, `Критерий ${question.matrixRows.length + 1}`] })} className="w-fit rounded-xl border border-dash-border bg-dash-bg px-4 py-2 text-sm font-semibold text-dash-heading transition-colors hover:border-brand/30 hover:text-brand">
                  Добавить строку
                </button>
              </div>
              <div className="grid gap-3">
                <div className="text-sm font-medium text-dash-muted">Столбцы матрицы</div>
                {question.matrixCols.map((column, index) => (
                  <input
                    key={`${question.id}-col-${index}`}
                    value={column}
                    onChange={(event) => onUpdate({ matrixCols: arrayReplace(question.matrixCols, index, event.target.value) })}
                    className="h-11 rounded-xl border border-dash-border bg-dash-bg px-4 text-base text-dash-body outline-none focus:border-brand/40"
                  />
                ))}
                <button type="button" onClick={() => onUpdate({ matrixCols: [...question.matrixCols, `Оценка ${question.matrixCols.length + 1}`] })} className="w-fit rounded-xl border border-dash-border bg-dash-bg px-4 py-2 text-sm font-semibold text-dash-heading transition-colors hover:border-brand/30 hover:text-brand">
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

          <div className="flex items-center justify-between rounded-2xl border border-dash-border bg-dash-bg px-4 py-3">
            <div>
              <div className="font-medium text-dash-heading">Обязательный вопрос</div>
              <div className="text-sm text-dash-muted">Если выключить, пользователь сможет пропустить этот вопрос.</div>
            </div>
            <button
              type="button"
              onClick={() => onUpdate({ required: !question.required })}
              className={[
                "relative h-6 w-10 rounded-full transition-colors",
                question.required ? "bg-brand" : "bg-dash-border",
              ].join(" ")}
            >
              <span className={[
                "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                question.required ? "translate-x-4" : "translate-x-0.5",
              ].join(" ")} />
            </button>
          </div>
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

    onChange(arrayMove(questions, oldIndex, newIndex));
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
            {questions.map((question) => (
              <SortableQuestionCard
                key={question.id}
                question={question}
                expanded={expandedId === question.id}
                onToggle={() => setExpandedId((current) => (current === question.id ? null : question.id))}
                onDelete={() => {
                  onChange(questions.filter((item) => item.id !== question.id));
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
          <div className="absolute left-0 right-0 top-[calc(100%+12px)] z-20 grid gap-2 rounded-2xl border border-dash-border bg-dash-card p-3 shadow-xl lg:w-[320px] lg:right-auto">
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
