import { requireRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/dashboard/PageHeader";
import ResponsesModerationClient from "@/components/dashboard/ResponsesModerationClient";

export default async function ResponsesModerationPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string; survey?: string }>;
}) {
  await requireRole("ADMIN");
  const params = (await searchParams) ?? {};
  const activeTab = params.tab === "approved" ? "approved" : params.tab === "rejected" ? "rejected" : "pending";
  const surveyFilter = params.survey;

  const statusMap = { pending: "PENDING", approved: "APPROVED", rejected: "REJECTED" } as const;

  const [responses, pendingCount, approvedCount, rejectedCount, surveys] = await Promise.all([
    prisma.surveyResponse.findMany({
      where: {
        moderationStatus: statusMap[activeTab],
        ...(surveyFilter ? { surveyId: surveyFilter } : {}),
      },
      select: {
        id: true,
        moderationStatus: true,
        moderationNote: true,
        moderatedAt: true,
        createdAt: true,
        survey: {
          select: {
            id: true,
            title: true,
            reward: true,
            questions: {
              orderBy: { order: "asc" },
              select: {
                id: true,
                order: true,
                type: true,
                title: true,
                options: true,
                settings: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            respondentProfile: { select: { isVerified: true } },
          },
        },
        session: {
          select: {
            id: true,
            isValid: true,
            fraudFlags: true,
            timeSpent: true,
            completedAt: true,
            answers: {
              orderBy: { question: { order: "asc" } },
              select: {
                value: true,
                question: {
                  select: { id: true, order: true, type: true, title: true, options: true, settings: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.surveyResponse.count({ where: { moderationStatus: "PENDING" } }),
    prisma.surveyResponse.count({ where: { moderationStatus: "APPROVED" } }),
    prisma.surveyResponse.count({ where: { moderationStatus: "REJECTED" } }),
    prisma.survey.findMany({
      where: { responses: { some: {} } },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    }),
  ]);

  const serialized = responses.map((r) => ({
    ...r,
    survey: {
      ...r.survey,
      reward: r.survey.reward ? Number(r.survey.reward) : null,
      questions: r.survey.questions.map((q) => ({
        ...q,
        options: q.options as string[] | null,
        settings: q.settings as Record<string, any> | null,
      })),
    },
    moderatedAt: r.moderatedAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    session: r.session
      ? {
          ...r.session,
          completedAt: r.session.completedAt?.toISOString() ?? null,
          answers: r.session.answers.map((a) => ({
            value: a.value,
            question: {
              ...a.question,
              options: a.question.options as string[] | null,
              settings: a.question.settings as Record<string, any> | null,
            },
          })),
        }
      : null,
  }));

  return (
    <div>
      <PageHeader
        title="Проверка ответов"
        subtitle="Просматривайте ответы респондентов и принимайте решение по выплате вознаграждения."
      />
      <div className="mt-8">
        <ResponsesModerationClient
          responses={serialized}
          activeTab={activeTab}
          counts={{ pending: pendingCount, approved: approvedCount, rejected: rejectedCount }}
          surveys={surveys}
          surveyFilter={surveyFilter}
        />
      </div>
    </div>
  );
}
