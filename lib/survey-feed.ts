import { prisma } from "@/lib/prisma";

function getAge(date?: Date | null) {
  if (!date) return 0;
  return Math.floor((Date.now() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

function getMatchScore(
  survey: {
    targetGender: string | null;
    targetAgeMin: number | null;
    targetAgeMax: number | null;
    targetCities: string[];
    targetIncomes: string[];
    targetInterests: string[];
  },
  profile: {
    gender: string | null;
    city: string | null;
    income: string | null;
    interests: string[];
  } | null,
  age: number,
) {
  let score = 0;

  if (!survey.targetGender || survey.targetGender === "any") {
    score += 1;
  } else if (survey.targetGender === profile?.gender) {
    score += 3;
  }

  if (!survey.targetAgeMin && !survey.targetAgeMax) {
    score += 1;
  } else {
    if (!survey.targetAgeMin || age >= survey.targetAgeMin) score += 1;
    if (!survey.targetAgeMax || age <= survey.targetAgeMax) score += 1;
  }

  if (survey.targetCities.length === 0) {
    score += 1;
  } else if (profile?.city && survey.targetCities.includes(profile.city)) {
    score += 3;
  }

  if (survey.targetIncomes.length === 0) {
    score += 1;
  } else if (profile?.income && survey.targetIncomes.includes(profile.income)) {
    score += 2;
  }

  if (survey.targetInterests.length === 0) {
    score += 1;
  } else if ((profile?.interests ?? []).some((interest) => survey.targetInterests.includes(interest))) {
    score += 2;
  }

  return score;
}

function getCreatorRating(statuses: string[]) {
  if (statuses.length === 0) return 4.2;

  const rejected = statuses.filter((status) => status === "REJECTED").length;
  const completed = statuses.filter((status) => status === "COMPLETED").length;
  const active = statuses.filter((status) => status === "ACTIVE" || status === "PAUSED").length;
  const moderation = statuses.filter((status) => status === "PENDING_MODERATION").length;

  const qualityScore = (completed * 1.1 + active * 0.8 + moderation * 0.5 - rejected * 1.3) / statuses.length;
  const normalized = 4 + qualityScore * 0.8;

  return Math.max(2.5, Math.min(5, Number(normalized.toFixed(1))));
}

export async function getSurveyFeed(userId: string) {
  const profile = await prisma.respondentProfile.findUnique({ where: { userId } });
  const sessions = await prisma.surveySession.findMany({ where: { userId }, select: { surveyId: true } });
  const exclude = sessions.map((session) => session.surveyId);
  const age = getAge(profile?.birthDate);
  const now = new Date();
  const surveys = await prisma.survey.findMany({
    where: {
      status: "ACTIVE",
      id: { notIn: exclude.length > 0 ? exclude : ["_none_"] },
      AND: [
        { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
      ],
    },
    include: {
      _count: { select: { sessions: { where: { isValid: true, status: "COMPLETED" } } } },
      questions: { select: { id: true } },
      creator: {
        select: {
          name: true,
          clientProfile: { select: { companyName: true } },
          surveysCreated: {
            select: { status: true },
            take: 20,
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
    orderBy: [{ createdAt: "desc" }],
    take: 60,
  });

  return surveys
    .map((survey) => {
      const score = getMatchScore(survey, profile, age);
      return {
        ...survey,
        recommended: score >= 8,
        matchScore: score,
        creatorName: survey.creator.clientProfile?.companyName || survey.creator.name || "Заказчик",
        creatorRating: getCreatorRating(survey.creator.surveysCreated.map((item) => item.status)),
      };
    })
    .sort((left, right) => {
      if (right.matchScore !== left.matchScore) {
        return right.matchScore - left.matchScore;
      }

      const rightReward = Number(right.reward ?? 0);
      const leftReward = Number(left.reward ?? 0);
      if (rightReward !== leftReward) {
        return rightReward - leftReward;
      }

      return right.createdAt.getTime() - left.createdAt.getTime();
    })
    .slice(0, 30);
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
