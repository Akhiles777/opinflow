import PageHeader from "@/components/dashboard/PageHeader";
import AdminExpertsClient from "@/components/dashboard/AdminExpertsClient";
import { requireRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { getAllExperts } from "@/lib/expert-review";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export default async function AdminExpertsPage() {
  await requireRole("ADMIN");

  const [requests, experts] = await Promise.all([
    prisma.expertReviewRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        survey: { select: { id: true, title: true } },
        user: { select: { email: true, clientProfile: { select: { companyName: true } } } },
      },
    }),
    getAllExperts(),
  ]);

  return (
    <div>
      <PageHeader
        title="Эксперты"
        subtitle="Заказы на экспертные заключения и назначение специалистов."
      />
      <div className="mt-8">
        <AdminExpertsClient
          experts={experts}
          requests={requests.map((item) => ({
            id: item.id,
            surveyId: item.survey.id,
            surveyTitle: item.survey.title,
            client: item.user.clientProfile?.companyName || item.user.email,
            date: formatDate(item.createdAt),
            expertName: item.assignedExpert,
            amount: Number(item.amount),
            status: item.status,
            reportUrl: item.reportUrl,
            reportText: item.reportText,
            adminNote: item.adminNote,
          }))}
        />
      </div>
    </div>
  );
}
