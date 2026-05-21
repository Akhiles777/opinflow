import PageHeader from "@/components/dashboard/PageHeader";
import AdminExpertsClient from "@/components/dashboard/AdminExpertsClient";
import { requireRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { EXPERT_OPTIONS } from "@/lib/expert-review";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function AdminExpertsPage() {
  await requireRole("ADMIN");

  const requests = await prisma.expertReviewRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      survey: {
        select: {
          id: true,
          title: true,
        },
      },
      user: {
        select: {
          email: true,
          clientProfile: { select: { companyName: true } },
        },
      },
    },
  });

  return (
    <div>
      <PageHeader title="Эксперты" subtitle="Заказы на экспертное заключение, назначение исполнителя и загрузка готового PDF." />

      <div className="mt-8">
        <AdminExpertsClient
          experts={[...EXPERT_OPTIONS]}
          requests={requests.map((item) => ({
            id: item.id,
            surveyId: item.survey.id,
            surveyTitle: item.survey.title,
            client: item.user.clientProfile?.companyName || item.user.email,
            date: formatDate(item.createdAt),
            expert: item.assignedExpert,
            amount: Number(item.amount),
            status: item.status,
            reportUrl: item.reportUrl,
            adminNote: item.adminNote,
          }))}
        />
      </div>
    </div>
  );
}
