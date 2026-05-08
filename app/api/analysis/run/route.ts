import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { analyzeSurveyResponses } from "@/lib/ai-analysis";

export const maxDuration = 60;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "CLIENT") {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { surveyId?: string } | null;
  const surveyId = body?.surveyId;
  if (!surveyId) {
    return NextResponse.json({ error: "SURVEY_ID_REQUIRED" }, { status: 400 });
  }

  const survey = await prisma.survey.findUnique({
    where: { id: surveyId },
    select: {
      id: true,
      creatorId: true,
      title: true,
      category: true,
      questions: {
        select: {
          id: true,
          title: true,
          type: true,
        },
      },
      sessions: {
        where: {
          status: "COMPLETED",
          isValid: true,
        },
        select: {
          answers: {
            select: {
              questionId: true,
              value: true,
            },
          },
        },
      },
    },
  });

  if (!survey || survey.creatorId !== session.user.id) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  if (survey.sessions.length === 0) {
    return NextResponse.json({ error: "NO_DATA_FOR_ANALYSIS" }, { status: 400 });
  }

  await prisma.surveyAnalysis.upsert({
    where: { surveyId },
    create: {
      surveyId,
      status: "PROCESSING",
    },
    update: {
      status: "PROCESSING",
      summary: null,
      error: null,
    },
  });

  try {
    const openTextQuestions = survey.questions.filter((question) => question.type === "OPEN_TEXT");
    const openAnswers = openTextQuestions
      .map((question) => ({
        questionTitle: question.title,
        answers: survey.sessions
          .flatMap((sessionItem) => sessionItem.answers)
          .filter((answer) => answer.questionId === question.id)
          .map((answer) => (typeof answer.value === "string" ? answer.value.trim() : ""))
          .filter(Boolean),
      }))
      .filter((group) => group.answers.length > 0);

    const result = await analyzeSurveyResponses({
      surveyTitle: survey.title,
      surveyCategory: survey.category,
      openAnswers,
    });

    await prisma.surveyAnalysis.update({
      where: { surveyId },
      data: {
        status: "COMPLETED",
        themes: result.themes,
        sentimentData: result.sentiment,
        wordCloud: result.wordCloud,
        summary: result.summary,
        keyInsights: result.keyInsights,
        generatedAt: new Date(),
        error: null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI_ANALYSIS_FAILED";
    await prisma.surveyAnalysis.update({
      where: { surveyId },
      data: {
        status: "FAILED",
        error: message,
      },
    });
    return NextResponse.json({ error: "AI_ANALYSIS_FAILED", details: message }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
