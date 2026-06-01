"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { SurveyStatus } from "@prisma/client";
import Modal from "@/components/dashboard/Modal";
import QuestionRenderer from "@/components/survey-player/QuestionRenderer";
import { approveSurveyAction, rejectSurveyAction } from "@/actions/surveys";
import { QUESTION_TYPE_LABELS, type Question } from "@/types/survey";
import { mapSurveyQuestion } from "@/lib/survey-mappers";

type ModerationQuestion = Parameters<typeof mapSurveyQuestion>[0];

type ModerationSurvey = {
  id: string;
  title: string;
  createdAt: Date;
  budget: number | null;
  status: SurveyStatus;
  moderationNote: string | null;
  creator: {
    name: string | null;
    email: string;
    clientProfile: { companyName: string | null } | null;
  };
  questions: {
    id: ModerationQuestion["id"];
    title: ModerationQuestion["title"];
    description: ModerationQuestion["description"];
    type: ModerationQuestion["type"];
    required: ModerationQuestion["required"];
    mediaUrl: ModerationQuestion["mediaUrl"];
    options: ModerationQuestion["options"];
    settings: ModerationQuestion["settings"];
    logic: ModerationQuestion["logic"];
  }[];
};

type Props = {
  surveys: ModerationSurvey[];
  activeTab: "pending" | "approved" | "rejected";
  counts: Record<"pending" | "approved" | "rejected", number>;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

function getStatusView(status: SurveyStatus) {
  if (status === "ACTIVE") {
    return {
      label: "Активен",
      className: "border-[#18C93F] bg-[#E9FFE8] text-[#14B133]",
    };
  }

  if (status === "REJECTED") {
    return {
      label: "Отклонён",
      className: "border-[#FF3B30] bg-[#FFF0EF] text-[#F13028]",
    };
  }

  return {
    label: "На проверке",
    className: "border-[#F1B23A] bg-[#FFF7E7] text-[#B97700]",
  };
}

export default function AdminModerationClient({ surveys, activeTab, counts }: Props) {
  const router = useRouter();
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const current = useMemo(() => surveys.find((survey) => survey.id === previewId || survey.id === rejectId) ?? null, [previewId, rejectId, surveys]);
  const currentPreviewQuestions = useMemo<Question[]>(
    () => current?.questions.map((question) => mapSurveyQuestion(question)) ?? [],
    [current],
  );

  function changeTab(tab: Props["activeTab"]) {
    const value = tab === "pending" ? "pending" : tab === "approved" ? "approved" : "rejected";
    router.push(`/admin/moderation?tab=${value}`);
  }

  function handleApprove(id: string) {
    startTransition(async () => {
      try {
        await approveSurveyAction(id);
        setPreviewId(null);
        setError(null);
        router.refresh();
      } catch {
        setError("Не удалось одобрить опрос");
      }
    });
  }

  function handleReject() {
    if (!rejectId) return;
    startTransition(async () => {
      const result = await rejectSurveyAction(rejectId, rejectReason);
      if (result.error) {
        setError(result.error);
        return;
      }
      setRejectId(null);
      setRejectReason("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="inline-flex max-w-full overflow-x-auto rounded-[20px] border border-[#D8CCFF] bg-white p-1 shadow-[0_1px_0_rgba(83,55,160,0.08)] dark:border-white/10 dark:bg-white/5">
        {[
          { key: "pending" as const, label: "На проверке", count: counts.pending },
          { key: "approved" as const, label: "Одобренные", count: counts.approved },
          { key: "rejected" as const, label: "Отклонённые", count: counts.rejected },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => changeTab(tab.key)}
            className={[
              "flex h-11 shrink-0 items-center gap-3 rounded-[14px] px-5 text-[16px] font-semibold leading-none transition-colors",
              activeTab === tab.key
                ? "bg-[#6D35E3] text-white shadow-sm"
                : "bg-[#F0EBFF] text-[#201050] hover:bg-[#E9E1FF]",
            ].join(" ")}
          >
            {tab.label}
            <span
              className={[
                "flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-sm font-bold",
                activeTab === tab.key ? "bg-white/20 text-white" : "bg-[#DCD5F0] text-[#352267]",
              ].join(" ")}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {error ? <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-500">{error}</div> : null}

      <div className="min-h-[560px] rounded-[20px] border border-[#D8CCFF] bg-white px-6 py-7 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] border-collapse text-left">
            <thead>
              <tr className="text-[13px] font-semibold uppercase tracking-[0.02em] text-[#7C7696]">
                <th className="w-[28%] px-0 pb-4">Название</th>
                <th className="w-[12%] px-3 pb-4">Заказчик</th>
                <th className="w-[8%] px-3 pb-4">Вопросов</th>
                <th className="w-[14%] px-3 pb-4">Бюджет</th>
                <th className="w-[10%] px-3 pb-4">Дата</th>
                <th className="w-[28%] px-3 pb-4">Статус действия</th>
              </tr>
            </thead>
            <tbody className="text-[16px] text-[#170B49] dark:text-white">
              {surveys.map((survey, index) => {
                const status = getStatusView(survey.status);

                return (
                  <tr
                    key={survey.id}
                    className={[
                      "border-t border-[#DCD2FF]",
                      index % 2 === 0 ? "bg-[#F8F5FA] dark:bg-white/[0.04]" : "bg-white dark:bg-transparent",
                    ].join(" ")}
                  >
                    <td className="max-w-[360px] truncate py-2.5 pr-4 font-medium">{survey.title}</td>
                    <td className="px-3 py-2.5">
                      <span className="block max-w-[180px] truncate">
                        {survey.creator.clientProfile?.companyName || survey.creator.name || survey.creator.email}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 tabular-nums">{survey.questions.length}</td>
                    <td className="px-3 py-2.5 text-[22px] font-bold tabular-nums">
                      {survey.budget ? `${survey.budget.toLocaleString("ru-RU")} ₽` : "—"}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums">{formatDate(survey.createdAt)}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-0">
                        <span className={`inline-flex h-7 items-center rounded-lg border px-2.5 text-xs font-medium ${status.className}`}>
                          {status.label}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setError(null);
                            setPreviewId(survey.id);
                          }}
                          className="-ml-1 inline-flex h-8 items-center rounded-[10px] border border-[#CFC3F5] bg-[#EFEAFF] px-3 text-sm font-semibold text-[#25134F] shadow-sm transition-colors hover:bg-[#E7DEFF]"
                        >
                          Просмотреть
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {surveys.length === 0 ? (
          <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-dashed border-[#D8CCFF] text-center text-[#7C7696] dark:border-white/10 dark:text-white/60">
            В этом разделе пока нет опросов
          </div>
        ) : null}
      </div>

      <Modal
        open={Boolean(previewId)}
        title="Превью опроса"
        onClose={() => setPreviewId(null)}
        footer={
          current?.status === "PENDING_MODERATION" ? (
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => { setPreviewId(null); setRejectId(current.id); }} className="rounded-xl border border-dash-border bg-dash-card px-5 py-2.5 text-sm font-semibold text-dash-heading transition-colors hover:bg-dash-bg">
                Отклонить
              </button>
              <button type="button" disabled={isPending} onClick={() => handleApprove(current.id)} className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-mid disabled:opacity-60">
                Одобрить
              </button>
            </div>
          ) : undefined
        }
      >
        {current ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-dash-border bg-dash-bg p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Опрос</div>
              <div className="mt-2 font-display text-xl text-dash-heading">{current.title}</div>
              <div className="mt-2 text-sm text-dash-muted">
                Заказчик: {current.creator.clientProfile?.companyName || current.creator.name || current.creator.email}
              </div>
            </div>
            <div className="space-y-3">
              {currentPreviewQuestions.map((question, index) => {
                const sourceQuestionTitles = Object.fromEntries(
                  currentPreviewQuestions.map((item) => [item.id, item.title || QUESTION_TYPE_LABELS[item.type]]),
                );

                return (
                  <div key={question.id} className="rounded-2xl border border-dash-border bg-dash-bg p-5">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">{QUESTION_TYPE_LABELS[question.type]}</div>
                    <div className="mt-2 font-semibold text-dash-heading">{index + 1}. {question.title}</div>
                    {question.description ? <div className="mt-2 text-sm text-dash-muted">{question.description}</div> : null}
                    {question.mediaUrl ? (
                      <img
                        src={question.mediaUrl}
                        alt="Медиа к вопросу"
                        className="mt-4 max-h-72 w-full rounded-2xl border border-dash-border object-cover"
                      />
                    ) : null}

                    <div className="mt-4 pointer-events-none opacity-95">
                      <QuestionRenderer question={question} value={undefined} onChange={() => undefined} />
                    </div>

                    {question.logic.length > 0 ? (
                      <div className="mt-4 rounded-2xl border border-dash-border bg-dash-card p-4">
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Условная логика</div>
                        <div className="mt-3 grid gap-2 text-sm text-dash-body">
                          {question.logic.map((rule, ruleIndex) => (
                            <div key={`${question.id}-logic-${ruleIndex}`} className="rounded-xl border border-dash-border bg-dash-bg px-4 py-3">
                              {rule.action === "show" ? "Показывать" : "Скрывать"} вопрос, если ответ на «{sourceQuestionTitles[rule.ifQuestionId] ?? "предыдущий вопрос"}»{" "}
                              {rule.operator === "equals"
                                ? "равен"
                                : rule.operator === "not_equals"
                                  ? "не равен"
                                  : "содержит"}{" "}
                              «{rule.value}»
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(rejectId)}
        title="Причина отклонения"
        onClose={() => setRejectId(null)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setRejectId(null)} className="rounded-xl border border-dash-border bg-dash-card px-5 py-2.5 text-sm font-semibold text-dash-heading transition-colors hover:bg-dash-bg">
              Отмена
            </button>
            <button type="button" disabled={isPending} onClick={handleReject} className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-mid disabled:opacity-60">
              Отклонить
            </button>
          </div>
        }
      >
        <textarea
          value={rejectReason}
          onChange={(event) => setRejectReason(event.target.value)}
          className="min-h-[160px] w-full rounded-xl border border-dash-border bg-dash-bg px-4 py-3 text-base text-dash-body outline-none focus:border-brand/40"
          placeholder="Например: некорректные формулировки, запрещённая тематика, вводящие в заблуждение вопросы..."
        />
      </Modal>
    </div>
  );
}
