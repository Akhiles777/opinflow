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
  status: string;
};

export default function SelfServiceResults({
  surveyId,
  slug,
  baseUrl,
  responseCount,
  walletBalance,
  aiAnalyticsPaid,
  status,
}: Props) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [isPendingAI, startAI] = useTransition();
  const [isPendingStop, startStop] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isActive = status === "ACTIVE";
  const isPendingModeration = status === "PENDING_MODERATION";
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
      {/* Moderation banner */}
      {isPendingModeration && (
        <div className="rounded-2xl border border-amber-400/40 bg-amber-50/60 px-6 py-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">⏳</span>
            <p className="text-[14px] font-semibold text-amber-800">Анкета на модерации</p>
          </div>
          <p className="text-[12px] text-amber-700 leading-relaxed">
            Ваша анкета ожидает проверки. Обычно это занимает несколько часов.
            После одобрения ссылка станет активной и вы сможете отправить её своей аудитории.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <div className="min-w-0 flex-1 rounded-xl border border-amber-300/50 bg-amber-50 px-4 py-2.5">
              <p className="truncate text-sm font-mono text-amber-600">{shareUrl}</p>
            </div>
            <button
              onClick={handleCopy}
              className="shrink-0 rounded-xl border border-amber-300/50 bg-amber-50 px-4 py-2.5 text-[13px] font-semibold text-amber-700 transition-colors hover:bg-amber-100"
            >
              {copied ? "Скопировано!" : "Копировать"}
            </button>
          </div>
          <p className="text-[11px] text-amber-600">
            Ссылку можно скопировать заранее — она будет работать после одобрения.
          </p>
        </div>
      )}

      {/* Share link card (only when active or completed) */}
      {!isPendingModeration && (
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
            Отправьте ссылку своей базе — каждый участник автоматически получит аккаунт на платформе.
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
      )}

      {/* AI Analytics paywall */}
      {!aiAnalyticsPaid && (
        <div className="rounded-2xl border border-dashed border-[#7244F5]/40 bg-[#7244F5]/5 p-6 space-y-3">
          <p className="text-[14px] font-semibold text-dash-heading">ИИ-аналитика результатов</p>
          <p className="text-[12px] text-dash-muted leading-relaxed">
            Получите автоматический разбор открытых ответов: темы, тональность, ключевые инсайты —
            сгенерированные нейросетью.
          </p>
          <div className="flex items-center gap-4 flex-wrap">
            <button
              onClick={handlePurchaseAI}
              disabled={isPendingAI || responseCount === 0 || isPendingModeration}
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
          {responseCount === 0 && !isPendingModeration && (
            <p className="text-[12px] text-orange-500">Нет ответов для анализа. Дождитесь первых ответов.</p>
          )}
          {isPendingModeration && (
            <p className="text-[12px] text-amber-600">Анализ станет доступен после одобрения анкеты.</p>
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
