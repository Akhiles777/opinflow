import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateSurveyPDF } from "@/lib/pdf-generator";
import type { AnalysisResult, ThemeItem } from "@/lib/ai-analysis";

export const maxDuration = 60;

function parseJsonArray<T>(value: unknown, fallback: T[] = []) {
  return Array.isArray(value) ? (value as T[]) : fallback;
}

function parseJsonObject<T>(value: unknown, fallback: T) {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as T) : fallback;
}

async function buildEmergencyPdf(params: {
  title: string;
  status: string;
  totalResponses: number;
  errorText?: string;
}) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const page = pdf.addPage([595.28, 841.89]);
  let y = 800;
  const x = 40;

  page.drawText("OpinionFlow Report Fallback", { x, y, size: 18, font: bold, color: rgb(0.09, 0.1, 0.15) });
  y -= 28;
  page.drawText(`Survey: ${params.title.slice(0, 80)}`, { x, y, size: 11, font: regular });
  y -= 18;
  page.drawText(`Analysis status: ${params.status}`, { x, y, size: 11, font: regular });
  y -= 18;
  page.drawText(`Responses: ${params.totalResponses}`, { x, y, size: 11, font: regular });
  y -= 24;
  page.drawText("The main PDF engine returned an error.", { x, y, size: 11, font: regular });
  y -= 16;
  page.drawText("This fallback file was generated to avoid download failure.", { x, y, size: 11, font: regular });
  y -= 20;
  if (params.errorText) {
    const line = params.errorText.replace(/[^\x20-\x7E]/g, " ").slice(0, 110);
    page.drawText(`Error: ${line}`, { x, y, size: 10, font: regular, color: rgb(0.42, 0.1, 0.1) });
  }

  return Buffer.from(await pdf.save());
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

    const safeTitle = survey.title
      .normalize("NFKD")
      .replace(/[^\x20-\x7E]/g, "")
      .replace(/[^A-Za-z0-9\-_ ]/g, "")
      .trim()
      .replace(/\s+/g, "_")
      .slice(0, 64);
    const filename = `${safeTitle || `report_${survey.id}`}.pdf`;

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
    const message = error instanceof Error ? error.message : "PDF_GENERATION_FAILED";
    const emergencyBuffer = await buildEmergencyPdf({
      title: survey.title || survey.id,
      status: survey.analysis?.status || "UNKNOWN",
      totalResponses,
      errorText: message,
    });
    return new NextResponse(new Uint8Array(emergencyBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="report_${survey.id}_fallback.pdf"`,
        "Cache-Control": "no-store",
        "X-Report-Fallback": "1",
      },
    });
  }
}
