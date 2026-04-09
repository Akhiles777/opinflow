"use client";

import type { Question } from "@/types/survey";

type Props = {
  question: Question;
  value: unknown;
  onChange: (value: unknown) => void;
};

function moveItem(list: string[], from: number, to: number) {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function RadioMark({ active }: { active: boolean }) {
  return (
    <span className={[
      "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors",
      active ? "border-brand" : "border-white/25",
    ].join(" ")}>
      <span className={["h-2.5 w-2.5 rounded-full bg-brand transition-opacity", active ? "opacity-100" : "opacity-0"].join(" ")} />
    </span>
  );
}

function CheckboxMark({ active }: { active: boolean }) {
  return (
    <span className={[
      "flex h-5 w-5 items-center justify-center rounded-md border-2 transition-colors",
      active ? "border-brand bg-brand" : "border-white/25",
    ].join(" ")}>
      <svg viewBox="0 0 20 20" className={["h-3.5 w-3.5 text-white transition-opacity", active ? "opacity-100" : "opacity-0"].join(" ")} fill="none" stroke="currentColor" strokeWidth="2.4">
        <path d="M4 10l4 4 8-8" />
      </svg>
    </span>
  );
}

export default function QuestionRenderer({ question, value, onChange }: Props) {
  if (question.type === "SINGLE_CHOICE") {
    return (
      <div className="grid gap-3">
        {question.options.map((option) => {
          const active = value === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={[
                "flex items-center gap-4 rounded-2xl border px-5 py-4 text-left transition-all",
                active
                  ? "border-brand bg-brand/10 text-white"
                  : "border-white/10 bg-white/3 text-white/70 hover:border-white/20",
              ].join(" ")}
            >
              <RadioMark active={active} />
              <span className="text-base">{option}</span>
            </button>
          );
        })}
      </div>
    );
  }

  if (question.type === "MULTIPLE_CHOICE") {
    const selected = Array.isArray(value) ? (value as string[]) : [];
    return (
      <div className="grid gap-3">
        {question.options.map((option) => {
          const active = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(active ? selected.filter((item) => item !== option) : [...selected, option])}
              className={[
                "flex items-center gap-4 rounded-2xl border px-5 py-4 text-left transition-all",
                active
                  ? "border-brand bg-brand/10 text-white"
                  : "border-white/10 bg-white/3 text-white/70 hover:border-white/20",
              ].join(" ")}
            >
              <CheckboxMark active={active} />
              <span className="text-base">{option}</span>
            </button>
          );
        })}
      </div>
    );
  }

  if (question.type === "SCALE") {
    const min = Number(question.settings.min ?? 1);
    const max = Number(question.settings.max ?? 10);
    const values = Array.from({ length: max - min + 1 }, (_, index) => min + index);
    return (
      <div className="grid gap-4">
        <div className="flex flex-wrap gap-3">
          {values.map((item) => {
            const active = value === item;
            return (
              <button
                key={item}
                type="button"
                onClick={() => onChange(item)}
                className={[
                  "flex h-12 w-12 items-center justify-center rounded-xl border text-base font-semibold transition-all",
                  active
                    ? "scale-110 border-brand bg-brand text-white"
                    : "border-white/10 bg-white/5 text-white/50 hover:border-white/20 hover:text-white",
                ].join(" ")}
              >
                {item}
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-between text-xs text-white/30">
          <span>{String(question.settings.minLabel ?? "Минимум")}</span>
          <span>{String(question.settings.maxLabel ?? "Максимум")}</span>
        </div>
      </div>
    );
  }

  if (question.type === "MATRIX") {
    const matrixValue = value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, string>) : {};
    return (
      <div className="overflow-x-auto rounded-2xl border border-white/8 bg-white/3">
        <table className="min-w-full text-left text-sm text-white/75">
          <thead className="border-b border-white/8 bg-white/4">
            <tr>
              <th className="px-4 py-3 font-semibold text-white/45">Критерий</th>
              {question.matrixCols.map((column) => (
                <th key={column} className="px-4 py-3 text-center font-semibold text-white/45">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {question.matrixRows.map((row) => (
              <tr key={row} className="border-b border-white/6 last:border-b-0">
                <td className="px-4 py-4 font-medium text-white">{row}</td>
                {question.matrixCols.map((column) => {
                  const active = matrixValue[row] === column;
                  return (
                    <td key={`${row}-${column}`} className="px-4 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => onChange({ ...matrixValue, [row]: column })}
                        className="inline-flex"
                      >
                        <RadioMark active={active} />
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (question.type === "RANKING") {
    const current = Array.isArray(value) && value.length > 0 ? (value as string[]) : question.options;
    return (
      <div className="grid gap-3">
        {current.map((option, index) => (
          <div key={option} className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/3 px-5 py-4 text-white/75">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/20 text-sm font-semibold text-brand">
              {index + 1}
            </span>
            <span className="flex-1 text-base text-white">{option}</span>
            <div className="flex items-center gap-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => onChange(moveItem(current, index, index - 1))}
                className="rounded-lg border border-white/10 px-2.5 py-1.5 text-sm text-white/70 transition-colors hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              >
                ▲
              </button>
              <button
                type="button"
                disabled={index === current.length - 1}
                onClick={() => onChange(moveItem(current, index, index + 1))}
                className="rounded-lg border border-white/10 px-2.5 py-1.5 text-sm text-white/70 transition-colors hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              >
                ▼
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const maxLength = Number(question.settings.maxLength ?? 500);
  const textValue = typeof value === "string" ? value : "";

  return (
    <div className="grid gap-3">
      <textarea
        value={textValue}
        maxLength={maxLength}
        placeholder={String(question.settings.placeholder ?? "Введите ваш ответ...")}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-[180px] w-full rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-base text-white outline-none transition-colors placeholder:text-white/25 focus:border-brand/50"
      />
      <div className="text-right text-xs text-white/25">
        {textValue.length} / {maxLength}
      </div>
    </div>
  );
}
