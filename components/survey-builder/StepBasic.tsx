"use client";

import type { SurveyDraft } from "@/types/survey";

type Props = {
  draft: SurveyDraft;
  onChange: (patch: Partial<SurveyDraft>) => void;
};

const categories = ["Маркетинг", "Продукт", "Потребительские", "HR", "UX", "Другое"];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-dash-muted">{label}</span>
      {children}
    </label>
  );
}

export default function StepBasic({ draft, onChange }: Props) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Field label="Название опроса">
        <input
          value={draft.title}
          onChange={(event) => onChange({ title: event.target.value })}
          placeholder="Например: Оценка нового мобильного банка"
          className="h-12 rounded-xl border border-dash-border bg-dash-bg px-4 text-base text-dash-body outline-none transition-colors focus:border-brand/40"
        />
      </Field>

      <Field label="Категория">
        <select
          value={draft.category}
          onChange={(event) => onChange({ category: event.target.value })}
          className="h-12 rounded-xl border border-dash-border bg-dash-bg px-4 text-base text-dash-body outline-none transition-colors focus:border-brand/40"
        >
          <option value="">Выберите категорию</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </Field>

      <div className="lg:col-span-2">
        <Field label="Описание">
          <textarea
            value={draft.description}
            onChange={(event) => onChange({ description: event.target.value })}
            placeholder="Коротко опишите цель исследования и что именно вы хотите узнать от аудитории."
            className="min-h-[180px] rounded-xl border border-dash-border bg-dash-bg px-4 py-3 text-base text-dash-body outline-none transition-colors placeholder:text-dash-muted focus:border-brand/40"
          />
        </Field>
      </div>
    </div>
  );
}
