import { notFound } from "next/navigation";
import Badge from "@/components/dashboard/Badge";
import ClientSurveyActions from "@/components/dashboard/ClientSurveyActions";
import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import { requireRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { getSurveyStatusMeta } from "@/lib/survey-mappers";

function daysLeft(date: Date | null) {
  if (!date) return "—";
  const diff = Math.ceil((date.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  return diff > 0 ? `${diff}` : "0";
}

export default async function ClientSurveyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("CLIENT");
  const { id } = await params;

  const survey = await prisma.survey.findUnique({
    where: { id },
    include: {
      questions: { orderBy: { order: "asc" } },
      sessions: {
        orderBy: { startedAt: "desc" },
        select: { id: true, status: true, isValid: true, completedAt: true },
      },
    },
  });

  if (!survey || survey.creatorId !== session.user.id) {
    notFound();
  }

  const statusMeta = getSurveyStatusMeta(survey.status);
  const completedCount = survey.sessions.filter((item) => item.status === "COMPLETED" && item.isValid).length;
  const targetCount = survey.maxResponses ?? 0;
  const progress = targetCount > 0 ? Math.min((completedCount / targetCount) * 100, 100) : 0;
  const filledSegments = Math.max(0, Math.min(12, Math.round(progress / (100 / 12))));
  const spent = survey.budget ? Number(survey.budget) : 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title={survey.title}
        subtitle={survey.description ?? "Статистика по опросу, прогресс набора и список вопросов без режима редактирования."}
        right={<ClientSurveyActions surveyId={survey.id} status={survey.status} />}
      />

      <div className="flex items-center gap-3">
        <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
        <span className="text-sm text-dash-muted">Создан {new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "long", year: "numeric" }).format(survey.createdAt)}</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Ответов собрано" value={String(completedCount)} />
        <StatCard label="Из нужных" value={survey.maxResponses ? `${completedCount} / ${survey.maxResponses}` : `${completedCount}`} />
        <StatCard label="Осталось дней" value={daysLeft(survey.endsAt)} />
        <StatCard label="Потрачено бюджета" value={`${spent.toLocaleString("ru-RU")} ₽`} />
      </div>

      <div className="rounded-2xl border border-dash-border bg-dash-card p-6">
        <div className="flex items-center justify-between gap-3 text-sm text-dash-muted">
          <span>Прогресс сбора</span>
          <span>{completedCount} / {survey.maxResponses ?? "∞"}</span>
        </div>
        <div className="mt-4 grid grid-cols-12 gap-1">
          {Array.from({ length: 12 }, (_, index) => (
            <div
              key={`detail-progress-${index}`}
              className={[
                "h-3 rounded-full transition-colors",
                index < filledSegments ? "bg-brand" : "bg-dash-bg",
              ].join(" ")}
            />
          ))}
        </div>
      </div>

      {survey.status === "REJECTED" && survey.moderationNote ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-red-500">
          <div className="text-sm font-semibold uppercase tracking-[0.18em]">Причина отклонения</div>
          <div className="mt-2 text-base text-red-600 dark:text-red-300">{survey.moderationNote}</div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-dash-border bg-dash-card p-6">
        <div className="text-sm font-semibold text-dash-heading">Список вопросов</div>
        <div className="mt-5 grid gap-3">
          {survey.questions.map((question, index) => (
            <div key={question.id} className="rounded-2xl border border-dash-border bg-dash-bg p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Вопрос {index + 1}</div>
              <div className="mt-2 text-base font-semibold text-dash-heading">{question.title}</div>
              {question.description ? <div className="mt-2 text-sm text-dash-muted">{question.description}</div> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
