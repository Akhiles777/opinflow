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
  if (params.tab === "mine" || params.tab === "completed") {
    const query = params.tab ? `?tab=${encodeURIComponent(params.tab)}` : "";
    redirect(`/respondent/surveys${query}`);
  }

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

  const initialTab = "available";
  const showIntro = inProgress.length === 0 && completed.length === 0;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-site-bg px-6 pb-10 pt-4 text-site-body lg:px-8 lg:pb-12 lg:pt-5">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-5 border-b border-site-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            <div className="text-sm font-semibold uppercase tracking-[0.22em] text-site-muted">Лента опросов</div>
            <h1 className="mt-3 font-display text-4xl font-bold text-site-heading sm:text-5xl">
              Выбирайте исследования и проходите их в удобном темпе
            </h1>
            <p className="mt-4 text-base leading-relaxed text-site-muted">
              Здесь собраны все доступные исследования, незавершённые прохождения и история завершённых опросов
              без лишних элементов кабинета.
            </p>
          </div>

          <Link
            href="/respondent"
            className="inline-flex items-center justify-center rounded-2xl border border-site-border bg-site-card px-5 py-3 text-sm font-semibold text-site-heading transition-colors hover:bg-site-section"
          >
            Вернуться в кабинет
          </Link>
        </div>

        <div className="mt-6">
          <SurveyFeedClient
            userId={session.user.id}
            available={available}
            inProgress={inProgress}
            completed={completed}
            initialTab={initialTab}
            showIntro={showIntro}
            mode="feed"
          />
        </div>
      </div>
    </div>
  );
}
