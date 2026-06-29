import { requireRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Badge from "@/components/dashboard/Badge";
import PageHeader from "@/components/dashboard/PageHeader";

const SELF_SERVICE_FREE_LIMIT = 5;

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Активна",
  COMPLETED: "Завершена",
  DRAFT: "Черновик",
  PAUSED: "Пауза",
  PENDING_MODERATION: "На модерации",
  REJECTED: "Отклонена",
};

type BadgeVariant = "active" | "pending" | "rejected" | "draft" | "moderation" | "completed";

function statusBadge(status: string): BadgeVariant {
  if (status === "ACTIVE") return "active";
  if (status === "COMPLETED") return "completed";
  if (status === "DRAFT") return "draft";
  if (status === "REJECTED") return "rejected";
  if (status === "PENDING_MODERATION") return "moderation";
  return "pending";
}

export default async function SelfServiceSurveysPage() {
  const session = await requireRole("CLIENT");

  const surveys = await prisma.survey.findMany({
    where: { creatorId: session.user.id, surveyMode: "SELF_SERVICE" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      status: true,
      createdAt: true,
      publicLinkSlug: true,
      aiAnalyticsPaid: true,
      _count: { select: { responses: true } },
    },
  });

  const usedFree = surveys.length;
  const freeLeft = Math.max(0, SELF_SERVICE_FREE_LIMIT - usedFree);
  const baseUrl = process.env.NEXTAUTH_URL ?? "";

  return (
    <div className="space-y-6">
      <PageHeader title="Анкета для своей базы" />

      {/* Counter banner */}
      <div className="rounded-2xl border border-dash-border bg-dash-card p-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div>
          <p className="text-[13px] text-dash-muted">
            Бесплатных анкет осталось:{" "}
            <span className={freeLeft > 0 ? "font-bold text-brand" : "font-bold text-orange-500"}>
              {freeLeft} из {SELF_SERVICE_FREE_LIMIT}
            </span>
          </p>
          <p className="text-[12px] text-dash-muted mt-0.5">
            {freeLeft > 0
              ? "Создайте анкету и поделитесь ссылкой со своей аудиторией."
              : "Лимит бесплатных анкет исчерпан. Дальнейшие создаются как платные опросы."}
          </p>
        </div>
        <Link
          href="/client/surveys/self-service/create"
          className="shrink-0 rounded-xl bg-brand px-6 py-2.5 text-[13px] font-semibold text-white hover:opacity-90 transition-opacity"
        >
          + Создать анкету
        </Link>
      </div>

      {/* List */}
      {surveys.length === 0 ? (
        <div className="rounded-2xl border border-dash-border bg-dash-card p-12 text-center text-dash-muted">
          Анкет пока нет. Создайте первую бесплатно.
        </div>
      ) : (
        <div className="rounded-2xl border border-dash-border bg-dash-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dash-border bg-dash-bg text-left text-[12px] font-semibold uppercase tracking-wide text-dash-muted">
                <th className="px-5 py-3">Название</th>
                <th className="px-5 py-3 hidden sm:table-cell">Ответов</th>
                <th className="px-5 py-3 hidden md:table-cell">ИИ-анализ</th>
                <th className="px-5 py-3">Статус</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dash-border">
              {surveys.map((s) => (
                <tr key={s.id} className="hover:bg-dash-bg/50 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-medium text-dash-heading line-clamp-1">{s.title}</p>
                    {s.publicLinkSlug && (
                      <p className="mt-0.5 text-[11px] text-dash-muted truncate max-w-[200px]">
                        {baseUrl}/s/{s.publicLinkSlug}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell text-dash-heading tabular-nums">
                    {s._count.responses}
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    {s.aiAnalyticsPaid ? (
                      <span className="text-xs font-medium text-green-600">Куплен</span>
                    ) : (
                      <span className="text-xs text-dash-muted">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant={statusBadge(s.status)}>
                      {STATUS_LABELS[s.status] ?? s.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/client/surveys/self-service/${s.id}`}
                      className="rounded-lg border border-dash-border px-3 py-1.5 text-[12px] font-medium text-dash-muted hover:text-dash-heading transition-colors"
                    >
                      Открыть
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
