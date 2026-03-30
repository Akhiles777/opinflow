import PageHeader from "@/components/dashboard/PageHeader";
import RespondentProfileForm from "@/components/dashboard/RespondentProfileForm";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-utils";

function formatBirthDate(value: Date | null | undefined) {
  if (!value) {
    return null;
  }

  const time = value.getTime();
  if (Number.isNaN(time)) {
    return null;
  }

  return value.toISOString().slice(0, 10);
}

export default async function RespondentProfilePage() {
  const session = await requireRole("RESPONDENT");

  const profile = await prisma.respondentProfile.findUnique({
    where: { userId: session.user.id },
  });

  return (
    <div>
      <PageHeader title="Профиль" subtitle="Данные аккаунта и анкета респондента." />
      <RespondentProfileForm
        profile={{
          gender: profile?.gender ?? null,
          birthDate: formatBirthDate(profile?.birthDate),
          city: profile?.city ?? null,
          income: profile?.income ?? null,
          education: profile?.education ?? null,
          interests: profile?.interests ?? [],
          userName: session.user.name ?? null,
          userEmail: session.user.email ?? "",
          
        }}
      />
    </div>
  );
}
