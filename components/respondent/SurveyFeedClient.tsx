"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import EmptyState from "@/components/dashboard/EmptyState";

type AvailableSurvey = {
  id: string;
  title: string;
  category: string | null;
  reward: number | null;
  estimatedTime: number | null;
  maxResponses: number | null;
  createdAt: Date;
  questions: { id: string }[];
  _count: { sessions: number };
  recommended: boolean;
};

type InProgressSurvey = {
  id: string;
  startedAt: Date;
  survey: {
    id: string;
    title: string;
    category: string | null;
    reward: number | null;
    estimatedTime: number | null;
    maxResponses: number | null;
    questions: { id: string }[];
    _count?: { sessions: number };
  };
};

type CompletedSurvey = {
  id: string;
  status: "COMPLETED" | "REJECTED";
  completedAt: Date | null;
  isValid: boolean;
  survey: {
    id: string;
    title: string;
    reward: number | null;
  };
};

type Props = {
  available: AvailableSurvey[];
  inProgress: InProgressSurvey[];
  completed: CompletedSurvey[];
  initialTab?: Tab;
};

type Tab = "available" | "inprogress" | "completed";

function formatDate(date: Date | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "long", year: "numeric" }).format(date);
}

function SurveyCard({
  title,
  category,
  reward,
  questionCount,
  estimatedTime,
  completedCount,
  maxResponses,
  href,
  actionLabel,
  badge,
}: {
  title: string;
  category: string | null;
  reward: number | null;
  questionCount: number;
  estimatedTime: number | null;
  completedCount: number;
  maxResponses: number | null;
  href: string;
  actionLabel: string;
  badge: string;
}) {
  const progress = maxResponses && maxResponses > 0 ? Math.min((completedCount / maxResponses) * 100, 100) : 0;
  const filledSegments = Math.max(0, Math.min(10, Math.round(progress / 10)));

  return (
    <Link href={href} className="group rounded-2xl border border-dash-border bg-dash-card p-6 transition-all hover:border-brand/30 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
              {badge}
            </span>
            <span className="text-sm text-dash-muted">{category || "Без категории"}</span>
          </div>
          <h3 className="mt-3 font-display text-xl text-dash-heading">{title}</h3>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-display text-3xl font-bold text-brand tabular-nums">{reward ? `${reward} ₽` : "—"}</div>
          <div className="mt-1 text-sm text-dash-muted">~{estimatedTime ?? Math.max(questionCount * 2, 3)} мин</div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between text-sm text-dash-muted">
        <span>{questionCount} вопросов</span>
        <span>{completedCount} / {maxResponses ?? "∞"} ответов</span>
      </div>

      <div className="mt-3 grid grid-cols-10 gap-1">
        {Array.from({ length: 10 }, (_, index) => (
          <div
            key={`${href}-segment-${index}`}
            className={[
              "h-2 rounded-full transition-colors",
              index < filledSegments ? "bg-brand" : "bg-dash-bg",
            ].join(" ")}
          />
        ))}
      </div>

      <div className="mt-5 flex justify-end text-sm font-semibold text-brand transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
        {actionLabel}
      </div>
    </Link>
  );
}

export default function SurveyFeedClient({ available, inProgress, completed, initialTab = "available" }: Props) {
  const [tab, setTab] = useState<Tab>(initialTab);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const tabItems = useMemo(
    () => [
      { value: "available" as const, label: "Доступные", count: available.length },
      { value: "inprogress" as const, label: "В работе", count: inProgress.length },
      { value: "completed" as const, label: "Завершённые", count: completed.length },
    ],
    [available.length, inProgress.length, completed.length],
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        {tabItems.map((item) => {
          const active = item.value === tab;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => setTab(item.value)}
              className={[
                "inline-flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all",
                active
                  ? "border border-dash-border bg-dash-card text-dash-heading shadow-sm"
                  : "text-dash-muted hover:text-dash-body",
              ].join(" ")}
            >
              <span>{item.label}</span>
              <span className={[
                "rounded-full px-2.5 py-1 text-xs font-semibold",
                active ? "bg-brand/15 text-brand" : "bg-dash-border text-dash-muted",
              ].join(" ")}>
                {item.count}
              </span>
            </button>
          );
        })}
      </div>

      {tab === "available" ? (
        available.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {available.map((survey) => (
              <SurveyCard
                key={survey.id}
                title={survey.title}
                category={survey.category}
                reward={survey.reward ? Number(survey.reward) : null}
                estimatedTime={survey.estimatedTime}
                questionCount={survey.questions.length}
                completedCount={survey._count.sessions}
                maxResponses={survey.maxResponses}
                href={`/survey/${survey.id}`}
                actionLabel="Начать →"
                badge={survey.recommended ? "Подходит вам" : "Можно пройти"}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Подходящих опросов пока нет"
            description="Чем полнее заполнен профиль, тем точнее система подбирает опросы под вас."
            cta={
              <Link href="/respondent/profile" className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-mid">
                Заполнить профиль →
              </Link>
            }
          />
        )
      ) : null}

      {tab === "inprogress" ? (
        inProgress.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {inProgress.map((session) => (
              <SurveyCard
                key={session.id}
                title={session.survey.title}
                category={session.survey.category}
                reward={session.survey.reward ? Number(session.survey.reward) : null}
                estimatedTime={session.survey.estimatedTime}
                questionCount={session.survey.questions.length}
                completedCount={session.survey._count?.sessions ?? 0}
                maxResponses={session.survey.maxResponses}
                href={`/survey/${session.survey.id}`}
                actionLabel="Продолжить →"
                badge="В процессе"
              />
            ))}
          </div>
        ) : (
          <EmptyState title="Нет опросов в работе" description="Как только вы начнёте прохождение, незавершённые исследования появятся здесь." />
        )
      ) : null}

      {tab === "completed" ? (
        completed.length > 0 ? (
          <div className="overflow-hidden rounded-2xl border border-dash-border bg-dash-card">
            <div className="divide-y divide-dash-border">
              {completed.map((item) => (
                <div key={item.id} className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="font-semibold text-dash-heading">{item.survey.title}</div>
                    <div className="mt-1 text-sm text-dash-muted">{formatDate(item.completedAt)}</div>
                  </div>
                  <div className={[
                    "text-base font-semibold tabular-nums",
                    item.status === "COMPLETED" && item.isValid ? "text-green-600 dark:text-green-400" : "text-dash-muted",
                  ].join(" ")}>
                    {item.status === "COMPLETED" && item.isValid
                      ? `+${Number(item.survey.reward ?? 0)} ₽`
                      : "Без начисления"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState title="Пока нет завершённых опросов" description="После первого завершённого исследования здесь появится история прохождений и начислений." />
        )
      ) : null}
    </div>
  );
}
