import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { buildQuantitativeBlocks } from "@/lib/survey-quantitative";
import { fetchSurveyAnalysisDiagnostics } from "@/lib/analysis-diagnostics-db";
import PageHeader from "@/components/dashboard/PageHeader";
import ClientSurveyAnalysis from "@/components/dashboard/ClientSurveyAnalysis";
import SelfServiceResults from "@/components/self-service/SelfServiceResults";
import Link from "next/link";
import type { AnalysisDiagnostics } from "@/lib/ai-analysis";

export default async function SelfServiceSurveyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("CLIENT");
  const { id } = await params;

  const survey = await prisma.survey.findUnique({
    where: { id, creatorId: session.user.id, surveyMode: "SELF_SERVICE" },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      createdAt: true,
      publicLinkSlug: true,
      aiAnalyticsPaid: true,
      questions: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          type: true,
          title: true,
          description: true,
          required: true,
          mediaUrl: true,
          options: true,
          settings: true,
          logic: true,
          answers: {
            where: { session: { status: "COMPLETED", isValid: true } },
            select: { value: true },
          },
        },
      },
      analysis: {
        select: {
          status: true,
          error: true,
          pdfUrl: true,
          themes: true,
          sentimentData: true,
          summary: true,
          keyInsights: true,
        },
      },
      _count: { select: { responses: true } },
    },
  });

  if (!survey) notFound();

  const wallet = await prisma.wallet.findUnique({
    where: { userId: session.user.id },
    select: { balance: true },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "";
  const quantBlocks = buildQuantitativeBlocks(survey.questions);

  const rawAnalysis = survey.analysis;
  let diagnostics: AnalysisDiagnostics | null = null;
  if (rawAnalysis?.status === "COMPLETED") {
    diagnostics = await fetchSurveyAnalysisDiagnostics(id) as AnalysisDiagnostics | null;
  }

  const analysis = rawAnalysis && survey.aiAnalyticsPaid
    ? {
        status: rawAnalysis.status as "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED",
        error: rawAnalysis.error ?? null,
        pdfUrl: rawAnalysis.pdfUrl ?? null,
        themes: (rawAnalysis.themes as Array<{
          theme: string;
          count: number;
          sentiment: "positive" | "negative" | "neutral";
          examples: string[];
        }>) ?? [],
        sentiment: (rawAnalysis.sentimentData as { positive: number; neutral: number; negative: number }) ?? {
          positive: 0,
          neutral: 0,
          negative: 0,
        },
        summary: rawAnalysis.summary ?? null,
        keyInsights: (rawAnalysis.keyInsights as string[]) ?? [],
        diagnostics,
      }
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/client/surveys/self-service" className="text-sm text-dash-muted hover:text-dash-heading transition-colors">
          ← Анкеты для своей базы
        </Link>
      </div>

      <PageHeader
        title={survey.title}
        subtitle={survey.description ?? undefined}
      />

      {/* Share link + AI purchase */}
      <SelfServiceResults
        surveyId={id}
        slug={survey.publicLinkSlug!}
        baseUrl={baseUrl}
        responseCount={survey._count.responses}
        walletBalance={Number(wallet?.balance ?? 0)}
        aiAnalyticsPaid={survey.aiAnalyticsPaid}
        status={survey.status}
      />

      {/* Quantitative + AI Analysis (always show quant; AI only if paid) */}
      <ClientSurveyAnalysis
        surveyId={id}
        quantitative={quantBlocks}
        analysis={analysis}
        expertReview={null}
        isSelfService={true}
      />
    </div>
  );
}
