import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateSurveyPDF } from "@/lib/pdf-generator";
import type { AnalysisResult, ThemeItem } from "@/lib/ai-analysis";

function parseJsonArray<T>(value: unknown, fallback: T[] = []) {
  return Array.isArray(value) ? (value as T[]) : fallback;
}

function parseJsonObject<T>(value: unknown, fallback: T) {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as T) : fallback;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ surveyId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "CLIENT") {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { surveyId } = await params;

  const survey = await prisma.survey.findUnique({
    where: { id: surveyId },
    select: {
      id: true,
      creatorId: true,
      title: true,
      category: true,
      questions: { select: { id: true } },
      sessions: {
        where: { status: "COMPLETED", isValid: true },
        select: { timeSpent: true },
      },
      analysis: {
        select: {
          status: true,
          themes: true,
          sentimentData: true,
          wordCloud: true,
          summary: true,
          keyInsights: true,
        },
      },
    },
  });

  if (!survey || survey.creatorId !== session.user.id) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const totalResponses = survey.sessions.length;
  const avgTimeMinutes =
    totalResponses > 0
      ? Math.max(
          1,
          Math.round(
            survey.sessions.reduce((sum, sessionItem) => sum + Number(sessionItem.timeSpent ?? 0), 0) /
              totalResponses /
              60,
          ),
        )
      : 0;

  const analysis: AnalysisResult | null = survey.analysis
    ? {
        themes: parseJsonArray<ThemeItem>(survey.analysis.themes),
        sentiment: parseJsonObject(survey.analysis.sentimentData, {
          positive: 0,
          neutral: 100,
          negative: 0,
        }),
        wordCloud: parseJsonArray<{ word: string; weight: number }>(survey.analysis.wordCloud),
        summary: survey.analysis.summary || "ИИ-анализ не запускался.",
        keyInsights: parseJsonArray<string>(survey.analysis.keyInsights),
      }
    : null;

  const analysisReady = survey.analysis?.status === "COMPLETED" && analysis !== null;

  if (!analysisReady) {
    return NextResponse.json(
      {
        error: "ANALYSIS_NOT_READY",
        message: "Сначала запустите и дождитесь завершения ИИ-анализа, затем скачайте PDF.",
      },
      { status: 409 },
    );
  }

  try {
    const pdfBuffer = await generateSurveyPDF({
      survey: { id: survey.id, title: survey.title, category: survey.category },
      analysis,
      stats: {
        totalResponses,
        completionRate: totalResponses > 0 ? 100 : 0,
        avgTimeMinutes,
        questionCount: survey.questions.length,
      },
    });

    const safeTitle = survey.title.replace(/[^\p{L}\p{N}\-_ ]/gu, "").trim().replace(/\s+/g, "_") || "report";
    const filename = `${safeTitle}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[reports][download-pdf-error]", error);
    return NextResponse.json({ error: "PDF_GENERATION_FAILED" }, { status: 500 });
  }
}
