import { requireRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/dashboard/PageHeader";
import AdminSettingsClient from "@/components/dashboard/AdminSettingsClient";

export default async function AdminSettingsPage() {
  await requireRole("ADMIN");

  const settings = await prisma.platformSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton" },
    update: {},
  });

  return (
    <div>
      <PageHeader
        title="Настройки платформы"
        subtitle="Комиссии, лимиты и системные параметры."
      />
      <div className="mt-8">
        <AdminSettingsClient
          initialData={{
            commissionPercent: Number(settings.commissionPercent),
            minWithdrawal: Number(settings.minWithdrawal),
            minReward: Number(settings.minReward),
            maintenanceMode: settings.maintenanceMode,
            adminEmail: settings.adminEmail,
          }}
        />
      </div>
    </div>
  );
}
