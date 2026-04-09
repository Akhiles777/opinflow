"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { stopSurveyAction, toggleSurveyPauseAction } from "@/actions/surveys";

export default function ClientSurveyActions({ surveyId, status }: { surveyId: string; status: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handlePauseToggle() {
    startTransition(async () => {
      const result = await toggleSurveyPauseAction(surveyId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setError(null);
      router.refresh();
    });
  }

  function handleStop() {
    startTransition(async () => {
      const result = await stopSurveyAction(surveyId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setError(null);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-stretch gap-3 sm:items-end">
      <div className="flex flex-wrap gap-2">
        {status === "ACTIVE" || status === "PAUSED" ? (
          <button
            type="button"
            onClick={handlePauseToggle}
            disabled={isPending}
            className="rounded-xl border border-dash-border bg-dash-bg px-5 py-3 text-sm font-semibold text-dash-heading transition-colors hover:bg-dash-card disabled:opacity-60"
          >
            {status === "ACTIVE" ? "Пауза" : "Возобновить"}
          </button>
        ) : null}
        {status === "ACTIVE" || status === "PAUSED" || status === "PENDING_MODERATION" ? (
          <button
            type="button"
            onClick={handleStop}
            disabled={isPending}
            className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-mid disabled:opacity-60"
          >
            Стоп
          </button>
        ) : null}
      </div>
      {error ? <div className="text-sm text-red-500">{error}</div> : null}
    </div>
  );
}
