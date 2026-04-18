import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import SurveyPlayer from "@/components/survey-player/SurveyPlayer";
import { prisma } from "@/lib/prisma";
import { mapSurveyQuestion } from "@/lib/survey-mappers";

export default async function SurveyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/survey/${id}`);
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
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-6 py-12 text-site-body">
        <div className="w-full max-w-xl rounded-3xl border border-site-border bg-site-card p-8 text-center shadow-2xl">
          <h1 className="font-display text-3xl font-bold text-site-heading">Опрос недоступен</h1>
          <p className="mt-3 text-base leading-relaxed text-site-muted">
            Этот опрос сейчас не активен, уже завершён или временно недоступен. Вернитесь к ленте и выберите другой.
          </p>
          <Link href="/surveys" className="mt-7 inline-flex rounded-2xl border border-site-border bg-site-section px-6 py-3 text-sm font-semibold text-site-heading transition-colors hover:bg-site-card">
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
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-6 py-12 text-site-body">
        <div className="w-full max-w-xl rounded-3xl border border-site-border bg-site-card p-8 text-center shadow-2xl">
          <h1 className="font-display text-3xl font-bold text-site-heading">Вы уже проходили этот опрос</h1>
          <p className="mt-3 text-base leading-relaxed text-site-muted">Ответы по этому исследованию уже отправлены. Можно вернуться в ленту и найти новые задания.</p>
          <Link href="/surveys" className="mt-7 inline-flex rounded-2xl border border-site-border bg-site-section px-6 py-3 text-sm font-semibold text-site-heading transition-colors hover:bg-site-card">
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
