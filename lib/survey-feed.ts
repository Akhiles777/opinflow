import { prisma } from "@/lib/prisma";

function getAge(date?: Date | null) {
  if (!date) return 0;
  return Math.floor((Date.now() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

export async function getSurveyFeed(userId: string) {
  const profile = await prisma.respondentProfile.findUnique({ where: { userId } });
  const sessions = await prisma.surveySession.findMany({ where: { userId }, select: { surveyId: true } });
  const exclude = sessions.map((session) => session.surveyId);
  const age = getAge(profile?.birthDate);
  const now = new Date();

  return prisma.survey.findMany({
    where: {
      status: "ACTIVE",
      id: { notIn: exclude.length > 0 ? exclude : ["_none_"] },
      AND: [
        { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ targetGender: "any" }, { targetGender: null }, { targetGender: profile?.gender ?? null }] },
        { OR: [{ targetAgeMin: null }, { targetAgeMin: { lte: age } }] },
        { OR: [{ targetAgeMax: null }, { targetAgeMax: { gte: age } }] },
        { OR: [{ targetCities: { isEmpty: true } }, profile?.city ? { targetCities: { has: profile.city } } : {}] },
      ],
    },
    include: {
      _count: { select: { sessions: { where: { isValid: true, status: "COMPLETED" } } } },
      questions: { select: { id: true } },
    },
    orderBy: [{ reward: "desc" }, { createdAt: "desc" }],
    take: 20,
  });
}

export async function getInProgressSurveys(userId: string) {
  return prisma.surveySession.findMany({
    where: { userId, status: "IN_PROGRESS" },
    include: {
      survey: {
        include: {
          questions: { select: { id: true } },
          _count: { select: { sessions: { where: { isValid: true, status: "COMPLETED" } } } },
        },
      },
    },
    orderBy: { startedAt: "desc" },
  });
}

export async function getCompletedSurveys(userId: string) {
  return prisma.surveySession.findMany({
    where: { userId, status: { in: ["COMPLETED", "REJECTED"] } },
    include: { survey: true },
    orderBy: { completedAt: "desc" },
    take: 50,
  });
}
