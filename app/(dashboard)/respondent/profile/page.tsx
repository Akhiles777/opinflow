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

  let profile: {
    gender: string | null;
    birthDate: Date | null;
    city: string | null;
    income: string | null;
    education: string | null;
    interests: string[];
    image: string | null;
    userName: string | null;
    userEmail: string;
  } | null = null;

  try {
    const [respondentProfile, user] = await Promise.all([
      prisma.respondentProfile.findUnique({
        where: { userId: session.user.id },
        select: {
          gender: true,
          birthDate: true,
          city: true,
          income: true,
          education: true,
          interests: true,
        },
      }),
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          image: true,
          name: true,
          email: true,
        },
      }),
    ]);

    profile = {
      gender: respondentProfile?.gender ?? null,
      birthDate: respondentProfile?.birthDate ?? null,
      city: respondentProfile?.city ?? null,
      income: respondentProfile?.income ?? null,
      education: respondentProfile?.education ?? null,
      interests: respondentProfile?.interests ?? [],
      image: user?.image ?? null,
      userName: user?.name ?? session.user.name ?? null,
      userEmail: user?.email ?? session.user.email ?? "",
    };
  } catch (error) {
    console.error("[dashboard][respondent-profile-load-error]", {
      userId: session.user.id,
      error,
    });
  }

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
          userName: profile?.userName ?? session.user.name ?? null,
          userEmail: profile?.userEmail ?? session.user.email ?? "",
          image: profile?.image ?? null,
        }}
      />
    </div>
  );
}
