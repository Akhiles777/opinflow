"use client";

import { useEffect, useState } from "react";
import type { SurveyDraft } from "@/types/survey";

type Props = {
  draft: SurveyDraft;
  onChange: (patch: Partial<SurveyDraft>) => void;
};

const cities = ["Москва", "Санкт-Петербург", "Новосибирск", "Екатеринбург", "Казань", "Нижний Новгород", "Челябинск", "Самара", "Уфа", "Ростов-на-Дону"];
const incomes = ["до 30 000 ₽", "30 000–60 000 ₽", "60 000–100 000 ₽", "от 100 000 ₽"];
const interests = ["Авто", "Технологии", "Еда", "Спорт", "Путешествия", "Мода", "Финансы", "Здоровье", "Кино", "Музыка", "Игры", "Недвижимость", "Косметика", "Искусство"];
const industries = ["it", "finance", "education", "medicine", "retail", "manufacturing", "marketing", "public", "services", "other"];
const industryLabels: Record<string, string> = {
  it: "IT и технологии",
  finance: "Финансы",
  education: "Образование",
  medicine: "Медицина",
  retail: "Ритейл и продажи",
  manufacturing: "Производство",
  marketing: "Маркетинг и реклама",
  public: "Госструктуры",
  services: "Сфера услуг",
  other: "Другое",
};
const employmentStatuses = [
  { value: "working", label: "Работает" },
  { value: "not_working", label: "Не работает" },
];
const maritalStatuses = [
  { value: "single", label: "Холост / не замужем" },
  { value: "married", label: "Женат / замужем" },
];

