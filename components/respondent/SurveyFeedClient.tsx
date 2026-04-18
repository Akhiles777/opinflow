"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import EmptyState from "@/components/dashboard/EmptyState";
import Modal from "@/components/dashboard/Modal";
import SurveyIntroModal from "@/components/respondent/SurveyIntroModal";
import { createComplaintAction } from "@/actions/surveys";

type AvailableSurvey = {
  id: string;
  title: string;
  category: string | null;
  creatorName: string;
  creatorRating: number;
  reward: number | null;
  estimatedTime: number | null;
  maxResponses: number | null;
  createdAt: Date | string;
  questions: { id: string }[];
  _count: { sessions: number };
  recommended: boolean;
};

type InProgressSurvey = {
  id: string;
  startedAt: Date | string;
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
  completedAt: Date | string | null;
  isValid: boolean;
  survey: {
    id: string;
    title: string;
    reward: number | null;
  };
};

type Props = {
  userId: string;
  available: AvailableSurvey[];
  inProgress: InProgressSurvey[];
  completed: CompletedSurvey[];
  initialTab?: Tab;
  showIntro?: boolean;
  mode?: "feed" | "mine";
};

type Tab = "available" | "inprogress" | "completed";
type SortKey = "recommended" | "date" | "reward" | "time";

function toSafeDate(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(date: Date | string | null) {
  const safeDate = toSafeDate(date);
  if (!safeDate) return "—";
  return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "long", year: "numeric" }).format(safeDate);
}

