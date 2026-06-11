"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  approveResponseAction,
  rejectResponseAction,
  bulkApproveResponsesAction,
} from "@/actions/moderation";

type SurveyQuestion = {
  id: string;
  order: number;
  type: string;
  title: string;
  options: string[] | null;
  settings: Record<string, any> | null;
};

type SessionAnswer = {
  value: unknown;
  question: {
    id: string;
    order: number;
    type: string;
    title: string;
    options: string[] | null;
    settings: Record<string, any> | null;
  };
};

type ResponseItem = {
  id: string;
  moderationStatus: string;
  moderationNote: string | null;
  moderatedAt: string | null;
  createdAt: string;
  survey: {
    id: string;
    title: string;
    reward: number | null;
    questions: SurveyQuestion[];
  };
  user: {
    id: string;
    name: string | null;
    email: string;
    respondentProfile: { isVerified: boolean } | null;
  };
  session: {
    id: string;
    isValid: boolean;
    fraudFlags: string[];
    timeSpent: number | null;
    completedAt: string | null;
    answers: SessionAnswer[];
  } | null;
};

type Props = {
  responses: ResponseItem[];
  activeTab: "pending" | "approved" | "rejected";
  counts: Record<"pending" | "approved" | "rejected", number>;
  surveys: { id: string; title: string }[];
  surveyFilter?: string;
};

const tabs = [
  { key: "pending" as const, label: "Ожидают" },
  { key: "approved" as const, label: "Одобрены" },
  { key: "rejected" as const, label: "Отклонены" },
];

