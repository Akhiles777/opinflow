"use client";

import { useState } from "react";
import type { SurveyDraft } from "@/types/survey";

type Props = {
  draft: SurveyDraft;
  onChange: (patch: Partial<SurveyDraft>) => void;
};

const MIN_RESPONSES = 20;
const MIN_REWARD = 50;

export default function StepBudget({ draft, onChange }: Props) {
  const [responsesInput, setResponsesInput] = useState(String(draft.maxResponses));
  const [rewardInput, setRewardInput] = useState(String(draft.reward));
  const today = new Date().toISOString().split("T")[0];

  function handleResponsesChange(raw: string) {
    setResponsesInput(raw);
    const num = parseInt(raw, 10);
    if (!isNaN(num) && num > 0) onChange({ maxResponses: num });
  }

  function handleResponsesBlur() {
    const num = parseInt(responsesInput, 10);
    const clamped = isNaN(num) || num < MIN_RESPONSES ? MIN_RESPONSES : num;
    setResponsesInput(String(clamped));
    onChange({ maxResponses: clamped });
  }

  function handleRewardChange(raw: string) {
    setRewardInput(raw);
    const num = parseInt(raw, 10);
    if (!isNaN(num) && num > 0) onChange({ reward: num });
  }

  function handleRewardBlur() {
    const num = parseInt(rewardInput, 10);
    const clamped = isNaN(num) || num < MIN_REWARD ? MIN_REWARD : num;
    setRewardInput(String(clamped));
    onChange({ reward: clamped });
  }

  return (
    <div className="grid gap-5">

      {/* Количество респондентов */}
      <label className="grid gap-1.5">
        <span className="text-[14px] font-medium text-dash-muted">
          Количество респондентов{" "}
          <span className="font-normal text-dash-muted/70">(минимум {MIN_RESPONSES})</span>
        </span>
        <input
          type="number"
          min={MIN_RESPONSES}
          step={10}
          value={responsesInput}
          onChange={(e) => handleResponsesChange(e.target.value)}
          onBlur={handleResponsesBlur}
          className="h-12 rounded-xl border border-dash-border bg-dash-bg px-4 text-[15px] text-dash-body outline-none transition-colors focus:border-[#7244F5]/40"
        />
      </label>

      {/* Вознаграждение за одного */}
      <label className="grid gap-1.5">
        <span className="text-[14px] font-medium text-dash-muted">
          Вознаграждение за одного{" "}
          <span className="font-normal text-dash-muted/70">(минимум {MIN_REWARD} ₽)</span>
        </span>
        <div className="relative">
          <input
            type="number"
            min={MIN_REWARD}
            value={rewardInput}
            onChange={(e) => handleRewardChange(e.target.value)}
            onBlur={handleRewardBlur}
            className="h-12 w-full rounded-xl border border-dash-border bg-dash-bg px-4 pr-8 text-[15px] text-dash-body outline-none transition-colors focus:border-[#7244F5]/40"
          />
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[14px] text-dash-muted">₽</span>
        </div>
      </label>

      {/* Даты */}
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-1.5">
          <span className="text-[14px] font-medium text-dash-muted">Дата начала</span>
          <input
            type="date"
            min={today}
            value={draft.startsAt}
            onChange={(e) => onChange({ startsAt: e.target.value })}
            className="h-12 rounded-xl border border-dash-border bg-dash-bg px-4 text-[15px] text-dash-body outline-none transition-colors focus:border-[#7244F5]/40"
          />
        </label>
        <label className="grid gap-1.5">
          <span className="text-[14px] font-medium text-dash-muted">Дата окончания</span>
          <input
            type="date"
            min={draft.startsAt || today}
            value={draft.endsAt}
            onChange={(e) => onChange({ endsAt: e.target.value })}
            className="h-12 rounded-xl border border-dash-border bg-dash-bg px-4 text-[15px] text-dash-body outline-none transition-colors focus:border-[#7244F5]/40"
          />
        </label>
      </div>

    </div>
  );
}
