"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-utils";
import { analyzeSurveyResponses } from "@/lib/ai-analysis";
import type { AnalysisResult, ThemeItem } from "@/lib/ai-analysis";

function parseJsonArray<T>(value: unknown, fallback: T[] = []) {
  return Array.isArray(value) ? (value as T[]) : fallback;
}

function parseJsonObject<T>(value: unknown, fallback: T) {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as T) : fallback;
}

export async function runAnalysisAction(surveyId: string) {
  const session = await requireRole("CLIENT");

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
    return { error: "Опрос не найден" };
  }

  if (survey.sessions.length === 0) {
    return { error: "Для анализа пока нет завершённых валидных ответов" };
  }

  await prisma.surveyAnalysis.upsert({
    where: { surveyId },
    create: {
      surveyId,
      status: "PROCESSING",
    },
    update: {
      status: "PROCESSING",
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
    const message = error instanceof Error ? error.message : "Неизвестная ошибка анализа";
    await prisma.surveyAnalysis.update({
      where: { surveyId },
      data: {
        status: "FAILED",
        error: message,
      },
    });
    revalidatePath(`/client/surveys/${surveyId}`);
    return { error: "Не удалось завершить ИИ-анализ" };
  }

  revalidatePath(`/client/surveys/${surveyId}`);
  return { success: true };
}

export async function generatePDFAction(surveyId: string) {
  await requireRole("CLIENT");
  return {
    error: `Скачивание PDF перенесено на прямой endpoint /api/reports/${surveyId}/download`,
  };
}
