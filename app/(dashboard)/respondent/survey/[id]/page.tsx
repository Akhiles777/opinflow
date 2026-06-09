import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import SurveyPlayer from "@/components/survey-player/SurveyPlayer";
import { prisma } from "@/lib/prisma";
import { mapSurveyQuestion } from "@/lib/survey-mappers";

export default async function RespondentSurveyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/respondent/survey/${id}`);
  }

  if (session.user.role !== "RESPONDENT") {
    redirect("/");
  }

  const survey = await prisma.survey.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      reward: true,
      status: true,
      startsAt: true,
      endsAt: true,
      maxResponses: true,
      questions: { orderBy: { order: "asc" } },
      _count: {
        select: {
          sessions: {
            where: { status: "COMPLETED", isValid: true },
          },
        },
      },
    },
  });

  if (!survey) {
    notFound();
  }

  const now = new Date();
  const reachedLimit = survey.maxResponses ? survey._count.sessions >= survey.maxResponses : false;

  if (
    survey.status !== "ACTIVE" ||
    reachedLimit ||
    (survey.startsAt && survey.startsAt > now) ||
    (survey.endsAt && survey.endsAt <= now)
  ) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6 py-12">
        <div className="w-full max-w-xl rounded-2xl border border-dash-border bg-dash-card p-8 text-center">
          <h1 className="text-2xl font-bold text-dash-heading lg:text-3xl">Опрос недоступен</h1>
          <p className="mt-3 text-base leading-relaxed text-dash-muted">
            Этот опрос сейчас не активен, уже завершён или временно недоступен. Вернитесь к ленте и выберите другой.
          </p>
          <Link
            href="/respondent/feed"
            className="mt-7 inline-flex rounded-xl border border-dash-border bg-dash-bg px-6 py-3 text-sm font-semibold text-dash-heading transition-colors hover:bg-dash-card"
          >
            Вернуться к ленте
          </Link>
        </div>
      </div>
    );
  }

  const existingSession = await prisma.surveySession.findUnique({
    where: { surveyId_userId: { surveyId: id, userId: session.user.id } },
    select: { id: true, status: true },
  });

  if (existingSession && existingSession.status !== "IN_PROGRESS") {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6 py-12">
        <div className="w-full max-w-xl rounded-2xl border border-dash-border bg-dash-card p-8 text-center">
          <h1 className="text-2xl font-bold text-dash-heading lg:text-3xl">Вы уже проходили этот опрос</h1>
          <p className="mt-3 text-base leading-relaxed text-dash-muted">
            Ответы по этому исследованию уже отправлены. Можно вернуться в ленту и найти новые задания.
          </p>
          <Link
            href="/respondent/feed"
            className="mt-7 inline-flex rounded-xl border border-dash-border bg-dash-bg px-6 py-3 text-sm font-semibold text-dash-heading transition-colors hover:bg-dash-card"
          >
            Назад к ленте
          </Link>
        </div>
      </div>
    );
  }

  return (
    <SurveyPlayer
      survey={{
        id: survey.id,
        title: survey.title,
        reward: survey.reward ? Number(survey.reward) : null,
        questions: survey.questions.map(mapSurveyQuestion),
      }}
      existingSessionId={existingSession?.id ?? null}
    />
  );
}
