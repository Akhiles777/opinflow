"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Pencil, Trash2, ToggleLeft, ToggleRight, FileText, FileType, File } from "lucide-react";
import Modal from "@/components/dashboard/Modal";
import {
  assignExpertReviewAction,
  rejectExpertReviewAction,
  submitTextConclusionAction,
} from "@/actions/expert-reviews";
import {
  createExpertAction,
  updateExpertAction,
  deleteExpertAction,
  toggleExpertActiveAction,
} from "@/actions/admin-experts";

type ExpertRow = {
  id: string;
  name: string;
  email: string | null;
  specialty: string | null;
  isActive: boolean;
};

type RequestRow = {
  id: string;
  surveyId: string;
  surveyTitle: string;
  client: string;
  date: string;
  expertName: string | null;
  amount: number;
  status: "PENDING" | "ASSIGNED" | "COMPLETED" | "REJECTED";
  reportUrl: string | null;
  reportText: string | null;
  adminNote: string | null;
};

type Props = {
  experts: ExpertRow[];
  requests: RequestRow[];
};

type Tab = "requests" | "experts";

function formatRub(n: number) {
  return `${new Intl.NumberFormat("ru-RU").format(n)} ₽`;
}

function StatusBadge({ status }: { status: RequestRow["status"] }) {
  const map = {
    PENDING: { label: "Ожидает", cls: "border-amber-400/50 bg-amber-400/10 text-amber-400" },
    ASSIGNED: { label: "Назначен", cls: "border-violet-400/50 bg-violet-400/10 text-violet-400" },
    COMPLETED: { label: "Готово", cls: "border-emerald-500/50 bg-emerald-500/10 text-emerald-400" },
    REJECTED: { label: "Отклонено", cls: "border-red-500/50 bg-red-500/10 text-red-400" },
  };
  const { label, cls } = map[status];
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${cls}`}>
      {label}
    </span>
  );
}

function ReportIcon({ url }: { url: string }) {
  const ext = url.split(".").pop()?.toLowerCase();
  if (ext === "docx") return <FileText className="h-4 w-4" />;
  if (ext === "txt") return <FileType className="h-4 w-4" />;
  return <File className="h-4 w-4" />;
}

const inputCls =
  "h-11 w-full rounded-xl border border-dash-border bg-dash-bg px-4 text-[13px] text-dash-body outline-none focus:border-[#6D3AE2]/50 focus:ring-2 focus:ring-[#6D3AE2]/10 transition-colors placeholder:text-dash-muted";

export default function AdminExpertsClient({ experts: initialExperts, requests }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("requests");

  // Request actions
  const [assignTarget, setAssignTarget] = useState<RequestRow | null>(null);
  const [rejectTarget, setRejectTarget] = useState<RequestRow | null>(null);
  const [uploadTarget, setUploadTarget] = useState<RequestRow | null>(null);
  const [selectedExpertName, setSelectedExpertName] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadMode, setUploadMode] = useState<"file" | "text">("file");
  const [conclusionText, setConclusionText] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Expert CRUD
  const [showAddExpert, setShowAddExpert] = useState(false);
  const [editTarget, setEditTarget] = useState<ExpertRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExpertRow | null>(null);
  const [expertName, setExpertName] = useState("");
  const [expertEmail, setExpertEmail] = useState("");
  const [expertSpecialty, setExpertSpecialty] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const activeExperts = useMemo(() => initialExperts.filter((e) => e.isActive), [initialExperts]);

  const stats = useMemo(() => ({
    total: requests.length,
    active: requests.filter((r) => r.status === "PENDING" || r.status === "ASSIGNED").length,
    done: requests.filter((r) => r.status === "COMPLETED").length,
    rejected: requests.filter((r) => r.status === "REJECTED").length,
  }), [requests]);

  // ── Request handlers ────────────────────────────────────────────────────

  function openAssign(row: RequestRow) {
    setError(null);
    setAssignTarget(row);
    const current = row.expertName
      ? initialExperts.find((e) => e.name === row.expertName)?.name
      : undefined;
    setSelectedExpertName(current ?? activeExperts[0]?.name ?? "");
  }

  function handleAssign() {
    if (!assignTarget || !selectedExpertName) return;
    setError(null);
    startTransition(async () => {
      const result = await assignExpertReviewAction(assignTarget.id, selectedExpertName);
      if (result.error) { setError(result.error); return; }
      setAssignTarget(null);
      router.refresh();
    });
  }

  function handleReject() {
    if (!rejectTarget) return;
    setError(null);
    startTransition(async () => {
      const result = await rejectExpertReviewAction(rejectTarget.id, rejectReason);
      if (result.error) { setError(result.error); return; }
      setRejectTarget(null);
      setRejectReason("");
      router.refresh();
    });
  }

  async function handleUpload() {
    if (!uploadTarget) return;
    setError(null);
    setIsUploading(true);
    try {
      if (uploadMode === "text") {
        const result = await submitTextConclusionAction(uploadTarget.id, conclusionText);
        if (result.error) { setError(result.error); return; }
      } else {
        if (!uploadFile) return;
        const form = new FormData();
        form.set("file", uploadFile);
        const res = await fetch(`/api/expert-reviews/${uploadTarget.id}/upload`, { method: "POST", body: form });
        const payload = (await res.json().catch(() => null)) as { error?: string } | null;
        if (!res.ok) { setError(payload?.error ?? "Не удалось загрузить заключение."); return; }
      }
      setUploadTarget(null);
      setUploadFile(null);
      setConclusionText("");
      setUploadMode("file");
      router.refresh();
    } catch {
      setError("Не удалось загрузить заключение.");
    } finally {
      setIsUploading(false);
    }
  }

  // ── Expert CRUD handlers ─────────────────────────────────────────────────

  function openAddExpert() {
    setExpertName(""); setExpertEmail(""); setExpertSpecialty(""); setError(null);
    setShowAddExpert(true);
  }

  function openEditExpert(e: ExpertRow) {
    setExpertName(e.name); setExpertEmail(e.email ?? ""); setExpertSpecialty(e.specialty ?? ""); setError(null);
    setEditTarget(e);
  }

  function handleAddExpert() {
    setError(null);
    startTransition(async () => {
      const result = await createExpertAction({ name: expertName, email: expertEmail || undefined, specialty: expertSpecialty || undefined });
      if (result.error) { setError(result.error); return; }
      setShowAddExpert(false);
      router.refresh();
    });
  }

  function handleUpdateExpert() {
    if (!editTarget) return;
    setError(null);
    startTransition(async () => {
      const result = await updateExpertAction(editTarget.id, { name: expertName, email: expertEmail || undefined, specialty: expertSpecialty || undefined });
      if (result.error) { setError(result.error); return; }
      setEditTarget(null);
      router.refresh();
    });
  }

  function handleToggleActive(e: ExpertRow) {
    startTransition(async () => {
      await toggleExpertActiveAction(e.id);
      router.refresh();
    });
  }

  function handleDeleteExpert() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteExpertAction(deleteTarget.id);
      if (result.error) { setError(result.error); return; }
      setDeleteTarget(null);
      router.refresh();
    });
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Всего заявок", value: stats.total },
          { label: "В работе", value: stats.active },
          { label: "Готово", value: stats.done },
          { label: "Отклонено", value: stats.rejected },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-dash-border bg-dash-card p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-dash-muted">{s.label}</p>
            <p className="mt-3 text-[28px] font-bold leading-none text-dash-heading">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-dash-border bg-dash-card p-1 w-fit">
        {([["requests", "Заявки"], ["experts", "Эксперты"]] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={[
              "rounded-[10px] px-4 py-2 text-[13px] font-semibold transition-colors",
              tab === key
                ? "bg-[#6D3AE2] text-white"
                : "text-dash-muted hover:text-dash-heading",
            ].join(" ")}
          >
            {label}
            {key === "requests" && stats.active > 0 && (
              <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-400/20 text-[10px] font-bold text-amber-400">
                {stats.active}
              </span>
            )}
            {key === "experts" && (
              <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-dash-bg text-[10px] font-semibold text-dash-muted">
                {initialExperts.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[13px] text-red-400">
          {error}
        </div>
      )}

      {/* ── REQUESTS TAB ────────────────────────────────────── */}
      {tab === "requests" && (
        <div className="rounded-2xl border border-dash-border bg-dash-card">
          {requests.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-180 text-left">
                <thead>
                  <tr className="border-b border-dash-border bg-dash-bg/40">
                    {["Заказчик", "Опрос", "Дата заказа", "Эксперт", "Статус", "Действия"].map((h) => (
                      <th key={h} className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-dash-muted">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-dash-border">
                  {requests.map((row) => (
                    <tr key={row.id} className="group transition-colors hover:bg-dash-bg/30">
                      <td className="max-w-45 truncate px-5 py-4 text-[13px] font-medium text-dash-body">
                        {row.client}
                      </td>
                      <td className="max-w-50 px-5 py-4">
                        <span className="block truncate text-[13px] text-dash-body">{row.surveyTitle}</span>
                        <span className="text-[11px] text-dash-muted">{formatRub(row.amount)}</span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-[13px] text-dash-muted">{row.date}</td>
                      <td className="px-5 py-4 text-[13px] text-dash-body">
                        {row.expertName ?? <span className="text-dash-muted">—</span>}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={row.status} />
                        {row.adminNote && (
                          <p className="mt-1 max-w-35 truncate text-[11px] text-red-400" title={row.adminNote}>
                            {row.adminNote}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          {(row.status === "ASSIGNED" || row.status === "COMPLETED") && (
                            <button
                              type="button"
                              onClick={() => { setError(null); setUploadTarget(row); setUploadFile(null); setConclusionText(""); setUploadMode("file"); }}
                              className="rounded-lg border border-dash-border bg-dash-bg px-3 py-1.5 text-[12px] font-semibold text-dash-body transition-colors hover:border-[#6D3AE2]/30 hover:text-[#6D3AE2]"
                            >
                              {row.status === "COMPLETED" ? "Обновить заключение" : "Загрузить заключение"}
                            </button>
                          )}
                          {(row.status === "PENDING" || row.status === "ASSIGNED") && (
                            <>
                              <button
                                type="button"
                                onClick={() => openAssign(row)}
                                className="rounded-lg border border-[#6D3AE2]/40 bg-[#6D3AE2]/10 px-3 py-1.5 text-[12px] font-semibold text-[#6D3AE2] transition-colors hover:bg-[#6D3AE2]/20"
                              >
                                {row.expertName ? "Сменить" : "Назначить эксперта"}
                              </button>
                              <button
                                type="button"
                                onClick={() => { setError(null); setRejectTarget(row); setRejectReason(""); }}
                                className="rounded-lg px-2 py-1.5 text-[12px] font-semibold text-red-400 transition-colors hover:bg-red-500/10"
                              >
                                Отклонить
                              </button>
                            </>
                          )}
                          {row.status === "COMPLETED" && row.reportUrl && (
                            <a
                              href={row.reportUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[12px] font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/20"
                            >
                              <ReportIcon url={row.reportUrl} />
                              Открыть заключение
                            </a>
                          )}
                          {row.status === "COMPLETED" && !row.reportUrl && row.reportText && (
                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[12px] font-semibold text-emerald-400">
                              <FileType className="h-4 w-4" />
                              Текстовое заключение
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex min-h-52 items-center justify-center p-6 text-center">
              <div>
                <p className="text-[15px] font-semibold text-dash-heading">Заявок пока нет</p>
                <p className="mt-1 text-[13px] text-dash-muted">
                  Заказы от клиентов на экспертный разбор появятся здесь.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── EXPERTS TAB ─────────────────────────────────────── */}
      {tab === "experts" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[14px] text-dash-muted">
              Эксперты, доступные для назначения на заявки.
            </p>
            <button
              type="button"
              onClick={openAddExpert}
              className="inline-flex items-center gap-2 rounded-xl bg-[#6D3AE2] px-4 py-2.5 text-[13px] font-semibold text-white shadow-[0_4px_14px_rgba(109,58,226,0.4)] transition-all hover:bg-[#7B4FF0]"
            >
              <UserPlus className="h-4 w-4" />
              Добавить эксперта
            </button>
          </div>

          {initialExperts.length > 0 ? (
            <div className="rounded-2xl border border-dash-border bg-dash-card">
              <table className="w-full min-w-135 text-left">
                <thead>
                  <tr className="border-b border-dash-border bg-dash-bg/40">
                    {["Имя", "Email", "Специализация", "Статус", "Действия"].map((h) => (
                      <th key={h} className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-dash-muted">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-dash-border">
                  {initialExperts.map((expert) => (
                    <tr key={expert.id} className="transition-colors hover:bg-dash-bg/30">
                      <td className="px-5 py-4 text-[13px] font-semibold text-dash-heading">
                        {expert.name}
                      </td>
                      <td className="px-5 py-4 text-[13px] text-dash-muted">
                        {expert.email ?? <span className="text-dash-muted/50">—</span>}
                      </td>
                      <td className="max-w-50 truncate px-5 py-4 text-[13px] text-dash-body">
                        {expert.specialty ?? <span className="text-dash-muted/50">—</span>}
                      </td>
                      <td className="px-5 py-4">
                        <span className={[
                          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                          expert.isActive
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                            : "border-dash-border bg-dash-bg text-dash-muted",
                        ].join(" ")}>
                          {expert.isActive ? "Активен" : "Отключён"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditExpert(expert)}
                            title="Редактировать"
                            className="rounded-lg p-2 text-dash-muted transition-colors hover:bg-dash-bg hover:text-[#6D3AE2]"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleActive(expert)}
                            title={expert.isActive ? "Деактивировать" : "Активировать"}
                            className={[
                              "rounded-lg p-2 transition-colors",
                              expert.isActive
                                ? "text-emerald-400 hover:bg-emerald-500/10"
                                : "text-dash-muted hover:bg-dash-bg hover:text-emerald-400",
                            ].join(" ")}
                          >
                            {expert.isActive
                              ? <ToggleRight className="h-4 w-4" />
                              : <ToggleLeft className="h-4 w-4" />
                            }
                          </button>
                          <button
                            type="button"
                            onClick={() => { setError(null); setDeleteTarget(expert); }}
                            title="Удалить"
                            className="rounded-lg p-2 text-dash-muted transition-colors hover:bg-red-500/10 hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-2xl border border-dash-border bg-dash-card p-10 text-center">
              <p className="text-[15px] font-semibold text-dash-heading">Нет экспертов</p>
              <p className="mt-1.5 text-[13px] text-dash-muted">
                Добавьте первого специалиста — он появится в списке для назначения на заявки.
              </p>
              <button
                type="button"
                onClick={openAddExpert}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#6D3AE2] px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-[#7B4FF0]"
              >
                <UserPlus className="h-4 w-4" />
                Добавить эксперта
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL: назначить эксперта ─────────────────────────────────────── */}
      <Modal
        open={Boolean(assignTarget)}
        title="Назначить эксперта"
        onClose={() => setAssignTarget(null)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setAssignTarget(null)} className="rounded-xl border border-dash-border bg-dash-card px-5 py-2.5 text-[13px] font-semibold text-dash-heading transition-colors hover:bg-dash-bg">
              Отмена
            </button>
            <button type="button" onClick={handleAssign} disabled={isPending || !selectedExpertName} className="rounded-xl bg-[#6D3AE2] px-5 py-2.5 text-[13px] font-semibold text-white disabled:opacity-60 hover:bg-[#7B4FF0]">
              {isPending ? "Сохраняем..." : "Назначить"}
            </button>
          </div>
        }
      >
        {assignTarget && (
          <div className="space-y-4">
            <div className="rounded-xl border border-dash-border bg-dash-bg px-4 py-3">
              <p className="text-[12px] text-dash-muted">Опрос</p>
              <p className="mt-0.5 text-[13px] font-semibold text-dash-heading">{assignTarget.surveyTitle}</p>
              <p className="mt-0.5 text-[12px] text-dash-muted">{assignTarget.client}</p>
            </div>
            <label className="grid gap-2">
              <span className="text-[13px] font-medium text-dash-heading">Эксперт</span>
              {activeExperts.length > 0 ? (
                <select
                  value={selectedExpertName}
                  onChange={(e) => setSelectedExpertName(e.target.value)}
                  className="h-11 w-full rounded-xl border border-dash-border bg-dash-bg px-3 text-[13px] text-dash-body outline-none focus:border-[#6D3AE2]/50 focus:ring-2 focus:ring-[#6D3AE2]/10"
                >
                  {activeExperts.map((expert) => (
                    <option key={expert.id} value={expert.name}>
                      {expert.name}{expert.specialty ? ` — ${expert.specialty}` : ""}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-[13px] text-amber-400">
                  Нет активных экспертов. Добавьте специалистов во вкладке «Эксперты».
                </div>
              )}
            </label>
          </div>
        )}
      </Modal>

      {/* ── MODAL: загрузить заключение ──────────────────────────────────── */}
      <Modal
        open={Boolean(uploadTarget)}
        title="Загрузить заключение"
        onClose={() => { if (!isUploading) { setUploadTarget(null); setUploadFile(null); setConclusionText(""); setUploadMode("file"); } }}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            {uploadMode === "file"
              ? <p className="text-[12px] text-dash-muted self-center">PDF, DOCX или TXT · до 20 МБ</p>
              : <p className="text-[12px] text-dash-muted self-center">Максимум 50 000 символов</p>
            }
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { if (!isUploading) { setUploadTarget(null); setUploadFile(null); setConclusionText(""); setUploadMode("file"); } }}
                className="rounded-xl border border-dash-border bg-dash-card px-5 py-2.5 text-[13px] font-semibold text-dash-heading hover:bg-dash-bg"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={isUploading || (uploadMode === "file" ? !uploadFile : !conclusionText.trim())}
                className="rounded-xl bg-[#6D3AE2] px-5 py-2.5 text-[13px] font-semibold text-white disabled:opacity-60 hover:bg-[#7B4FF0]"
              >
                {isUploading ? "Сохраняем..." : "Сохранить"}
              </button>
            </div>
          </div>
        }
      >
        {uploadTarget && (
          <div className="space-y-4">
            <div className="rounded-xl border border-dash-border bg-dash-bg px-4 py-3">
              <p className="text-[12px] text-dash-muted">Опрос</p>
              <p className="mt-0.5 text-[13px] font-semibold text-dash-heading">{uploadTarget.surveyTitle}</p>
            </div>

            {/* Mode toggle */}
            <div className="flex gap-1 rounded-xl border border-dash-border bg-dash-bg p-1 w-fit">
              {(["file", "text"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setUploadMode(mode)}
                  className={[
                    "rounded-[10px] px-4 py-1.5 text-[12px] font-semibold transition-colors",
                    uploadMode === mode
                      ? "bg-[#6D3AE2] text-white"
                      : "text-dash-muted hover:text-dash-heading",
                  ].join(" ")}
                >
                  {mode === "file" ? "Файл" : "Текст"}
                </button>
              ))}
            </div>

            {uploadMode === "file" ? (
              <label className="grid gap-2">
                <span className="text-[13px] font-medium text-dash-heading">Файл заключения</span>
                <input
                  type="file"
                  accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                  onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                  className="block w-full cursor-pointer rounded-xl border border-dash-border bg-dash-bg px-4 py-3 text-[13px] text-dash-body file:mr-4 file:rounded-lg file:border-0 file:bg-[#6D3AE2]/10 file:px-3 file:py-1 file:text-[12px] file:font-semibold file:text-[#6D3AE2]"
                />
                {uploadFile && (
                  <p className="text-[12px] text-dash-muted">
                    Выбран: <span className="font-medium text-dash-body">{uploadFile.name}</span>
                    {" "}({(uploadFile.size / 1024).toFixed(0)} КБ)
                  </p>
                )}
              </label>
            ) : (
              <label className="grid gap-2">
                <span className="text-[13px] font-medium text-dash-heading">Текст заключения</span>
                <textarea
                  value={conclusionText}
                  onChange={(e) => setConclusionText(e.target.value)}
                  rows={8}
                  placeholder="Введите экспертное заключение..."
                  className="w-full rounded-xl border border-dash-border bg-dash-bg px-4 py-3 text-[13px] text-dash-body outline-none placeholder:text-dash-muted focus:border-[#6D3AE2]/50 focus:ring-2 focus:ring-[#6D3AE2]/10 resize-y min-h-40"
                />
                <p className="text-right text-[11px] text-dash-muted">
                  {conclusionText.length.toLocaleString("ru-RU")} / 50 000
                </p>
              </label>
            )}
          </div>
        )}
      </Modal>

      {/* ── MODAL: отклонить заявку ──────────────────────────────────────── */}
      <Modal
        open={Boolean(rejectTarget)}
        title="Отклонить заявку"
        onClose={() => setRejectTarget(null)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setRejectTarget(null)} className="rounded-xl border border-dash-border bg-dash-card px-5 py-2.5 text-[13px] font-semibold text-dash-heading hover:bg-dash-bg">
              Отмена
            </button>
            <button type="button" onClick={handleReject} disabled={isPending} className="rounded-xl bg-red-500 px-5 py-2.5 text-[13px] font-semibold text-white disabled:opacity-60 hover:bg-red-600">
              {isPending ? "Отклоняем..." : "Отклонить и вернуть деньги"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {rejectTarget && (
            <div className="rounded-xl border border-dash-border bg-dash-bg px-4 py-3">
              <p className="text-[12px] text-dash-muted">Опрос</p>
              <p className="mt-0.5 text-[13px] font-semibold text-dash-heading">{rejectTarget.surveyTitle}</p>
              <p className="mt-0.5 text-[12px] text-dash-muted">Средства ({formatRub(rejectTarget.amount)}) будут возвращены клиенту автоматически.</p>
            </div>
          )}
          <label className="grid gap-2">
            <span className="text-[13px] font-medium text-dash-heading">Причина отклонения</span>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-dash-border bg-dash-bg px-4 py-3 text-[13px] text-dash-body outline-none placeholder:text-dash-muted focus:border-[#6D3AE2]/50 focus:ring-2 focus:ring-[#6D3AE2]/10"
              placeholder="Недостаточно данных, некорректный запрос..."
            />
          </label>
        </div>
      </Modal>

      {/* ── MODAL: добавить эксперта ─────────────────────────────────────── */}
      <Modal
        open={showAddExpert}
        title="Добавить эксперта"
        onClose={() => setShowAddExpert(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setShowAddExpert(false)} className="rounded-xl border border-dash-border bg-dash-card px-5 py-2.5 text-[13px] font-semibold text-dash-heading hover:bg-dash-bg">
              Отмена
            </button>
            <button type="button" onClick={handleAddExpert} disabled={isPending || !expertName.trim()} className="rounded-xl bg-[#6D3AE2] px-5 py-2.5 text-[13px] font-semibold text-white disabled:opacity-60 hover:bg-[#7B4FF0]">
              {isPending ? "Сохраняем..." : "Добавить"}
            </button>
          </div>
        }
      >
        <ExpertForm
          name={expertName} onName={setExpertName}
          email={expertEmail} onEmail={setExpertEmail}
          specialty={expertSpecialty} onSpecialty={setExpertSpecialty}
          inputCls={inputCls}
        />
      </Modal>

      {/* ── MODAL: редактировать эксперта ────────────────────────────────── */}
      <Modal
        open={Boolean(editTarget)}
        title="Редактировать эксперта"
        onClose={() => setEditTarget(null)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setEditTarget(null)} className="rounded-xl border border-dash-border bg-dash-card px-5 py-2.5 text-[13px] font-semibold text-dash-heading hover:bg-dash-bg">
              Отмена
            </button>
            <button type="button" onClick={handleUpdateExpert} disabled={isPending || !expertName.trim()} className="rounded-xl bg-[#6D3AE2] px-5 py-2.5 text-[13px] font-semibold text-white disabled:opacity-60 hover:bg-[#7B4FF0]">
              {isPending ? "Сохраняем..." : "Сохранить"}
            </button>
          </div>
        }
      >
        <ExpertForm
          name={expertName} onName={setExpertName}
          email={expertEmail} onEmail={setExpertEmail}
          specialty={expertSpecialty} onSpecialty={setExpertSpecialty}
          inputCls={inputCls}
        />
      </Modal>

      {/* ── MODAL: удалить эксперта ──────────────────────────────────────── */}
      <Modal
        open={Boolean(deleteTarget)}
        title="Удалить эксперта"
        onClose={() => setDeleteTarget(null)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setDeleteTarget(null)} className="rounded-xl border border-dash-border bg-dash-card px-5 py-2.5 text-[13px] font-semibold text-dash-heading hover:bg-dash-bg">
              Отмена
            </button>
            <button type="button" onClick={handleDeleteExpert} disabled={isPending} className="rounded-xl bg-red-500 px-5 py-2.5 text-[13px] font-semibold text-white disabled:opacity-60 hover:bg-red-600">
              {isPending ? "Удаляем..." : "Удалить"}
            </button>
          </div>
        }
      >
        {deleteTarget && (
          <p className="text-[14px] text-dash-body">
            Вы действительно хотите удалить <span className="font-semibold text-dash-heading">{deleteTarget.name}</span>?
            Это действие нельзя отменить.
          </p>
        )}
      </Modal>
    </div>
  );
}

function ExpertForm({
  name, onName, email, onEmail, specialty, onSpecialty, inputCls,
}: {
  name: string; onName: (v: string) => void;
  email: string; onEmail: (v: string) => void;
  specialty: string; onSpecialty: (v: string) => void;
  inputCls: string;
}) {
  return (
    <div className="space-y-4">
      <label className="grid gap-1.5">
        <span className="text-[13px] font-medium text-dash-heading">Имя <span className="text-red-400">*</span></span>
        <input value={name} onChange={(e) => onName(e.target.value)} placeholder="А. Сидорова" className={inputCls} />
      </label>
      <label className="grid gap-1.5">
        <span className="text-[13px] font-medium text-dash-heading">Email</span>
        <input type="email" value={email} onChange={(e) => onEmail(e.target.value)} placeholder="expert@example.com" className={inputCls} />
      </label>
      <label className="grid gap-1.5">
        <span className="text-[13px] font-medium text-dash-heading">Специализация</span>
        <input value={specialty} onChange={(e) => onSpecialty(e.target.value)} placeholder="Маркетинговые исследования, FMCG" className={inputCls} />
      </label>
    </div>
  );
}
