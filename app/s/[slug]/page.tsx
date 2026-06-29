import { prisma } from "@/lib/prisma";
import { mapSurveyQuestion } from "@/lib/survey-mappers";
import PublicSurveyPlayer from "@/components/self-service/PublicSurveyPlayer";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const survey = await prisma.survey.findUnique({
    where: { publicLinkSlug: slug },
    select: { title: true },
  });
  return { title: survey?.title ?? "Анкета" };
}

export default async function PublicSurveyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const survey = await prisma.survey.findUnique({
    where: { publicLinkSlug: slug },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      surveyMode: true,
      estimatedTime: true,
      questions: { orderBy: { order: "asc" } },
    },
  });

  if (!survey || (survey.surveyMode ?? "POOL") !== "SELF_SERVICE") notFound();

  if (survey.status !== "ACTIVE") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-site-bg p-6">
        <div className="w-full max-w-md rounded-2xl border border-dash-border bg-dash-card p-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-3xl">
            🔒
          </div>
          <h1 className="text-xl font-bold text-dash-heading">Опрос завершён</h1>
          <p className="mt-2 text-sm text-dash-muted">Этот опрос больше не принимает ответы.</p>
        </div>
      </div>
    );
  }

  const questions = survey.questions.map(mapSurveyQuestion);

  return (
    <div className="min-h-screen bg-site-bg py-10 px-4">
      <div className="mx-auto max-w-2xl">
        <PublicSurveyPlayer
          slug={slug}
          title={survey.title}
          description={survey.description ?? undefined}
          estimatedTime={survey.estimatedTime ?? undefined}
          questions={questions}
        />
      </div>
    </div>
  );
}
