import PageHeader from "@/components/dashboard/PageHeader";
import SurveyFeedClient from "@/components/respondent/SurveyFeedClient";
import { requireRole } from "@/lib/auth-utils";
import { getCompletedSurveys, getInProgressSurveys, getSurveyFeed } from "@/lib/survey-feed";

export default async function RespondentSurveysPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const session = await requireRole("RESPONDENT");
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

  return (
    <div>
      <PageHeader
        title="Лента опросов"
        subtitle="Здесь собраны доступные исследования, активные прохождения и ваша история завершённых опросов."
      />

      <div className="mt-8">
        <SurveyFeedClient available={available} inProgress={inProgress} completed={completed} initialTab={initialTab} />
      </div>
    </div>
  );
}
