"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { purchaseAiAnalyticsAction, deactivateSelfServiceSurveyAction } from "@/actions/self-service-surveys";

type Props = {
  surveyId: string;
  slug: string;
  baseUrl: string;
  responseCount: number;
  walletBalance: number;
  aiAnalyticsPaid: boolean;
  isActive: boolean;
};

export default function SelfServiceResults({
  surveyId,
  slug,
  baseUrl,
  responseCount,
  walletBalance,
  aiAnalyticsPaid,
  isActive,
}: Props) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [isPendingAI, startAI] = useTransition();
  const [isPendingStop, startStop] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const shareUrl = `${baseUrl}/s/${slug}`;

  function handleCopy() {
    void navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handlePurchaseAI() {
    setError(null);
    startAI(async () => {
      const result = await purchaseAiAnalyticsAction(surveyId);
      if ("error" in result) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  function handleStop() {
    if (!confirm("Завершить анкету? Новые ответы больше не будут приниматься.")) return;
    startStop(async () => {
      await deactivateSelfServiceSurveyAction(surveyId);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {/* Share link card */}
      <div className="rounded-2xl border border-dash-border bg-dash-card p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[13px] font-semibold text-dash-heading">Ссылка для вашей аудитории</p>
          {isActive && (
            <span className="rounded-full bg-green-100 px-3 py-1 text-[11px] font-semibold text-green-700">
              Принимает ответы
            </span>
          )}
          {!isActive && (
            <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-semibold text-gray-500">
              Завершена
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1 rounded-xl border border-dash-border bg-dash-bg px-4 py-2.5">
            <p className="truncate text-sm font-mono text-dash-muted">{shareUrl}</p>
          </div>
          <button
            onClick={handleCopy}
            className="shrink-0 rounded-xl border border-dash-border bg-dash-bg px-4 py-2.5 text-[13px] font-semibold text-dash-heading transition-colors hover:bg-dash-card"
          >
            {copied ? "Скопировано!" : "Копировать"}
          </button>
        </div>

        <p className="text-[12px] text-dash-muted">
          Отправьте ссылку своей базе — каждый respondent автоматически получит аккаунт на платформе.
          Ответов собрано: <span className="font-semibold text-dash-heading">{responseCount}</span>
        </p>

        {isActive && (
          <button
            onClick={handleStop}
            disabled={isPendingStop}
            className="text-[12px] text-red-400 hover:text-red-600 transition-colors underline disabled:opacity-50"
          >
            {isPendingStop ? "Завершаем…" : "Завершить приём ответов"}
          </button>
        )}
      </div>

      {/* AI Analytics paywall */}
      {!aiAnalyticsPaid && (
        <div className="rounded-2xl border border-dashed border-[#7244F5]/40 bg-[#7244F5]/5 p-6 space-y-3">
          <p className="text-[14px] font-semibold text-dash-heading">ИИ-аналитика результатов</p>
          <p className="text-[12px] text-dash-muted leading-relaxed">
            Получите автоматический разбор открытых ответов: темы, тональность, ключевые инсайты и
            облако слов — сгенерированные нейросетью.
          </p>
          <div className="flex items-center gap-4 flex-wrap">
            <button
              onClick={handlePurchaseAI}
              disabled={isPendingAI || responseCount === 0}
              className="rounded-xl bg-[#7244F5] px-6 py-2.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isPendingAI ? "Обрабатываем…" : "Купить анализ — 1 000 ₽"}
            </button>
            {walletBalance < 1000 && (
              <a href="/client/wallet" className="text-[12px] text-brand underline">
                Пополнить кошелёк
              </a>
            )}
          </div>
          {responseCount === 0 && (
            <p className="text-[12px] text-orange-500">Нет ответов для анализа. Дождитесь первых ответов.</p>
          )}
          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-500">{error}</p>
          )}
        </div>
      )}

      {aiAnalyticsPaid && (
        <div className="rounded-2xl border border-green-200 bg-green-50/50 px-5 py-3">
          <p className="text-[13px] font-semibold text-green-700">ИИ-аналитика приобретена</p>
          <p className="text-[12px] text-green-600 mt-0.5">Результаты анализа отображены ниже.</p>
        </div>
      )}
    </div>
  );
}
