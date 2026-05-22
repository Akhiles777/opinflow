"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Badge from "@/components/dashboard/Badge";
import Modal from "@/components/dashboard/Modal";
import { assignExpertReviewAction, rejectExpertReviewAction } from "@/actions/expert-reviews";

type RequestRow = {
  id: string;
  surveyId: string;
  surveyTitle: string;
  client: string;
  date: string;
  expert: string | null;
  amount: number;
  status: "PENDING" | "ASSIGNED" | "COMPLETED" | "REJECTED";
  reportUrl: string | null;
  adminNote: string | null;
};

type Props = {
  experts: string[];
  requests: RequestRow[];
};

function formatRub(amount: number) {
  return `${new Intl.NumberFormat("ru-RU").format(amount)} ₽`;
}

function mapStatus(status: RequestRow["status"]) {
  if (status === "COMPLETED") return { v: "completed" as const, t: "Готово" };
  if (status === "ASSIGNED") return { v: "moderation" as const, t: "Назначен" };
  if (status === "PENDING") return { v: "pending" as const, t: "Ожидает" };
  return { v: "rejected" as const, t: "Отклонено" };
}

export default function AdminExpertsClient({ experts, requests }: Props) {
  const router = useRouter();
  const [assignTarget, setAssignTarget] = useState<RequestRow | null>(null);
  const [rejectTarget, setRejectTarget] = useState<RequestRow | null>(null);
  const [uploadTarget, setUploadTarget] = useState<RequestRow | null>(null);
  const [selectedExpert, setSelectedExpert] = useState(experts[0] ?? "");
  const [rejectReason, setRejectReason] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);

  const activeRequests = useMemo(
    () => requests.filter((item) => item.status === "PENDING" || item.status === "ASSIGNED"),
    [requests],
  );

  function handleAssign() {
    if (!assignTarget) return;
    setError(null);
    startTransition(async () => {
      const result = await assignExpertReviewAction(assignTarget.id, selectedExpert);
      if (result.error) {
        setError(result.error);
        return;
      }
      setAssignTarget(null);
      router.refresh();
    });
  }

  function handleReject() {
    if (!rejectTarget) return;
    setError(null);
    startTransition(async () => {
      const result = await rejectExpertReviewAction(rejectTarget.id, rejectReason);
      if (result.error) {
        setError(result.error);
        return;
      }
      setRejectTarget(null);
      setRejectReason("");
      router.refresh();
    });
  }

  async function handleUpload() {
    if (!uploadTarget || !uploadFile) return;
    setError(null);
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.set("file", uploadFile);
      const response = await fetch(`/api/expert-reviews/${uploadTarget.id}/upload`, {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(payload?.error || "Не удалось загрузить заключение.");
        return;
      }
      setUploadTarget(null);
      setUploadFile(null);
      router.refresh();
    } catch {
      setError("Не удалось загрузить заключение.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Всего заявок", value: String(requests.length) },
          { label: "В работе", value: String(activeRequests.length) },
          { label: "Готово", value: String(requests.filter((item) => item.status === "COMPLETED").length) },
          { label: "Отклонено", value: String(requests.filter((item) => item.status === "REJECTED").length) },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-dash-border bg-dash-card p-6">
            <div className="text-sm uppercase tracking-[0.18em] text-dash-muted">{item.label}</div>
            <div className="mt-4 text-3xl font-display font-bold text-dash-heading">{item.value}</div>
          </div>
        ))}
      </div>

      {error ? <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-500">{error}</div> : null}

      <div className="grid gap-3">
        {requests.length > 0 ? (
          requests.map((row) => {
            const status = mapStatus(row.status);
            return (
              <div key={row.id} className="rounded-2xl border border-dash-border bg-dash-card p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <div className="text-base font-semibold text-dash-heading">{row.surveyTitle}</div>
                    <div className="mt-2 text-sm text-dash-muted">
                      {row.client} · {row.date}
                    </div>
                    <div className="mt-2 text-sm text-dash-muted">
                      Эксперт: {row.expert || "не назначен"} · Стоимость: {formatRub(row.amount)}
                    </div>
                    {row.adminNote ? <div className="mt-2 text-sm text-red-500">{row.adminNote}</div> : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant={status.v}>{status.t}</Badge>

                    {(row.status === "PENDING" || row.status === "ASSIGNED") ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setAssignTarget(row);
                            setSelectedExpert(row.expert || experts[0] || "");
                          }}
                          className="text-sm font-semibold text-brand hover:underline"
                        >
                          {row.expert ? "Сменить эксперта" : "Назначить эксперта"}
                        </button>

                        <button
                          type="button"
                          onClick={() => setUploadTarget(row)}
                          className="text-sm font-semibold text-dash-heading hover:underline"
                        >
                          Загрузить заключение
                        </button>

                        <button
                          type="button"
                          onClick={() => setRejectTarget(row)}
                          className="text-sm font-semibold text-red-500 hover:underline"
                        >
                          Отклонить
                        </button>
                      </>
                    ) : null}

                    {row.status === "COMPLETED" && row.reportUrl ? (
                      <a
                        href={row.reportUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-brand hover:underline"
                      >
                        Открыть PDF
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dash-border bg-dash-card p-6 text-sm text-dash-muted">
            Пока нет заказов на экспертное заключение.
          </div>
        )}
      </div>

      <Modal
        open={Boolean(assignTarget)}
        title="Назначить эксперта"
        onClose={() => setAssignTarget(null)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setAssignTarget(null)} className="rounded-xl border border-dash-border bg-dash-card px-5 py-2.5 text-sm font-semibold text-dash-heading">
              Отмена
            </button>
            <button type="button" onClick={handleAssign} disabled={isPending} className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
              {isPending ? "Сохраняем..." : "Назначить"}
            </button>
          </div>
        }
      >
        <label className="grid gap-2">
          <span className="text-sm font-medium text-dash-heading">Эксперт</span>
          <select
            value={selectedExpert}
            onChange={(event) => setSelectedExpert(event.target.value)}
            className="h-11 rounded-xl border border-dash-border bg-dash-bg px-3 text-sm text-dash-body"
          >
            {experts.map((expert) => (
              <option key={expert} value={expert}>
                {expert}
              </option>
            ))}
          </select>
        </label>
      </Modal>

      <Modal
        open={Boolean(rejectTarget)}
        title="Отклонить заявку"
        onClose={() => setRejectTarget(null)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setRejectTarget(null)} className="rounded-xl border border-dash-border bg-dash-card px-5 py-2.5 text-sm font-semibold text-dash-heading">
              Отмена
            </button>
            <button type="button" onClick={handleReject} disabled={isPending} className="rounded-xl bg-red-500 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
              {isPending ? "Сохраняем..." : "Отклонить"}
            </button>
          </div>
        }
      >
        <label className="grid gap-2">
          <span className="text-sm font-medium text-dash-heading">Причина</span>
          <textarea
            value={rejectReason}
            onChange={(event) => setRejectReason(event.target.value)}
            className="min-h-[120px] rounded-xl border border-dash-border bg-dash-bg px-4 py-3 text-sm text-dash-body"
            placeholder="Например: недостаточно данных для экспертного разбора"
          />
        </label>
      </Modal>

      <Modal
        open={Boolean(uploadTarget)}
        title="Загрузить заключение"
        onClose={() => {
          if (!isUploading) {
            setUploadTarget(null);
            setUploadFile(null);
          }
        }}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => {
                if (!isUploading) {
                  setUploadTarget(null);
                  setUploadFile(null);
                }
              }}
              className="rounded-xl border border-dash-border bg-dash-card px-5 py-2.5 text-sm font-semibold text-dash-heading"
            >
              Отмена
            </button>
            <button type="button" onClick={handleUpload} disabled={!uploadFile || isUploading} className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
              {isUploading ? "Загружаем..." : "Загрузить PDF"}
            </button>
          </div>
        }
      >
        <label className="grid gap-2">
          <span className="text-sm font-medium text-dash-heading">PDF-файл заключения</span>
          <input
            type="file"
            accept="application/pdf"
            onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)}
            className="rounded-xl border border-dash-border bg-dash-bg px-4 py-3 text-sm text-dash-body"
          />
        </label>
      </Modal>
    </div>
  );
}
