import { notFound } from "next/navigation";
import Badge from "@/components/dashboard/Badge";
import ClientSurveyActions from "@/components/dashboard/ClientSurveyActions";
import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import { requireRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { getSurveyStatusMeta, mapSurveyQuestion } from "@/lib/survey-mappers";

function formatDateTime(date: Date | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatDuration(seconds: number) {
  const safe = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  return minutes > 0 ? `${minutes} мин ${String(rest).padStart(2, "0")} сек` : `${rest} сек`;
}

function getDaysLeft(date: Date | null) {
  if (!date) return "—";
  const diff = Math.ceil((date.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  return diff > 0 ? String(diff) : "0";
}

function getAgeGroup(date: Date | null | undefined) {
  if (!date) return "Не указан";
  const age = Math.floor((Date.now() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  if (age < 25) return "18–24";
  if (age < 35) return "25–34";
  if (age < 45) return "35–44";
  if (age < 55) return "45–54";
  return "55+";
}

function incrementCount(map: Record<string, number>, key: string) {
  map[key] = (map[key] ?? 0) + 1;
}

function percent(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}

function getFilledSegments(value: number, total: number, segments = 12) {
  if (total <= 0 || value <= 0) return 0;
  return Math.max(0, Math.min(segments, Math.round((value / total) * segments)));
}

function normalizeAnswerValue(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return null;
}

function getLatestValidCompletion(
  sessions: Array<{ status: string; isValid: boolean; completedAt: Date | null }>,
) {
  return sessions
    .filter((item) => item.status === "COMPLETED" && item.isValid && item.completedAt)
    .sort((left, right) => (right.completedAt?.getTime() ?? 0) - (left.completedAt?.getTime() ?? 0))[0]?.completedAt ?? null;
}

function DistributionBar({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  const filledSegments = getFilledSegments(value, total);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="min-w-0 truncate text-dash-body">{label}</span>
        <span className="shrink-0 tabular-nums text-dash-muted">
          {value} · {percent(value, total)}%
        </span>
      </div>
      <div className="grid grid-cols-12 gap-1">
        {Array.from({ length: 12 }, (_, index) => (
          <div
            key={`${label}-${index}`}
            className={[
              "h-2 rounded-full transition-colors",
              index < filledSegments ? "bg-brand" : "bg-dash-border",
            ].join(" ")}
          />
        ))}
      </div>
    </div>
  );
}

export default async function ClientSurveyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("CLIENT");
  const { id } = await params;

  const survey = await prisma.survey.findUnique({
    where: { id },
    include: {
      creator: {
        select: {
          clientProfile: {
            select: {
              companyName: true,
            },
          },
        },
      },
      questions: {
        orderBy: { order: "asc" },
        include: {
          answers: {
            where: {
              session: {
                status: "COMPLETED",
                isValid: true,
              },
            },
            orderBy: { createdAt: "desc" },
            select: {
              value: true,
              session: {
                select: {
                  completedAt: true,
                },
              },
            },
          },
        },
      },
      sessions: {
        orderBy: { startedAt: "desc" },
        select: {
          id: true,
          status: true,
          isValid: true,
          startedAt: true,
          completedAt: true,
          timeSpent: true,
          user: {
            select: {
              respondentProfile: {
                select: {
                  gender: true,
                  birthDate: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!survey || survey.creatorId !== session.user.id) {
    notFound();
  }

  const statusMeta = getSurveyStatusMeta(survey.status);
  const completedSessions = survey.sessions.filter((item) => item.status === "COMPLETED" && item.isValid);
  const completedCount = completedSessions.length;
  const startedCount = survey.sessions.length;
  const progressTotal = survey.maxResponses ?? 0;
  const progressPercent = progressTotal > 0 ? Math.min(Math.round((completedCount / progressTotal) * 100), 100) : 0;
  const filledSegments = getFilledSegments(completedCount, progressTotal || 1);
  const averageTime =
    completedCount > 0
      ? Math.round(
          completedSessions.reduce((sum, item) => sum + Number(item.timeSpent ?? 0), 0) / completedCount,
        )
      : 0;
  const conversion = startedCount > 0 ? Math.round((completedCount / startedCount) * 100) : 0;
  const spent = survey.budget ? Number(survey.budget) : 0;

  const genderMap: Record<string, number> = {};
  const ageMap: Record<string, number> = {};

  for (const sessionItem of completedSessions) {
    incrementCount(genderMap, sessionItem.user.respondentProfile?.gender || "Не указан");
    incrementCount(ageMap, getAgeGroup(sessionItem.user.respondentProfile?.birthDate));
  }

  const analytics = survey.questions.map((rawQuestion) => {
    const question = mapSurveyQuestion(rawQuestion);
    const totalAnswers = rawQuestion.answers.length;

    if (question.type === "SINGLE_CHOICE" || question.type === "MULTIPLE_CHOICE" || question.type === "RANKING") {
      const counts: Record<string, number> = {};
      for (const option of question.options) {
        counts[option] = 0;
      }

      for (const answer of rawQuestion.answers) {
        if (Array.isArray(answer.value)) {
          for (const item of answer.value) {
            if (typeof item === "string") incrementCount(counts, item);
          }
          continue;
        }

        const normalized = normalizeAnswerValue(answer.value);
        if (normalized) incrementCount(counts, normalized);
      }

      return {
        ...question,
        totalAnswers,
        counts,
        recentText: [] as string[],
        matrix: {} as Record<string, Record<string, number>>,
      };
    }

    if (question.type === "SCALE") {
      const min = Number(question.settings.min ?? 1);
      const max = Number(question.settings.max ?? 10);
      const counts: Record<string, number> = {};

      for (let index = min; index <= max; index += 1) {
        counts[String(index)] = 0;
      }

      for (const answer of rawQuestion.answers) {
        const normalized = normalizeAnswerValue(answer.value);
        if (normalized) incrementCount(counts, normalized);
      }

      return {
        ...question,
        totalAnswers,
        counts,
        recentText: [] as string[],
        matrix: {} as Record<string, Record<string, number>>,
      };
    }

    if (question.type === "MATRIX") {
      const matrix: Record<string, Record<string, number>> = {};
      for (const row of question.matrixRows) {
        matrix[row] = {};
        for (const col of question.matrixCols) {
          matrix[row][col] = 0;
        }
      }

      for (const answer of rawQuestion.answers) {
        if (!answer.value || typeof answer.value !== "object" || Array.isArray(answer.value)) continue;

        for (const row of question.matrixRows) {
          const selected = (answer.value as Record<string, unknown>)[row];
          if (typeof selected === "string") incrementCount(matrix[row], selected);
        }
      }

      return {
        ...question,
        totalAnswers,
        counts: {} as Record<string, number>,
        recentText: [] as string[],
        matrix,
      };
    }

    const recentText = rawQuestion.answers
      .map((answer) => (typeof answer.value === "string" ? answer.value.trim() : ""))
      .filter(Boolean)
      .slice(0, 8);

    return {
      ...question,
      totalAnswers,
      counts: {} as Record<string, number>,
      recentText,
      matrix: {} as Record<string, Record<string, number>>,
    };
  });

  const latestValidCompletion = getLatestValidCompletion(survey.sessions);

  return (
    <div className="space-y-8">
      <PageHeader
        title={survey.title}
        subtitle={survey.description ?? "Ответы респондентов, прогресс набора и ключевая статистика по опросу."}
        right={<ClientSurveyActions surveyId={survey.id} status={survey.status} />}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
        <span className="text-sm text-dash-muted">
          Создан{" "}
          {new Intl.DateTimeFormat("ru-RU", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          }).format(survey.createdAt)}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Ответов собрано" value={String(completedCount)} />
        <StatCard label="Конверсия входа" value={`${conversion}%`} />
        <StatCard label="Среднее время" value={completedCount > 0 ? formatDuration(averageTime) : "—"} />
        <StatCard label="Потрачено бюджета" value={`${spent.toLocaleString("ru-RU")} ₽`} />
      </div>

      <div className="rounded-2xl border border-dash-border bg-dash-card p-6">
        <div className="flex items-center justify-between gap-3 text-sm text-dash-muted">
          <span>Прогресс сбора</span>
          <span>
            {completedCount} / {survey.maxResponses ?? "∞"} · {progressPercent}%
          </span>
        </div>
        <div className="mt-4 grid grid-cols-12 gap-1">
          {Array.from({ length: 12 }, (_, index) => (
            <div
              key={`progress-${index}`}
              className={[
                "h-3 rounded-full transition-colors",
                index < filledSegments ? "bg-brand" : "bg-dash-bg",
              ].join(" ")}
            />
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-dash-border bg-dash-card p-6">
          <div className="text-sm font-semibold text-dash-heading">Половозрастное распределение</div>
          <div className="mt-5 grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Пол</div>
              {Object.keys(genderMap).length > 0 ? (
                Object.entries(genderMap).map(([label, value]) => (
                  <DistributionBar key={label} label={label} value={value} total={completedCount} />
                ))
              ) : (
                <div className="text-sm text-dash-muted">Данных пока нет</div>
              )}
            </div>

            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Возраст</div>
              {Object.keys(ageMap).length > 0 ? (
                Object.entries(ageMap).map(([label, value]) => (
                  <DistributionBar key={label} label={label} value={value} total={completedCount} />
                ))
              ) : (
                <div className="text-sm text-dash-muted">Данных пока нет</div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-dash-border bg-dash-card p-6">
          <div className="text-sm font-semibold text-dash-heading">Сводка по опросу</div>
          <div className="mt-5 grid gap-4 text-sm text-dash-body">
            <div className="rounded-2xl border border-dash-border bg-dash-bg p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Компания</div>
              <div className="mt-2 text-base font-semibold text-dash-heading">
                {survey.creator.clientProfile?.companyName || "Компания не указана"}
              </div>
            </div>

            <div className="rounded-2xl border border-dash-border bg-dash-bg p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Последнее валидное прохождение</div>
              <div className="mt-2 text-base font-semibold text-dash-heading">
                {formatDateTime(latestValidCompletion)}
              </div>
            </div>

            <div className="rounded-2xl border border-dash-border bg-dash-bg p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Осталось дней</div>
              <div className="mt-2 text-base font-semibold text-dash-heading">{getDaysLeft(survey.endsAt)}</div>
            </div>
          </div>
        </div>
      </div>

      {survey.status === "REJECTED" && survey.moderationNote ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-red-500">
          <div className="text-sm font-semibold uppercase tracking-[0.18em]">Причина отклонения</div>
          <div className="mt-2 text-base text-red-600 dark:text-red-300">{survey.moderationNote}</div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-dash-border bg-dash-card p-6">
        <div className="text-sm font-semibold text-dash-heading">Ответы по вопросам</div>
        <div className="mt-5 grid gap-4">
          {analytics.map((question, index) => (
            <div key={question.id} className="rounded-2xl border border-dash-border bg-dash-bg p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Вопрос {index + 1}</div>
              <div className="mt-2 text-base font-semibold text-dash-heading">{question.title}</div>
              {question.description ? <div className="mt-2 text-sm text-dash-muted">{question.description}</div> : null}
              <div className="mt-3 text-sm text-dash-muted">Ответов: {question.totalAnswers}</div>

              {(question.type === "SINGLE_CHOICE" ||
                question.type === "MULTIPLE_CHOICE" ||
                question.type === "RANKING" ||
                question.type === "SCALE") ? (
                <div className="mt-5 grid gap-3">
                  {Object.entries(question.counts).map(([label, value]) => (
                    <DistributionBar key={label} label={label} value={value} total={question.totalAnswers} />
                  ))}
                </div>
              ) : null}

              {question.type === "MATRIX" ? (
                <div className="mt-5 grid gap-4">
                  {Object.entries(question.matrix).map(([row, cols]) => (
                    <div key={row} className="rounded-2xl border border-dash-border bg-dash-card p-4">
                      <div className="text-sm font-semibold text-dash-heading">{row}</div>
                      <div className="mt-3 grid gap-3">
                        {Object.entries(cols).map(([label, value]) => (
                          <DistributionBar
                            key={`${row}-${label}`}
                            label={label}
                            value={value}
                            total={question.totalAnswers}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {question.type === "OPEN_TEXT" ? (
                <div className="mt-5 grid gap-3">
                  {question.recentText.length > 0 ? (
                    question.recentText.map((answer, answerIndex) => (
                      <div
                        key={`${question.id}-text-${answerIndex}`}
                        className="rounded-2xl border border-dash-border bg-dash-card p-4 text-sm leading-relaxed text-dash-body"
                      >
                        {answer}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-dash-muted">Открытых ответов пока нет</div>
                  )}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
