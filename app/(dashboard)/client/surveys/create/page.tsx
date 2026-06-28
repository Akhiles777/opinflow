import SurveyCreateTabs from "@/components/survey-builder/SurveyCreateTabs";
import PageHeader from "@/components/dashboard/PageHeader";
import { requireRole } from "@/lib/auth-utils";
import { getPlatformSettings } from "@/lib/platform-settings";
import { prisma } from "@/lib/prisma";
import { loadSurveyAsDraftAction } from "@/actions/surveys";

export default async function ClientSurveyCreatePage({
  searchParams,
}: {
  searchParams?: Promise<{ draft?: string }>;
}) {
  const session = await requireRole("CLIENT");
  const params = (await searchParams) ?? {};

  const [wallet, platformSettings] = await Promise.all([
    prisma.wallet.findUnique({ where: { userId: session.user.id }, select: { balance: true } }),
    getPlatformSettings(),
  ]);

  // Load server-side draft if ?draft=id is in URL
  let initialDraftId: string | undefined;
  let initialDraftStep: number | undefined;
  let initialDraftData: import("@/types/survey").SurveyDraft | undefined;

  if (params.draft) {
    const result = await loadSurveyAsDraftAction(params.draft);
    if ("success" in result) {
      initialDraftId = params.draft;
      initialDraftStep = result.step;
      initialDraftData = result.draft;
    }
  }

  return (
    <div>
      <PageHeader
        title="Создать опрос"
        subtitle="Соберите структуру исследования вручную или сгенерируйте его с помощью ИИ."
      />
      <div className="mt-6">
        <SurveyCreateTabs
          balance={Number(wallet?.balance ?? 0)}
          commissionRate={platformSettings.commissionPercent / 100}
          minReward={platformSettings.minReward}
          userName={session.user.name ?? null}
          userEmail={session.user.email ?? null}
          initialDraftId={initialDraftId}
          initialDraftStep={initialDraftStep}
          initialDraftData={initialDraftData}
        />
      </div>
    </div>
  );
}
