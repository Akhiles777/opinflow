import * as React from "react";
import Badge from "@/components/dashboard/Badge";

type Status = "available" | "in-progress" | "completed";

type Props = {
  category: string;
  title: string;
  reward: number;
  duration: number;
  questions: number;
  clientRating?: number;
  status: Status;
};

export default function SurveyCard({
  category,
  title,
  reward,
  duration,
  questions,
  clientRating,
  status,
}: Props) {
  const statusBadge =
    status === "available"
      ? { v: "active" as const, t: "Доступен" }
      : status === "in-progress"
      ? { v: "pending" as const, t: "В работе" }
      : { v: "completed" as const, t: "Завершён" };

  return (
    <div className="bg-dash-card border border-dash-border rounded-2xl p-6 hover:border-brand/30 hover:shadow-md transition-all duration-200 cursor-pointer group">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Badge variant={statusBadge.v}>{statusBadge.t}</Badge>
            <span className="text-sm text-dash-muted font-body truncate">
              {category}
            </span>
          </div>
          <p className="mt-3 font-display text-xl text-dash-heading leading-snug">
            {title}
          </p>
        </div>
        <div className="shrink-0 text-left sm:text-right">
          <p className="font-display text-2xl text-brand tabular-nums font-bold">
            {reward} ₽
          </p>
          {clientRating ? (
            <p className="text-sm text-dash-muted font-body mt-1">
              Рейтинг: {clientRating.toFixed(1)}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-base text-dash-muted font-body">
          ~{duration} минут · {questions} вопросов
        </p>
        <span className="text-base font-semibold text-brand opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
          {status === "in-progress" ? "Продолжить →" : "Начать →"}
        </span>
      </div>
    </div>
  );
}
