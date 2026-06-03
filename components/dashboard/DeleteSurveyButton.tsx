"use client";
import { useTransition } from "react";
import { deleteSurveyAction } from "@/actions/surveys";

export default function DeleteSurveyButton({ surveyId }: { surveyId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("Удалить опрос? Это действие нельзя отменить.")) return;
    startTransition(async () => {
      const result = await deleteSurveyAction(surveyId);
      if (result.error) alert(result.error);
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="rounded-lg border border-red-200 bg-[#FFF0F0] px-5 py-1.5 text-[13px] font-semibold text-red-500 transition-colors hover:bg-red-100 disabled:opacity-50"
    >
      {isPending ? "..." : "Удалить"}
    </button>
  );
}