const QUESTION_TYPE_LABELS: Record<string, string> = {
  SINGLE_CHOICE: "Одиночный выбор",
  MULTIPLE_CHOICE: "Множественный выбор",
  SCALE: "Шкала",
  MATRIX: "Матрица",
  RANKING: "Ранжирование",
  OPEN_TEXT: "Открытый ответ",
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function formatTime(seconds: number | null) {
  if (seconds === null) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m} мин ${s} с` : `${s} с`;
}

function renderAnswerValue(answer: SessionAnswer): React.ReactNode {
  const { value, question } = answer;

  if (value === null || value === undefined || value === "") {
    return <span className="text-[#9585C8] italic">Нет ответа</span>;
  }

  switch (question.type) {
    case "SINGLE_CHOICE":
      return (
        <span className="inline-flex items-center rounded-full bg-[#F4F0FF] px-3 py-1 text-[13px] font-medium text-[#6438D9]">
          {String(value)}
        </span>
      );

    case "MULTIPLE_CHOICE": {
      const arr = Array.isArray(value) ? (value as string[]) : [String(value)];
      return (
        <div className="flex flex-wrap gap-2">
          {arr.map((v, i) => (
            <span key={i} className="inline-flex items-center rounded-full bg-[#F4F0FF] px-3 py-1 text-[13px] font-medium text-[#6438D9]">
              {v}
            </span>
          ))}
        </div>
      );
    }

    case "SCALE":
      return (
        <div className="flex items-center gap-3">
          <span className="text-[28px] font-bold text-[#1D0B57] dark:text-white">{String(value)}</span>
          {question.settings?.min !== undefined && question.settings?.max !== undefined && (
            <span className="text-[12px] text-[#9585C8]">
              из {question.settings.min}–{question.settings.max}
            </span>
          )}
        </div>
      );

    case "OPEN_TEXT":
      return (
        <div className="rounded-[10px] bg-[#F9F6FF] dark:bg-[#1D0B57]/40 px-4 py-3 text-[14px] leading-[1.6] text-[#1D0B57] dark:text-white/80">
          {String(value)}
        </div>
      );

    case "MATRIX": {
      const matrixVal = value as Record<string, string>;
      const entries = Object.entries(matrixVal);
      if (entries.length === 0) return <span className="text-[#9585C8] italic">Нет ответа</span>;
      return (
        <div className="space-y-1.5">
          {entries.map(([row, col]) => (
            <div key={row} className="flex items-center gap-2 text-[13px]">
              <span className="text-[#6B5F8A] dark:text-white/50 min-w-[100px]">{row}:</span>
              <span className="rounded-full bg-[#F4F0FF] px-2 py-0.5 text-[#6438D9] font-medium">{col}</span>
            </div>
          ))}
        </div>
      );
    }

    case "RANKING": {
      const ranked = Array.isArray(value) ? (value as string[]) : [];
      return (
        <ol className="space-y-1.5">
          {ranked.map((item, i) => (
            <li key={i} className="flex items-center gap-3 text-[13px]">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#6438D9] text-[11px] font-bold text-white">
                {i + 1}
              </span>
              <span className="text-[#1D0B57] dark:text-white/80">{item}</span>
            </li>
          ))}
        </ol>
      );
    }

    default:
      return <span className="text-[13px] text-[#6B5F8A]">{JSON.stringify(value)}</span>;
  }
}

export default function ResponsesModerationClient({ responses, activeTab, counts, surveys, surveyFilter }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Modals
  const [viewId, setViewId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  const [error, setError] = useState<string | null>(null);

  const viewResponse = responses.find((r) => r.id === viewId) ?? null;

  function navigate(tab: string, survey?: string) {
    const params = new URLSearchParams();
    params.set("tab", tab);
    if (survey) params.set("survey", survey);
    router.push(`/admin/moderation/responses?${params.toString()}`);
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(selected.size === responses.length ? new Set() : new Set(responses.map((r) => r.id)));
  }

  function handleApprove(id: string) {
    setError(null);
    startTransition(async () => {
      try {
        await approveResponseAction(id);
        setViewId(null);
        setSelected((prev) => { const n = new Set(prev); n.delete(id); return n; });
        router.refresh();
      } catch (e: any) { setError(e.message); }
    });
  }

  function handleRejectSubmit() {
    if (!rejectId) return;
    setError(null);
    startTransition(async () => {
      try {
        await rejectResponseAction(rejectId, rejectNote || undefined);
        setRejectId(null);
        setRejectNote("");
        setViewId(null);
        router.refresh();
      } catch (e: any) { setError(e.message); }
    });
  }

  function handleBulkApprove() {
    setError(null);
    startTransition(async () => {
      try {
        await bulkApproveResponsesAction(Array.from(selected));
        setSelected(new Set());
        router.refresh();
      } catch (e: any) { setError(e.message); }
    });
  }

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => navigate(t.key, surveyFilter)}
            className={`flex items-center gap-2 rounded-full px-5 py-2 text-[14px] font-semibold transition-colors ${
              activeTab === t.key ? "bg-[#6438D9] text-white" : "bg-[#F4F0FF] text-[#6438D9] hover:bg-[#EBE3FF]"
            }`}>
            {t.label}
            <span className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${
              activeTab === t.key ? "bg-white/20 text-white" : "bg-[#6438D9]/10 text-[#6438D9]"
            }`}>{counts[t.key]}</span>
          </button>
        ))}
      </div>

      {/* Фильтр + bulk */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <select value={surveyFilter ?? ""} onChange={(e) => navigate(activeTab, e.target.value || undefined)}
          className="rounded-[10px] border border-[#E0D9F5] bg-white px-3 py-2 text-[14px] text-[#1D0B57] dark:bg-[#1A0748] dark:border-white/10 dark:text-white">
          <option value="">Все опросы</option>
          {surveys.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
        </select>
        {activeTab === "pending" && selected.size > 0 && (
          <button onClick={handleBulkApprove} disabled={isPending}
            className="rounded-[10px] bg-[#18C93F] px-4 py-2 text-[14px] font-semibold text-white hover:bg-[#14B133] disabled:opacity-50 transition-colors">
            Одобрить выбранные ({selected.size})
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-600">{error}</div>
      )}

      {responses.length === 0 ? (
        <div className="rounded-[16px] border border-[#EBE5F5] bg-white py-16 text-center text-[15px] text-[#9585C8] dark:bg-[#1A0748] dark:border-white/8 dark:text-white/40">
          Нет ответов в этой категории
        </div>
      ) : (
        <div className="rounded-[16px] border border-[#EBE5F5] bg-white dark:bg-[#1A0748] dark:border-white/8 overflow-hidden">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="border-b border-[#EBE5F5] dark:border-white/8 bg-[#F9F6FF] dark:bg-[#1D0B57]/40">
                {activeTab === "pending" && (
                  <th className="px-4 py-3 w-10">
                    <input type="checkbox" checked={selected.size === responses.length && responses.length > 0}
                      onChange={toggleAll} className="h-4 w-4 accent-[#6438D9]" />
                  </th>
                )}
                <th className="px-4 py-3 text-left font-semibold text-[#6B5F8A] dark:text-white/50">Респондент</th>
                <th className="px-4 py-3 text-left font-semibold text-[#6B5F8A] dark:text-white/50">Опрос</th>
                <th className="px-4 py-3 text-left font-semibold text-[#6B5F8A] dark:text-white/50">Вознаграждение</th>
                <th className="px-4 py-3 text-left font-semibold text-[#6B5F8A] dark:text-white/50">Время</th>
                <th className="px-4 py-3 text-left font-semibold text-[#6B5F8A] dark:text-white/50">Дата</th>
                <th className="px-4 py-3 text-left font-semibold text-[#6B5F8A] dark:text-white/50">Действия</th>
              </tr>
            </thead>
            <tbody>
              {responses.map((r) => (
                <tr key={r.id} className="border-b border-[#EBE5F5] dark:border-white/8 last:border-0 hover:bg-[#F9F6FF] dark:hover:bg-white/4 transition-colors">
                  {activeTab === "pending" && (
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSelect(r.id)}
                        className="h-4 w-4 accent-[#6438D9]" />
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <div className="font-medium text-[#1D0B57] dark:text-white">{r.user.name ?? "—"}</div>
                    <div className="text-[12px] text-[#9585C8] dark:text-white/40">{r.user.email}</div>
                    {r.session?.fraudFlags && r.session.fraudFlags.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {r.session.fraudFlags.map((flag) => (
                          <span key={flag} className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] text-red-600">{flag}</span>
                        ))}
                      </div>
                    )}
                    {r.session && !r.session.isValid && (
                      <span className="mt-1 inline-block rounded-full bg-orange-100 px-2 py-0.5 text-[11px] text-orange-600">Фрод</span>
                    )}
                  </td>
                  <td className="px-4 py-3 max-w-[200px]">
                    <div className="truncate font-medium text-[#1D0B57] dark:text-white">{r.survey.title}</div>
                    <div className="text-[12px] text-[#9585C8]">{r.survey.questions.length} вопр.</div>
                  </td>
                  <td className="px-4 py-3">
                    {r.survey.reward != null
                      ? <span className="font-semibold text-[#6438D9]">{r.survey.reward} ₽</span>
                      : <span className="text-[#9585C8]">—</span>}
                  </td>
                  <td className="px-4 py-3 text-[#6B5F8A] dark:text-white/60">{formatTime(r.session?.timeSpent ?? null)}</td>
                  <td className="px-4 py-3 text-[#6B5F8A] dark:text-white/60 whitespace-nowrap">{formatDate(r.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => { setError(null); setViewId(r.id); }}
                        className="rounded-[8px] bg-[#F4F0FF] px-3 py-1.5 text-[13px] font-semibold text-[#6438D9] hover:bg-[#EBE3FF] transition-colors">
                        Просмотреть
                      </button>
                      {activeTab === "pending" && (
                        <>
                          <button onClick={() => handleApprove(r.id)} disabled={isPending}
                            className="rounded-[8px] bg-[#E9FFE8] px-3 py-1.5 text-[13px] font-semibold text-[#14B133] hover:bg-[#D4FFD2] disabled:opacity-50 transition-colors">
                            Одобрить
                          </button>
                          <button onClick={() => { setRejectId(r.id); setRejectNote(""); }}
                            disabled={isPending}
                            className="rounded-[8px] bg-[#FFF0EF] px-3 py-1.5 text-[13px] font-semibold text-[#F13028] hover:bg-[#FFE0DE] disabled:opacity-50 transition-colors">
                            Отклонить
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Модал просмотра ответов ─────────────────────────────── */}
      {viewResponse && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm">
          <div className="flex min-h-full items-center justify-center p-4 py-8">
          <div className="w-full max-w-[760px] rounded-[24px] bg-white dark:bg-[#1A0748] shadow-2xl">

            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-[#EBE5F5] dark:border-white/8 px-7 py-5">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6438D9] mb-1">Ответы респондента</div>
                <h3 className="text-[18px] font-bold text-[#1D0B57] dark:text-white leading-tight">{viewResponse.survey.title}</h3>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-[13px] text-[#9585C8]">
                  <span>{viewResponse.user.name ?? viewResponse.user.email}</span>
                  {viewResponse.session?.timeSpent != null && (
                    <span>· {formatTime(viewResponse.session.timeSpent)}</span>
                  )}
                  {viewResponse.session && !viewResponse.session.isValid && (
                    <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-semibold text-orange-600">Фрод-флаг</span>
                  )}
                </div>
              </div>
              <button onClick={() => setViewId(null)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F4F0FF] text-[#6438D9] hover:bg-[#EBE3FF] text-[18px] leading-none">
                ×
              </button>
            </div>

            {/* Answers */}
            <div className="px-7 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
              {viewResponse.session?.answers && viewResponse.session.answers.length > 0 ? (
                viewResponse.session.answers.map((answer, idx) => (
                  <div key={answer.question.id}
                    className="rounded-[14px] border border-[#EBE5F5] dark:border-white/8 bg-[#F9F6FF] dark:bg-[#1D0B57]/40 p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#6438D9] text-[11px] font-bold text-white">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9585C8] mb-1">
                          {QUESTION_TYPE_LABELS[answer.question.type] ?? answer.question.type}
                        </div>
                        <div className="text-[14px] font-semibold text-[#1D0B57] dark:text-white leading-[1.4]">
                          {answer.question.title}
                        </div>
                      </div>
                    </div>
                    <div className="pl-9">{renderAnswerValue(answer)}</div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-[14px] text-[#9585C8]">Ответы не найдены</div>
              )}
            </div>

            {/* Footer */}
            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[#EBE5F5] dark:border-white/8 px-7 py-4">
              <div className="flex gap-2">
                {viewResponse.moderationStatus === "PENDING" && (
                  <>
                    <button onClick={() => { setViewId(null); setRejectId(viewResponse.id); setRejectNote(""); }}
                      disabled={isPending}
                      className="rounded-[10px] bg-[#FFF0EF] px-4 py-2 text-[13px] font-semibold text-[#F13028] hover:bg-[#FFE0DE] disabled:opacity-50 transition-colors">
                      Отклонить
                    </button>
                    <button onClick={() => handleApprove(viewResponse.id)} disabled={isPending}
                      className="rounded-[10px] bg-[#6438D9] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#5530C4] disabled:opacity-50 transition-colors">
                      Одобрить
                    </button>
                  </>
                )}
                <button onClick={() => setViewId(null)}
                  className="rounded-[10px] border border-[#E0D9F5] px-4 py-2 text-[13px] font-semibold text-[#6B5F8A] hover:bg-[#F4F0FF] transition-colors dark:border-white/10 dark:text-white/60">
                  Закрыть
                </button>
              </div>
            </div>
          </div>
          </div>
        </div>
      )}

      {/* ── Модал отклонения ───────────────────────────────────── */}
      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-[440px] rounded-[20px] bg-white dark:bg-[#1A0748] p-6 shadow-2xl">
            <h3 className="text-[18px] font-bold text-[#1D0B57] dark:text-white mb-4">Отклонить ответ</h3>
            <textarea value={rejectNote} onChange={(e) => setRejectNote(e.target.value)}
              placeholder="Причина отклонения (необязательно)" rows={3}
              className="w-full rounded-[12px] border border-[#E0D9F5] bg-[#F9F6FF] px-4 py-3 text-[14px] text-[#1D0B57] dark:bg-[#1D0B57] dark:border-white/10 dark:text-white resize-none focus:outline-none focus:border-[#6438D9]" />
            <div className="flex gap-3 mt-4">
              <button onClick={handleRejectSubmit} disabled={isPending}
                className="flex-1 rounded-[12px] bg-[#F13028] py-2.5 text-[14px] font-semibold text-white hover:bg-[#D42820] disabled:opacity-50 transition-colors">
                Отклонить
              </button>
              <button onClick={() => setRejectId(null)}
                className="flex-1 rounded-[12px] border border-[#E0D9F5] py-2.5 text-[14px] font-semibold text-[#6B5F8A] hover:bg-[#F4F0FF] transition-colors dark:border-white/10 dark:text-white/70">
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
