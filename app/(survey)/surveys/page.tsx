import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import SurveyFeedClient from "@/components/respondent/SurveyFeedClient";
import { getCompletedSurveys, getInProgressSurveys, getSurveyFeed } from "@/lib/survey-feed";

export default async function SurveysFeedPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/surveys");
  }

  if (session.user.role !== "RESPONDENT") {
    redirect("/");
  }

  const params = (await searchParams) ?? {};
  const [availableRaw, inProgressRaw, completedRaw] = await Promise.all([
    getSurveyFeed(session.user.id),
    getInProgressSurveys(session.user.id),
    getCompletedSurveys(session.user.id),
  ]);

  const available = availableRaw.map((survey) => ({
    ...survey,
    reward: survey.reward ? Number(survey.reward) : null,
  }));

  const inProgress = inProgressRaw.map((entry) => ({
    ...entry,
    survey: {
      ...entry.survey,
      reward: entry.survey.reward ? Number(entry.survey.reward) : null,
    },
  }));

  const completed = completedRaw.map((entry) => ({
    ...entry,
    status: (entry.status === "REJECTED" ? "REJECTED" : "COMPLETED") as "REJECTED" | "COMPLETED",
    survey: {
      ...entry.survey,
      reward: entry.survey.reward ? Number(entry.survey.reward) : null,
    },
  }));

  const initialTab =
    params.tab === "mine"
      ? "inprogress"
      : params.tab === "completed"
        ? "completed"
        : "available";
  const showIntro = inProgress.length === 0 && completed.length === 0;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-surface-950 px-6 py-10 text-white lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-5 border-b border-white/8 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            <div className="text-sm font-semibold uppercase tracking-[0.22em] text-white/35">Лента опросов</div>
            <h1 className="mt-3 font-display text-4xl font-bold text-white sm:text-5xl">
              Выбирайте исследования и проходите их в удобном темпе
            </h1>
            <p className="mt-4 text-base leading-relaxed text-white/55">
              Здесь собраны все доступные исследования, незавершённые прохождения и история завершённых опросов
              без лишних элементов кабинета.
            </p>
          </div>

          <Link
            href="/respondent"
            className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            Вернуться в кабинет
          </Link>
        </div>

        <div className="mt-8">
          <SurveyFeedClient
            userId={session.user.id}
            available={available}
            inProgress={inProgress}
            completed={completed}
            initialTab={initialTab}
            showIntro={showIntro}
          />
        </div>
      </div>
    </div>
  );
}
