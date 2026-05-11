import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";


function isMissingDiagnosticsColumnError(error: unknown): boolean {
  const msg = (error instanceof Error ? error.message : String(error)).toLowerCase();
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2022") {
    return true;
  }
  return (
    (msg.includes("column") && msg.includes("diagnostics")) ||
    (msg.includes("diagnostics") && msg.includes("does not exist"))
  );
}





export async function fetchSurveyAnalysisDiagnostics(surveyId: string): Promise<unknown | null> {
  try {
    const rows = await prisma.$queryRaw<Array<{ diagnostics: unknown }>>`
      SELECT diagnostics FROM survey_analyses WHERE "surveyId" = ${surveyId} LIMIT 1
    `;
    return rows[0]?.diagnostics ?? null;
  } catch {
    return null;
  }
}

export async function updateSurveyAnalysisWithDiagnosticsFallback(params: {
  surveyId: string;
  data: {
    status: "COMPLETED" | "FAILED" | "PROCESSING" | "PENDING";
    themes?: Prisma.InputJsonValue;
    sentimentData?: Prisma.InputJsonValue;
    wordCloud?: Prisma.InputJsonValue;
    summary?: string | null;
    keyInsights?: Prisma.InputJsonValue;
    generatedAt?: Date | null;
    error?: string | null;
    diagnostics?: Prisma.InputJsonValue | typeof Prisma.DbNull;
  };
}): Promise<void> {
  const { surveyId, data } = params;
  if (data.diagnostics === undefined) {
    await prisma.surveyAnalysis.update({ where: { surveyId }, data });
    return;
  }

  const { diagnostics, ...rest } = data;
  const withDiag = { ...rest, diagnostics };

  try {
    await prisma.surveyAnalysis.update({
      where: { surveyId },
      data: withDiag,
    });
  } catch (error) {
    if (!isMissingDiagnosticsColumnError(error)) {
      throw error;
    }
    await prisma.surveyAnalysis.update({
      where: { surveyId },
      data: rest,
    });
  }
}
