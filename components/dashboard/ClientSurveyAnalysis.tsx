"use client";

import { useEffect, useTransition } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AnalysisDiagnostics } from "@/lib/ai-analysis";
import type { QuantQuestionBlock } from "@/lib/survey-quantitative";

type Props = {
  surveyId: string;
  quantitative: QuantQuestionBlock[];
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
    diagnostics: AnalysisDiagnostics | null;
  } | null;
};

function sentimentColor(sentiment: "positive" | "negative" | "neutral") {
  return sentiment === "positive" ? "bg-green-500" : sentiment === "negative" ? "bg-red-500" : "bg-slate-400";
}

function getFilledSegments(value: number, total: number, segments = 12) {
  if (total <= 0 || value <= 0) return 0;
  return Math.max(0, Math.min(segments, Math.round((value / total) * segments)));
}

function QuantitativeSection({ blocks }: { blocks: QuantQuestionBlock[] }) {
  if (!blocks.length) return null;

  return (
    <div className="rounded-2xl border border-dash-border bg-dash-card p-6">
      <div className="text-sm font-semibold text-dash-heading">Количественная аналитика</div>
      <p className="mt-2 text-sm text-dash-muted">
        Распределения по закрытым вопросам (шкалы, выборы, матрицы). Данные обновляются из фактических ответов.
      </p>
      <div className="mt-6 grid gap-8">
        {blocks.map((block) => {
          const maxCount = Math.max(1, ...block.distribution.map((row) => row.count));
          return (
            <div key={block.id} className="rounded-2xl border border-dash-border bg-dash-bg p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="text-base font-semibold text-dash-heading">{block.title}</div>
                <div className="text-xs uppercase tracking-[0.14em] text-dash-muted">
                  {block.type} · ответов: {block.totalAnswers}
                </div>
              </div>
              <div className="mt-4 grid gap-3">
                {block.distribution.slice(0, 12).map((row) => {
                  const pct = block.totalAnswers > 0 ? Math.round((row.count / block.totalAnswers) * 100) : 0;
                  const barWidth = maxCount > 0 ? Math.round((row.count / maxCount) * 100) : 0;
                  return (
                    <div key={`${block.id}-${row.label}`} className="space-y-1.5">
                      <div className="flex justify-between gap-3 text-sm">
                        <span className="min-w-0 flex-1 text-dash-body">{row.label}</span>
                        <span className="shrink-0 tabular-nums text-dash-muted">
                          {row.count} · {pct}%
                        </span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-dash-border">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand to-brand-mid"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SentimentDonut({
  positive,
  neutral,
  negative,
}: {
  positive: number;
  neutral: number;
  negative: number;
}) {
  const total = positive + neutral + negative || 1;
  const p = (positive / total) * 100;
  const u = (neutral / total) * 100;
  const a = p * 3.6;
  const b = (p + u) * 3.6;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-8">
      <div className="relative mx-auto h-40 w-40 shrink-0 sm:mx-0">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(rgb(34 197 94) 0deg ${a}deg, rgb(148 163 184) ${a}deg ${b}deg, rgb(239 68 68) ${b}deg 360deg)`,
          }}
        />
        <div className="absolute inset-[20%] rounded-full bg-dash-card" />
      </div>
      <div className="grid gap-2 text-sm text-dash-muted">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          Позитивно: {positive}%
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
          Нейтрально: {neutral}%
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
          Негативно: {negative}%
        </div>
      </div>
    </div>
  );
}

export default function ClientSurveyAnalysis({ surveyId, analysis, quantitative }: Props) {
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
      const response = await fetch("/api/analysis/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ surveyId }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string; details?: string }
          | null;
        if (payload?.details) {
          setError(`Ошибка анализа: ${payload.details}`);
        } else if (payload?.error === "NO_DATA_FOR_ANALYSIS") {
          setError("Для анализа пока нет завершённых валидных ответов.");
        } else {
          setError("Не удалось завершить ИИ-анализ.");
        }
        return;
      }

      router.refresh();
      window.setTimeout(() => router.refresh(), 4000);
    });
  }

  function handleGeneratePdf() {
    setError(null);
    setIsGeneratingPdf(true);
    (async () => {
      try {
        const response = await fetch(`/api/reports/${surveyId}/download`, { method: "GET" });
        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as
            | { error?: string; message?: string }
            | null;
          if (response.status === 401) {
            setError("Сессия истекла. Обновите страницу и войдите снова.");
            return;
          }
          if (response.status === 409) {
            setError("Сначала запустите и дождитесь завершения ИИ-анализа.");
            return;
          }
          if (payload?.message) {
            setError(`Ошибка PDF: ${payload.message}`);
            return;
          }
          setError("Не удалось скачать PDF-отчёт");
          return;
        }

        const blob = await response.blob();
        const contentDisposition = response.headers.get("content-disposition");
        const fileNameMatch = contentDisposition?.match(/filename=\"?([^\";]+)\"?/i);
        const fileName = fileNameMatch?.[1] || `${surveyId}.pdf`;
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
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

  const analysisReady = analysis?.status === "COMPLETED";

  if (!analysis || analysis.status === "PENDING" || analysis.status === "FAILED") {
    return (
      <div className="space-y-6">
        <QuantitativeSection blocks={quantitative} />
        <div className="rounded-2xl border border-dash-border bg-dash-card p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm font-semibold text-dash-heading">ИИ-аналитика</div>
              <div className="mt-2 text-sm text-dash-muted">
                {analysis?.status === "FAILED"
                  ? analysis.error || "Не удалось завершить ИИ-анализ."
                  : "Запустите анализ открытых ответов: модель свяжет комментарии с графиками закрытых вопросов."}
              </div>
            </div>
            <button
              type="button"
              onClick={handleRunAnalysis}
              disabled={isRunning}
              className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-mid disabled:opacity-60"
            >
              {isRunning ? "Загрузка..." : analysis?.status === "FAILED" ? "Попробовать снова" : "Запустить ИИ-анализ"}
            </button>
          </div>
          {error ? <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-500">{error}</div> : null}
        </div>
      </div>
    );
  }

  if (analysis.status === "PROCESSING") {
    return (
      <div className="space-y-6">
        <QuantitativeSection blocks={quantitative} />
        <div className="rounded-2xl border border-dash-border bg-dash-card p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm font-semibold text-dash-heading">ИИ-аналитика</div>
              <div className="mt-4 flex items-center gap-3 text-sm text-dash-muted">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-dash-border border-t-brand" />
                ИИ анализирует ответы (до минуты при большой выборке)...
              </div>
            </div>
            <button
              type="button"
              disabled
              className="rounded-xl border border-dash-border bg-dash-bg px-5 py-3 text-sm font-semibold text-dash-muted opacity-80"
            >
              Загрузка...
            </button>
          </div>
          {error ? <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-500">{error}</div> : null}
        </div>
      </div>
    );
  }

  const totalSentiment =
    analysis.sentiment.positive + analysis.sentiment.neutral + analysis.sentiment.negative || 1;
  const positiveSegments = getFilledSegments(analysis.sentiment.positive, totalSentiment);
  const neutralSegments = Math.min(12 - positiveSegments, getFilledSegments(analysis.sentiment.neutral, totalSentiment));
  const negativeSegments = Math.max(0, 12 - positiveSegments - neutralSegments);

  return (
    <div className="space-y-6">
      <QuantitativeSection blocks={quantitative} />
      <div className="rounded-2xl border border-dash-border bg-dash-card p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-sm font-semibold text-dash-heading">ИИ-аналитика</div>
            <div className="mt-2 text-sm text-dash-muted">
              Сводка по открытым ответам с рекомендациями, гипотезами и рисками интерпретации.
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={handleRunAnalysis}
              disabled={isRunning || isGeneratingPdf}
              className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-mid disabled:opacity-60"
            >
              {isRunning ? "Загрузка..." : "Запустить анализ заново"}
            </button>
            <button
              type="button"
              onClick={handleGeneratePdf}
              disabled={isGeneratingPdf || isRunning || !analysisReady}
              className="rounded-xl border border-dash-border bg-dash-bg px-5 py-3 text-sm font-semibold text-dash-heading transition-colors hover:border-brand/30 hover:text-brand disabled:opacity-60"
            >
              {isGeneratingPdf ? "Загрузка..." : "Скачать PDF отчёт"}
            </button>
          </div>
        </div>
        {error ? <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-500">{error}</div> : null}

        <div className="mt-8 space-y-8">
        <div>
          <div className="text-sm font-semibold text-dash-heading">Тональность</div>
          <div className="mt-4">
            <SentimentDonut
              positive={analysis.sentiment.positive}
              neutral={analysis.sentiment.neutral}
              negative={analysis.sentiment.negative}
            />
          </div>
          <div className="mt-6 grid grid-cols-12 gap-1">
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

        {analysis.diagnostics ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-dash-border bg-dash-bg p-5">
              <div className="text-sm font-semibold text-dash-heading">Рекомендации</div>
              <ul className="mt-3 grid list-disc gap-2 pl-5 text-sm text-dash-body">
                {analysis.diagnostics.recommendations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-dash-border bg-dash-bg p-5">
              <div className="text-sm font-semibold text-dash-heading">Гипотезы</div>
              <ul className="mt-3 grid list-disc gap-2 pl-5 text-sm text-dash-body">
                {analysis.diagnostics.hypotheses.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-dash-border bg-dash-bg p-5">
              <div className="text-sm font-semibold text-dash-heading">Риски интерпретации</div>
              <ul className="mt-3 grid list-disc gap-2 pl-5 text-sm text-dash-body">
                {analysis.diagnostics.riskFactors.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-dash-border bg-dash-bg p-5">
              <div className="text-sm font-semibold text-dash-heading">Метрики на следующий цикл</div>
              <ul className="mt-3 grid list-disc gap-2 pl-5 text-sm text-dash-body">
                {analysis.diagnostics.metricsToWatch.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </div>
      </div>
    </div>
  );
}
