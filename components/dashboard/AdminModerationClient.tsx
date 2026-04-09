"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { SurveyStatus } from "@prisma/client";
import Badge from "@/components/dashboard/Badge";
import DataTable, { type Column } from "@/components/dashboard/DataTable";
import Modal from "@/components/dashboard/Modal";
import { approveSurveyAction, rejectSurveyAction } from "@/actions/surveys";
import { QUESTION_TYPE_LABELS } from "@/types/survey";
import { getSurveyStatusMeta } from "@/lib/survey-mappers";

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
    id: string;
    title: string;
    description: string | null;
    type: keyof typeof QUESTION_TYPE_LABELS;
    required: boolean;
    options: unknown;
  }[];
};

type Props = {
  surveys: ModerationSurvey[];
  activeTab: "pending" | "approved" | "rejected";
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

export default function AdminModerationClient({ surveys, activeTab }: Props) {
  const router = useRouter();
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const current = useMemo(() => surveys.find((survey) => survey.id === previewId || survey.id === rejectId) ?? null, [previewId, rejectId, surveys]);

  const columns: Column<ModerationSurvey>[] = [
    { key: "title", header: "Название", cell: (survey) => survey.title, className: "max-w-[320px] lg:max-w-[420px]" },
    {
      key: "creator",
      header: "Заказчик",
      cell: (survey) => survey.creator.clientProfile?.companyName || survey.creator.name || survey.creator.email,
    },
    { key: "questions", header: "Вопросов", cell: (survey) => <span className="tabular-nums">{survey.questions.length}</span> },
    {
      key: "budget",
      header: "Бюджет",
      cell: (survey) => <span className="tabular-nums font-semibold">{survey.budget ? `${survey.budget.toLocaleString("ru-RU")} ₽` : "—"}</span>,
    },
    { key: "date", header: "Дата", cell: (survey) => formatDate(survey.createdAt) },
    {
      key: "status",
      header: "Статус",
      cell: (survey) => {
        const meta = getSurveyStatusMeta(survey.status);
        return <Badge variant={meta.variant}>{meta.label}</Badge>;
      },
    },
    {
      key: "actions",
      header: "Действия",
      cell: (survey) => (
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => { setError(null); setPreviewId(survey.id); }} className="text-sm font-semibold text-brand hover:underline">
            Просмотреть
          </button>
          {survey.status === "PENDING_MODERATION" ? (
            <>
              <button type="button" onClick={() => handleApprove(survey.id)} className="text-sm font-semibold text-green-700 hover:underline dark:text-green-400">
                Одобрить
              </button>
              <button type="button" onClick={() => { setError(null); setRejectReason(""); setRejectId(survey.id); }} className="text-sm font-semibold text-red-600 hover:underline dark:text-red-400">
                Отклонить
              </button>
            </>
          ) : null}
        </div>
      ),
    },
  ];

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
      <div className="flex flex-wrap gap-2">
        {[
          { key: "pending" as const, label: "На проверке" },
          { key: "approved" as const, label: "Одобренные" },
          { key: "rejected" as const, label: "Отклонённые" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => changeTab(tab.key)}
            className={[
              "rounded-xl border px-4 py-2 text-sm font-semibold transition-colors",
              activeTab === tab.key
                ? "border-brand/30 bg-brand/10 text-brand"
                : "border-dash-border bg-dash-card text-dash-muted hover:bg-dash-bg hover:text-dash-heading",
            ].join(" ")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error ? <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-500">{error}</div> : null}

      <DataTable columns={columns} rows={surveys} keyForRow={(survey) => survey.id} />

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
              {current.questions.map((question, index) => {
                const options = Array.isArray(question.options) ? (question.options as string[]) : [];
                return (
                  <div key={question.id} className="rounded-2xl border border-dash-border bg-dash-bg p-5">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">{QUESTION_TYPE_LABELS[question.type]}</div>
                    <div className="mt-2 font-semibold text-dash-heading">{index + 1}. {question.title}</div>
                    {question.description ? <div className="mt-2 text-sm text-dash-muted">{question.description}</div> : null}
                    {options.length > 0 ? (
                      <div className="mt-3 grid gap-2 text-sm text-dash-body">
                        {options.map((option) => (
                          <div key={option} className="rounded-xl border border-dash-border bg-dash-card px-4 py-3">
                            {option}
                          </div>
                        ))}
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
