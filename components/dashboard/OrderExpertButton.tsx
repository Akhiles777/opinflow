"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createExpertReviewRequestAction } from "@/actions/expert-reviews";
import { getExpertReviewPrice } from "@/lib/expert-review";

type Props = {
  surveyId: string;
  answers: number;
  expertReview?: {
    id: string;
    status: "PENDING" | "ASSIGNED" | "COMPLETED" | "REJECTED";
    assignedExpert?: string | null;
    reportUrl?: string | null;
    amount?: number | null;
  } | null;
};

export default function OrderExpertButton({ surveyId, answers, expertReview }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isOrdering, startOrdering] = useTransition();
  const price = getExpertReviewPrice();

  function handleOrder() {
    setError(null);
    startOrdering(async () => {
      const result = await createExpertReviewRequestAction(surveyId);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }
  const disabled = isOrdering || answers <= 0 || Boolean(expertReview && expertReview.status !== "REJECTED");

  function label() {
    if (expertReview) {
      if (expertReview.status === "PENDING") return "Заявка: ожидает назначения";
      if (expertReview.status === "ASSIGNED") return expertReview.assignedExpert ? `Назначен: ${expertReview.assignedExpert}` : "Назначен эксперт";
      if (expertReview.status === "COMPLETED") return "Разбор готов";
      if (expertReview.status === "REJECTED") return "Отклонено";
    }

    if (isOrdering) return "Отправляем...";
    if (answers <= 0) return "Нужны ответы";
    return `Заказать детальный разбор`;
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleOrder}
        disabled={disabled}
        className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-mid disabled:opacity-60"
      >
        {label()}
      </button>
      {error ? <div className="text-sm text-red-500">{error}</div> : null}
    </div>
  );
}
