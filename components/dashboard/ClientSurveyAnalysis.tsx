"use client";

import { useEffect, useTransition } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { runAnalysisAction } from "@/actions/analysis";

type Props = {
  surveyId: string;
  analysis: {
    status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
    error: string | null;
    pdfUrl: string | null;
    themes: Array<{
      theme: string;
      count: number;
      sentiment: "positive" | "negative" | "neutral";
      examples: string[];
    }>;
    sentiment: { positive: number; neutral: number; negative: number };
    summary: string | null;
    keyInsights: string[];
  } | null;
};

function sentimentColor(sentiment: "positive" | "negative" | "neutral") {
  return sentiment === "positive" ? "bg-green-500" : sentiment === "negative" ? "bg-red-500" : "bg-slate-400";
}

function getFilledSegments(value: number, total: number, segments = 12) {
  if (total <= 0 || value <= 0) return 0;
  return Math.max(0, Math.min(segments, Math.round((value / total) * segments)));
}

export default function ClientSurveyAnalysis({ surveyId, analysis }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isRunning, startRunTransition] = useTransition();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {
    if (analysis?.status !== "PROCESSING") {
      return;
    }

    const timer = window.setInterval(() => {
      router.refresh();
    }, 5000);

    return () => window.clearInterval(timer);
  }, [analysis?.status, router]);

  function handleRunAnalysis() {
    setError(null);
    startRunTransition(async () => {
      const result = await runAnalysisAction(surveyId);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
      window.setTimeout(() => router.refresh(), 15000);
    });
  }

  function handleGeneratePdf() {
    setError(null);
    setIsGeneratingPdf(true);
    (async () => {
      try {
        const response = await fetch(`/api/reports/${surveyId}/download`, { method: "GET" });
        if (!response.ok) {
          if (response.status === 409) {
            setError("Сначала запустите и дождитесь завершения ИИ-анализа.");
            return;
          }
          setError("Не удалось скачать PDF-отчёт");
          return;
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${surveyId}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      } catch {
        setError("Не удалось скачать PDF-отчёт");
      } finally {
        setIsGeneratingPdf(false);
      }
    })().catch(() => {
      setError("Не удалось скачать PDF-отчёт");
      setIsGeneratingPdf(false);
    });
  }

  if (!analysis || analysis.status === "PENDING" || analysis.status === "FAILED") {
    return (
      <div className="rounded-2xl border border-dash-border bg-dash-card p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-semibold text-dash-heading">ИИ-аналитика</div>
            <div className="mt-2 text-sm text-dash-muted">
              {analysis?.status === "FAILED"
                ? analysis.error || "Не удалось завершить ИИ-анализ."
                : "Запустите анализ завершённых ответов через Gemini Flash."}
            </div>
          </div>
          <button
            type="button"
            onClick={handleRunAnalysis}
            disabled={isRunning}
            className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-mid disabled:opacity-60"
          >
            {isRunning ? "Запускаем..." : analysis?.status === "FAILED" ? "Попробовать снова" : "Запустить ИИ-анализ"}
          </button>
        </div>
        {error ? <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-500">{error}</div> : null}
      </div>
    );
  }

  if (analysis.status === "PROCESSING") {
    return (
      <div className="rounded-2xl border border-dash-border bg-dash-card p-6">
        <div className="text-sm font-semibold text-dash-heading">ИИ-аналитика</div>
        <div className="mt-4 flex items-center gap-3 text-sm text-dash-muted">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-dash-border border-t-brand" />
          ИИ анализирует ответы...
        </div>
        {error ? <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-500">{error}</div> : null}
      </div>
    );
  }

  const totalSentiment =
    analysis.sentiment.positive + analysis.sentiment.neutral + analysis.sentiment.negative || 1;
  const positiveSegments = getFilledSegments(analysis.sentiment.positive, totalSentiment);
  const neutralSegments = Math.min(12 - positiveSegments, getFilledSegments(analysis.sentiment.neutral, totalSentiment));
  const negativeSegments = Math.max(0, 12 - positiveSegments - neutralSegments);

  return (
    <div className="rounded-2xl border border-dash-border bg-dash-card p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-sm font-semibold text-dash-heading">ИИ-аналитика</div>
          <div className="mt-2 text-sm text-dash-muted">Автоматическая сводка по открытым ответам, темам и настроению респондентов.</div>
        </div>
        <button
          type="button"
          onClick={handleRunAnalysis}
          disabled={isRunning || isGeneratingPdf}
          className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-mid disabled:opacity-60"
        >
          {isRunning ? "Перезапускаем..." : "Запустить анализ заново"}
        </button>
        <button
          type="button"
          onClick={handleGeneratePdf}
          disabled={isGeneratingPdf || isRunning}
          className="rounded-xl border border-dash-border bg-dash-bg px-5 py-3 text-sm font-semibold text-dash-heading transition-colors hover:border-brand/30 hover:text-brand disabled:opacity-60"
        >
          {isGeneratingPdf ? "Генерируем PDF..." : "Скачать PDF отчёт"}
        </button>
      </div>
      {error ? <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-500">{error}</div> : null}

      <div className="mt-8 space-y-8">
        <div>
          <div className="text-sm font-semibold text-dash-heading">Тональность</div>
          <div className="mt-4 grid grid-cols-12 gap-1">
            {Array.from({ length: positiveSegments }, (_, index) => (
              <div key={`positive-${index}`} className="h-4 rounded-full bg-green-500" />
            ))}
            {Array.from({ length: neutralSegments }, (_, index) => (
              <div key={`neutral-${index}`} className="h-4 rounded-full bg-slate-400" />
            ))}
            {Array.from({ length: negativeSegments }, (_, index) => (
              <div key={`negative-${index}`} className="h-4 rounded-full bg-red-500" />
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-dash-muted">
            <span>Позитивно: {analysis.sentiment.positive}%</span>
            <span>Нейтрально: {analysis.sentiment.neutral}%</span>
            <span>Негативно: {analysis.sentiment.negative}%</span>
          </div>
        </div>

        <div>
          <div className="text-sm font-semibold text-dash-heading">Ключевые темы</div>
          <div className="mt-4 grid gap-4">
            {analysis.themes
              .slice()
              .sort((left, right) => right.count - left.count)
              .map((theme) => (
                <div key={theme.theme} className="rounded-2xl border border-dash-border bg-dash-bg p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-base font-semibold text-dash-heading">{theme.theme}</div>
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${sentimentColor(theme.sentiment)}`} />
                      <span className="text-sm text-dash-muted">{theme.count}</span>
                    </div>
                  </div>
                  {theme.examples.length > 0 ? (
                    <ul className="mt-3 grid gap-2 pl-5 text-sm text-dash-muted">
                      {theme.examples.map((example, index) => (
                        <li key={`${theme.theme}-${index}`} className="list-disc">{example}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))}
          </div>
        </div>

        <div>
          <div className="text-sm font-semibold text-dash-heading">Ключевые инсайты</div>
          <div className="mt-4 grid gap-3">
            {analysis.keyInsights.map((item, index) => (
              <div key={`${index + 1}-${item}`} className="rounded-r-2xl border-l-[3px] border-brand bg-dash-bg px-4 py-3 text-sm text-dash-body">
                <span className="font-semibold text-dash-heading">{index + 1}.</span> {item}
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="text-sm font-semibold text-dash-heading">Общий вывод</div>
          <div className="mt-4 rounded-2xl border border-dash-border bg-dash-bg p-4 text-sm leading-relaxed text-dash-body">
            {analysis.summary || "ИИ ещё не сформировал текстовый вывод."}
          </div>
        </div>
      </div>
    </div>
  );
}
