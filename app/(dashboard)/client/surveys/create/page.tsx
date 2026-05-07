import PageHeader from "@/components/dashboard/PageHeader";
import SurveyBuilder from "@/components/survey-builder/SurveyBuilder";
import { requireRole } from "@/lib/auth-utils";
import { getCommissionRate } from "@/lib/platform-settings";
import { prisma } from "@/lib/prisma";

export default async function ClientSurveyCreatePage() {
  const session = await requireRole("CLIENT");
  const [wallet, commissionRate] = await Promise.all([
    prisma.wallet.findUnique({ where: { userId: session.user.id }, select: { balance: true } }),
    getCommissionRate(),
  ]);

  return (
    <div>
      <PageHeader
        title="Создать опрос"
        subtitle="Соберите структуру исследования, настройте аудиторию и сразу увидите бюджет запуска."
      />

      <div className="mt-8">
        <SurveyBuilder balance={Number(wallet?.balance ?? 0)} commissionRate={commissionRate} />
      </div>
    </div>
  );
}
