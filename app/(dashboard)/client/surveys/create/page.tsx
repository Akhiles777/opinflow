import SurveyBuilder from "@/components/survey-builder/SurveyBuilder";
import PageHeader from "@/components/dashboard/PageHeader";
import { requireRole } from "@/lib/auth-utils";
import { getPlatformSettings } from "@/lib/platform-settings";
import { prisma } from "@/lib/prisma";

export default async function ClientSurveyCreatePage() {
  const session = await requireRole("CLIENT");
  const [wallet, platformSettings] = await Promise.all([
    prisma.wallet.findUnique({ where: { userId: session.user.id }, select: { balance: true } }),
    getPlatformSettings(),
  ]);

  return (
    <div>
      <PageHeader
        title="Создать опрос"
        subtitle="Соберите структуру исследования, настройте аудиторию и сразу увидите бюджет запуска."
      />
      <div className="mt-6">
        <SurveyBuilder
          balance={Number(wallet?.balance ?? 0)}
          commissionRate={platformSettings.commissionPercent / 100}
          minReward={platformSettings.minReward}
          userName={session.user.name ?? null}
          userEmail={session.user.email ?? null}
        />
      </div>
    </div>
  );
}