function toggleItem(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function estimateReach(draft: SurveyDraft) {
  let reach = 25000;
  if (draft.targetGender !== "any") reach *= 0.7;
  if (draft.targetAgeMin > 18 || draft.targetAgeMax < 65) reach *= 0.7;
  if (draft.targetCities.length > 0) reach *= 0.7;
  if (draft.targetIncomes.length > 0) reach *= 0.7;
  if (draft.targetInterests.length > 0) reach *= 0.7;
  if (draft.targetHasChildren !== "any") reach *= 0.7;
  if (draft.targetEmploymentStatuses.length > 0) reach *= 0.7;
  if (draft.targetIndustries.length > 0) reach *= 0.7;
  if (draft.targetMaritalStatuses.length > 0) reach *= 0.7;
  return Math.max(500, Math.round(reach));
}

export default function StepAudience({ draft, onChange }: Props) {
  const reach = estimateReach(draft);
  const [ageMinInput, setAgeMinInput] = useState(String(draft.targetAgeMin));
  const [ageMaxInput, setAgeMaxInput] = useState(String(draft.targetAgeMax));

  useEffect(() => {
    setAgeMinInput(String(draft.targetAgeMin));
  }, [draft.targetAgeMin]);

  useEffect(() => {
    setAgeMaxInput(String(draft.targetAgeMax));
  }, [draft.targetAgeMax]);

  function handleAgeInput(kind: "min" | "max", rawValue: string) {
    const normalized = rawValue.replace(/[^\d]/g, "");
    if (kind === "min") {
      setAgeMinInput(normalized);
    } else {
      setAgeMaxInput(normalized);
    }

    if (!normalized) {
      return;
    }

    const numeric = Math.min(99, Math.max(18, Number(normalized)));
    if (kind === "min") {
      onChange({ targetAgeMin: numeric });
    } else {
      onChange({ targetAgeMax: numeric });
    }
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_300px] xl:items-start">
      <div className="space-y-8">
        <div className="space-y-3">
          <div className="text-sm font-medium text-dash-muted">Пол</div>
          <div className="flex flex-wrap gap-3">
            {[
              { label: "Все", value: "any" },
              { label: "Мужской", value: "male" },
              { label: "Женский", value: "female" },
            ].map((item) => {
              const active = draft.targetGender === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => onChange({ targetGender: item.value as SurveyDraft["targetGender"] })}
                  className={[
                    "rounded-xl border px-5 py-3 text-sm font-semibold transition-colors",
                    active
                      ? "border-brand bg-brand text-white"
                      : "border-dash-border text-dash-muted hover:border-dash-body hover:text-dash-heading",
                  ].join(" ")}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-dash-muted">Возраст от</span>
            <input
              type="text"
              inputMode="numeric"
              min={18}
              max={99}
              value={ageMinInput}
              onChange={(event) => handleAgeInput("min", event.target.value)}
              onBlur={() => setAgeMinInput(String(draft.targetAgeMin))}
              className="h-12 rounded-xl border border-dash-border bg-dash-bg px-4 text-base text-dash-body outline-none focus:border-brand/40"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-dash-muted">Возраст до</span>
            <input
              type="text"
              inputMode="numeric"
              min={18}
              max={99}
              value={ageMaxInput}
              onChange={(event) => handleAgeInput("max", event.target.value)}
              onBlur={() => setAgeMaxInput(String(draft.targetAgeMax))}
              className="h-12 rounded-xl border border-dash-border bg-dash-bg px-4 text-base text-dash-body outline-none focus:border-brand/40"
            />
          </label>
        </div>

        <div className="space-y-3">
          <div className="text-sm font-medium text-dash-muted">Города</div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onChange({ targetCities: [] })}
              className={[
                "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                draft.targetCities.length === 0
                  ? "border-brand/30 bg-brand/15 text-brand"
                  : "border-dash-border bg-dash-card text-dash-muted hover:border-dash-body hover:text-dash-heading",
              ].join(" ")}
            >
              Все города
            </button>
            {cities.map((city) => {
              const active = draft.targetCities.includes(city);
              return (
                <button
                  key={city}
                  type="button"
                  onClick={() => onChange({ targetCities: toggleItem(draft.targetCities, city) })}
                  className={[
                    "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                    active
                      ? "border-brand/30 bg-brand/15 text-brand"
                      : "border-dash-border bg-dash-card text-dash-muted hover:border-dash-body hover:text-dash-heading",
                  ].join(" ")}
                >
                  {city}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-sm font-medium text-dash-muted">Уровень дохода</div>
          <div className="grid gap-3 sm:grid-cols-2">
            {incomes.map((income) => {
              const active = draft.targetIncomes.includes(income);
              return (
                <button
                  key={income}
                  type="button"
                  onClick={() => onChange({ targetIncomes: toggleItem(draft.targetIncomes, income) })}
                  className={[
                    "rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-colors",
                    active
                      ? "border-brand/30 bg-brand/15 text-brand"
                      : "border-dash-border bg-dash-card text-dash-muted hover:border-dash-body hover:text-dash-heading",
                  ].join(" ")}
                >
                  {income}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-sm font-medium text-dash-muted">Интересы</div>
          <div className="flex flex-wrap gap-2">
            {interests.map((interest) => {
              const active = draft.targetInterests.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() => onChange({ targetInterests: toggleItem(draft.targetInterests, interest) })}
                  className={[
                    "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                    active
                      ? "border-brand/30 bg-brand/15 text-brand"
                      : "border-dash-border bg-dash-card text-dash-muted hover:border-dash-body hover:text-dash-heading",
                  ].join(" ")}
                >
                  {interest}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-sm font-medium text-dash-muted">Есть дети</div>
          <div className="flex flex-wrap gap-3">
            {[
              { label: "Не важно", value: "any" },
              { label: "Да", value: "yes" },
              { label: "Нет", value: "no" },
            ].map((item) => {
              const active = draft.targetHasChildren === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => onChange({ targetHasChildren: item.value as SurveyDraft["targetHasChildren"] })}
                  className={[
                    "rounded-xl border px-5 py-3 text-sm font-semibold transition-colors",
                    active
                      ? "border-brand bg-brand text-white"
                      : "border-dash-border text-dash-muted hover:border-dash-body hover:text-dash-heading",
                  ].join(" ")}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-sm font-medium text-dash-muted">Статус занятости</div>
          <div className="flex flex-wrap gap-2">
            {employmentStatuses.map((item) => {
              const active = draft.targetEmploymentStatuses.includes(item.value);
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => onChange({ targetEmploymentStatuses: toggleItem(draft.targetEmploymentStatuses, item.value) })}
                  className={[
                    "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                    active
                      ? "border-brand/30 bg-brand/15 text-brand"
                      : "border-dash-border bg-dash-card text-dash-muted hover:border-dash-body hover:text-dash-heading",
                  ].join(" ")}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-sm font-medium text-dash-muted">Сфера деятельности</div>
          <div className="flex flex-wrap gap-2">
            {industries.map((industry) => {
              const active = draft.targetIndustries.includes(industry);
              return (
                <button
                  key={industry}
                  type="button"
                  onClick={() => onChange({ targetIndustries: toggleItem(draft.targetIndustries, industry) })}
                  className={[
                    "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                    active
                      ? "border-brand/30 bg-brand/15 text-brand"
                      : "border-dash-border bg-dash-card text-dash-muted hover:border-dash-body hover:text-dash-heading",
                  ].join(" ")}
                >
                  {industryLabels[industry]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-sm font-medium text-dash-muted">Семейное положение</div>
          <div className="flex flex-wrap gap-2">
            {maritalStatuses.map((item) => {
              const active = draft.targetMaritalStatuses.includes(item.value);
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => onChange({ targetMaritalStatuses: toggleItem(draft.targetMaritalStatuses, item.value) })}
                  className={[
                    "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                    active
                      ? "border-brand/30 bg-brand/15 text-brand"
                      : "border-dash-border bg-dash-card text-dash-muted hover:border-dash-body hover:text-dash-heading",
                  ].join(" ")}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <aside className="h-fit rounded-2xl border border-white/8 bg-surface-900 p-6 text-white xl:sticky xl:top-6">
        <div className="text-sm uppercase tracking-[0.22em] text-white/35">Подбор аудитории</div>
        <div className="mt-4 font-display text-3xl font-bold text-white">~{reach.toLocaleString("ru-RU")}</div>
        <div className="mt-2 text-base text-white/60">Расчётный охват</div>
        <p className="mt-5 text-sm leading-relaxed text-white/45">
          Это примерная оценка доступной аудитории на основе выбранных фильтров. Чем жёстче сегментация, тем ниже доступный охват и тем дольше может идти набор.
        </p>
      </aside>
    </div>
  );
}