function formatElapsed(startedAt: Date | string, now: number) {
  const started = toSafeDate(startedAt);
  if (!started) return "0:00";
  const diff = Math.max(0, Math.floor((now - started.getTime()) / 1000));
  const hours = Math.floor(diff / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;

  if (hours > 0) {
    return `${hours} ч ${String(minutes).padStart(2, "0")} мин`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function InProgressTimer({ startedAt }: { startedAt: Date | string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <span className="rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
      Идёт: {formatElapsed(startedAt, now)}
    </span>
  );
}

function SurveyCard({
  title,
  category,
  creatorName,
  creatorRating,
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
  creatorName?: string;
  creatorRating?: number;
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
    <Link href={href} className="group rounded-2xl border border-site-border bg-site-card p-6 transition-all hover:border-brand/30 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
              {badge}
            </span>
            <span className="text-sm text-site-muted">{category || "Без категории"}</span>
          </div>
          <h3 className="mt-3 font-display text-xl text-site-heading">{title}</h3>
          {creatorName ? (
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-site-muted">
              <span className="truncate">{creatorName}</span>
              {typeof creatorRating === "number" ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-site-border bg-site-section px-2.5 py-1 text-xs font-semibold text-site-heading">
                  <span className="text-amber-500">★</span>
                  {creatorRating.toFixed(1)}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="shrink-0 text-right">
          <div className="font-display text-3xl font-bold text-brand tabular-nums">{reward ? `${reward} ₽` : "—"}</div>
          <div className="mt-1 text-sm text-site-muted">~{estimatedTime ?? Math.max(questionCount * 2, 3)} мин</div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between text-sm text-site-muted">
        <span>{questionCount} вопросов</span>
        <span>{completedCount} / {maxResponses ?? "∞"} ответов</span>
      </div>

      <div className="mt-3 grid grid-cols-10 gap-1">
        {Array.from({ length: 10 }, (_, index) => (
          <div
            key={`${href}-segment-${index}`}
            className={[
              "h-2 rounded-full transition-colors",
              index < filledSegments ? "bg-brand" : "bg-site-section",
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

export default function SurveyFeedClient({
  userId,
  available,
  inProgress,
  completed,
  initialTab = "available",
  showIntro = false,
  mode = "feed",
}: Props) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [sort, setSort] = useState<SortKey>("recommended");
  const [complaintSessionId, setComplaintSessionId] = useState<string | null>(null);
  const [complaintReason, setComplaintReason] = useState("");
  const [complaintDetails, setComplaintDetails] = useState("");
  const [complaintError, setComplaintError] = useState<string | null>(null);
  const [complaintSuccess, setComplaintSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const sortedAvailable = useMemo(() => {
    const list = [...available];

    if (sort === "date") {
      return list.sort(
        (left, right) =>
          (toSafeDate(right.createdAt)?.getTime() ?? 0) - (toSafeDate(left.createdAt)?.getTime() ?? 0),
      );
    }

    if (sort === "reward") {
      return list.sort((left, right) => Number(right.reward ?? 0) - Number(left.reward ?? 0));
    }

    if (sort === "time") {
      return list.sort((left, right) => (left.estimatedTime ?? left.questions.length * 2) - (right.estimatedTime ?? right.questions.length * 2));
    }

    return list.sort((left, right) => {
      if (Number(right.recommended) !== Number(left.recommended)) {
        return Number(right.recommended) - Number(left.recommended);
      }

      return (toSafeDate(right.createdAt)?.getTime() ?? 0) - (toSafeDate(left.createdAt)?.getTime() ?? 0);
    });
  }, [available, sort]);

  const tabItems = useMemo(
    () =>
      mode === "mine"
        ? [
            { value: "inprogress" as const, label: "В работе", count: inProgress.length },
            { value: "completed" as const, label: "Завершённые", count: completed.length },
          ]
        : [
            { value: "available" as const, label: "Доступные", count: available.length },
            { value: "inprogress" as const, label: "В работе", count: inProgress.length },
            { value: "completed" as const, label: "Завершённые", count: completed.length },
          ],
    [available.length, inProgress.length, completed.length, mode],
  );

  const complaintTarget = useMemo(
    () => completed.find((item) => item.id === complaintSessionId) ?? null,
    [completed, complaintSessionId],
  );

  function submitComplaint() {
    if (!complaintTarget) return;

    setComplaintError(null);
    setComplaintSuccess(null);
    startTransition(async () => {
      const result = await createComplaintAction({
        surveyId: complaintTarget.survey.id,
        sessionId: complaintTarget.id,
        reason: complaintReason,
        details: complaintDetails,
      });

      if (result.error) {
        setComplaintError(result.error);
        return;
      }

      setComplaintSuccess("Жалоба отправлена. Мы проверим это прохождение.");
      setComplaintReason("");
      setComplaintDetails("");
      window.setTimeout(() => {
        setComplaintSessionId(null);
        setComplaintSuccess(null);
      }, 900);
    });
  }

  return (
    <div className="space-y-8">
      <SurveyIntroModal userId={userId} openByDefault={showIntro} />

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
                  ? "border border-site-border bg-site-card text-site-heading shadow-sm"
                  : "text-site-muted hover:text-site-body",
              ].join(" ")}
            >
              <span>{item.label}</span>
              <span className={[
                "rounded-full px-2.5 py-1 text-xs font-semibold",
                active ? "bg-brand/15 text-brand" : "bg-site-section text-site-muted",
              ].join(" ")}>
                {item.count}
              </span>
            </button>
          );
        })}
      </div>

      {tab === "available" ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-2 text-sm font-semibold uppercase tracking-[0.18em] text-site-muted">Сортировка</span>
          {[
            { value: "recommended" as const, label: "Подходящие сначала" },
            { value: "date" as const, label: "По дате" },
            { value: "reward" as const, label: "По сумме" },
            { value: "time" as const, label: "По времени" },
          ].map((item) => {
            const active = sort === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setSort(item.value)}
                className={[
                  "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                  active
                    ? "border-brand/30 bg-brand/10 text-brand"
                    : "border-site-border bg-site-card text-site-muted hover:border-brand/20 hover:text-site-heading",
                ].join(" ")}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      ) : null}

      {tab === "available" ? (
        sortedAvailable.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {sortedAvailable.map((survey) => (
              <SurveyCard
                key={survey.id}
                title={survey.title}
                category={survey.category}
                creatorName={survey.creatorName}
                creatorRating={survey.creatorRating}
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
              <div key={session.id} className="rounded-2xl border border-site-border bg-site-card p-6 transition-all hover:border-brand/30 hover:shadow-md">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
                        В процессе
                      </span>
                      <InProgressTimer startedAt={session.startedAt} />
                    </div>
                    <h3 className="mt-3 font-display text-xl text-site-heading">{session.survey.title}</h3>
                    <div className="mt-2 text-sm text-site-muted">
                      {session.survey.category || "Без категории"} · ~{session.survey.estimatedTime ?? Math.max(session.survey.questions.length * 2, 3)} мин
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-display text-3xl font-bold text-brand tabular-nums">
                      {session.survey.reward ? `${Number(session.survey.reward)} ₽` : "—"}
                    </div>
                    <div className="mt-1 text-sm text-site-muted">
                      {session.survey._count?.sessions ?? 0} / {session.survey.maxResponses ?? "∞"} ответов
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <Link
                    href={`/survey/${session.survey.id}`}
                    className="inline-flex items-center justify-center rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-mid"
                  >
                    Продолжить →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Нет опросов в работе" description="Как только вы начнёте прохождение, незавершённые исследования появятся здесь." />
        )
      ) : null}

      {tab === "completed" ? (
        completed.length > 0 ? (
          <div className="overflow-hidden rounded-2xl border border-site-border bg-site-card">
            <div className="divide-y divide-site-border">
              {completed.map((item) => (
                <div key={item.id} className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="font-semibold text-site-heading">{item.survey.title}</div>
                    <div className="mt-1 text-sm text-site-muted">{formatDate(item.completedAt)}</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                    <div className={[
                      "text-base font-semibold tabular-nums",
                      item.status === "COMPLETED" && item.isValid ? "text-green-600 dark:text-green-400" : "text-site-muted",
                    ].join(" ")}>
                      {item.status === "COMPLETED" && item.isValid
                        ? `+${Number(item.survey.reward ?? 0)} ₽`
                        : "Без начисления"}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setComplaintError(null);
                        setComplaintSuccess(null);
                        setComplaintReason("");
                        setComplaintDetails("");
                        setComplaintSessionId(item.id);
                      }}
                      className="rounded-xl border border-site-border bg-site-section px-4 py-2 text-sm font-semibold text-site-heading transition-colors hover:border-brand/30 hover:text-brand"
                    >
                      Пожаловаться
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState title="Пока нет завершённых опросов" description="После первого завершённого исследования здесь появится история прохождений и начислений." />
        )
      ) : null}

      <Modal
        open={Boolean(complaintSessionId)}
        title="Жалоба по прохождению"
        onClose={() => {
          setComplaintSessionId(null);
          setComplaintError(null);
          setComplaintSuccess(null);
        }}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setComplaintSessionId(null)}
              className="rounded-xl border border-site-border bg-site-card px-5 py-2.5 text-sm font-semibold text-site-heading transition-colors hover:bg-site-section"
            >
              Отмена
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={submitComplaint}
              className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-mid disabled:opacity-60"
            >
              Отправить жалобу
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="text-sm text-site-muted">
            {complaintTarget ? `Опрос: ${complaintTarget.survey.title}` : "Опишите проблему с прохождением"}
          </div>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-site-muted">Причина</span>
            <select
              value={complaintReason}
              onChange={(event) => setComplaintReason(event.target.value)}
              className="h-12 rounded-xl border border-site-border bg-site-card px-4 text-base text-site-body outline-none focus:border-brand/40"
            >
              <option value="">Выберите причину</option>
              <option value="Некорректные вопросы">Некорректные вопросы</option>
              <option value="Техническая проблема">Техническая проблема</option>
              <option value="Неверное начисление">Неверное начисление</option>
              <option value="Другое">Другое</option>
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-site-muted">Подробности</span>
            <textarea
              value={complaintDetails}
              onChange={(event) => setComplaintDetails(event.target.value)}
              className="min-h-[140px] rounded-xl border border-site-border bg-site-card px-4 py-3 text-base text-site-body outline-none focus:border-brand/40"
              placeholder="Кратко опишите, что пошло не так."
            />
          </label>

          {complaintError ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm font-medium text-red-500">
              {complaintError}
            </div>
          ) : null}

          {complaintSuccess ? (
            <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-3 text-sm font-medium text-green-600 dark:text-green-400">
              {complaintSuccess}
            </div>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}
