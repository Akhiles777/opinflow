import PageHeader from "@/components/dashboard/PageHeader";
import ClientProfileForm from "@/components/dashboard/ClientProfileForm";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-utils";

export default async function ClientSettingsPage() {
  const session = await requireRole("CLIENT");

  const profile = await prisma.clientProfile.findUnique({
    where: { userId: session.user.id },
  });

  return (
    <div>
      <PageHeader title="Настройки" subtitle="Профиль компании и реквизиты." />
      <ClientProfileForm
        profile={{
          companyName: profile?.companyName ?? null,
          inn: profile?.inn ?? null,
          contactName: profile?.contactName ?? null,
          phone: profile?.phone ?? null,
          legalAddress: profile?.legalAddress ?? null,
          bankName: profile?.bankName ?? null,
          bankAccount: profile?.bankAccount ?? null,
          bankBik: profile?.bankBik ?? null,
          userEmail: session.user.email ?? "",
        }}
      />
    </div>
  );
}
