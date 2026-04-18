import PageHeader from "@/components/dashboard/PageHeader";
import AdminModerationClient from "@/components/dashboard/AdminModerationClient";
import { requireRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export default async function AdminModerationPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  await requireRole("ADMIN");
  const params = (await searchParams) ?? {};
  const activeTab = params.tab === "approved" ? "approved" : params.tab === "rejected" ? "rejected" : "pending";

  const status = activeTab === "approved" ? "ACTIVE" : activeTab === "rejected" ? "REJECTED" : "PENDING_MODERATION";

  const surveys = await prisma.survey.findMany({
    where: { status },
    select: {
      id: true,
      title: true,
      status: true,
      budget: true,
      createdAt: true,
      moderationNote: true,
      creator: {
        select: {
          name: true,
          email: true,
          clientProfile: { select: { companyName: true } },
        },
      },
      questions: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          required: true,
          mediaUrl: true,
          options: true,
          settings: true,
          logic: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Модерация"
        subtitle="Проверяйте новые опросы перед публикацией, открывайте превью и принимайте решение без перехода в отдельный экран."
      />

      <div className="mt-8">
        <AdminModerationClient surveys={surveys.map((survey) => ({ ...survey, budget: survey.budget ? Number(survey.budget) : null }))} activeTab={activeTab} />
      </div>
    </div>
  );
}
