import PageHeader from "@/components/dashboard/PageHeader";
import SurveyFeedClient from "@/components/respondent/SurveyFeedClient";
import { requireRole } from "@/lib/auth-utils";
import { getCompletedSurveys, getInProgressSurveys } from "@/lib/survey-feed";

export default async function RespondentMySurveysPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const session = await requireRole("RESPONDENT");
  const params = (await searchParams) ?? {};

  const [inProgressRaw, completedRaw] = await Promise.all([
    getInProgressSurveys(session.user.id),
    getCompletedSurveys(session.user.id),
  ]);

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

  const initialTab = params.tab === "completed" ? "completed" : "inprogress";

  return (
    <div>
      <PageHeader
        title="Мои опросы"
        subtitle="Здесь собраны незавершённые прохождения с таймером и история завершённых опросов с возможностью отправить жалобу."
      />

      <div className="mt-8">
        <SurveyFeedClient
          userId={session.user.id}
          available={[]}
          inProgress={inProgress}
          completed={completed}
          initialTab={initialTab}
          showIntro={false}
          mode="mine"
        />
      </div>
    </div>
  );
}
