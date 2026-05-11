import { prisma } from "@/lib/prisma";
import { isPrismaSchemaMismatchError } from "@/lib/prisma-errors";

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
    targetHasChildren: string | null;
    targetEmploymentStatuses: string[];
    targetIndustries: string[];
    targetMaritalStatuses: string[];
  },
  profile: {
    gender: string | null;
    city: string | null;
    income: string | null;
    interests: string[];
    hasChildren?: string | null;
    employmentStatus?: string | null;
    industry?: string | null;
    maritalStatus?: string | null;
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

  if (!survey.targetHasChildren || survey.targetHasChildren === "any") {
    score += 1;
  } else if (survey.targetHasChildren === profile?.hasChildren) {
    score += 2;
  }

  if (survey.targetEmploymentStatuses.length === 0) {
    score += 1;
  } else if (profile?.employmentStatus && survey.targetEmploymentStatuses.includes(profile.employmentStatus)) {
    score += 2;
  }

  if (survey.targetIndustries.length === 0) {
    score += 1;
  } else if (profile?.industry && survey.targetIndustries.includes(profile.industry)) {
    score += 2;
  }

  if (survey.targetMaritalStatuses.length === 0) {
    score += 1;
  } else if (profile?.maritalStatus && survey.targetMaritalStatuses.includes(profile.maritalStatus)) {
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
  let profile: {
    birthDate: Date | null;
    gender: string | null;
    city: string | null;
    income: string | null;
    interests: string[];
    hasChildren?: string | null;
    employmentStatus?: string | null;
    industry?: string | null;
    maritalStatus?: string | null;
  } | null = null;

  try {
    profile = await prisma.respondentProfile.findUnique({
      where: { userId },
      select: {
        birthDate: true,
        gender: true,
        city: true,
        income: true,
        interests: true,
        hasChildren: true,
        employmentStatus: true,
        industry: true,
        maritalStatus: true,
      },
    });
  } catch (error) {
    if (!isPrismaSchemaMismatchError(error)) {
      throw error;
    }

    profile = await prisma.respondentProfile.findUnique({
      where: { userId },
      select: {
        birthDate: true,
        gender: true,
        city: true,
        income: true,
        interests: true,
      },
    });
  }
  const sessions = await prisma.surveySession.findMany({ where: { userId }, select: { surveyId: true } });
  const exclude = sessions.map((session) => session.surveyId);
  const age = getAge(profile?.birthDate);
  const now = new Date();
  
  const NEW_USER_WINDOW_DAYS = Number(process.env.NEW_USER_WINDOW_DAYS ?? "2");
  const NEW_SURVEY_BOOST_DAYS = Number(process.env.NEW_SURVEY_BOOST_DAYS ?? "2");

  
  let userCreatedAt: Date | null = null;
  try {
    const userRow = await prisma.user.findUnique({ where: { id: userId }, select: { createdAt: true } });
    userCreatedAt = userRow?.createdAt ?? null;
  } catch {
    userCreatedAt = null;
  }
  const userAgeDays = userCreatedAt ? Math.floor((now.getTime() - userCreatedAt.getTime()) / (1000 * 60 * 60 * 24)) : Infinity;
  let surveys: Array<{
    id: string;
    title: string;
    category: string | null;
    reward: unknown;
    estimatedTime: number | null;
    maxResponses: number | null;
    createdAt: Date;
    startsAt: Date | null;
    endsAt: Date | null;
    targetGender: string | null;
    targetAgeMin: number | null;
    targetAgeMax: number | null;
    targetCities: string[];
    targetIncomes: string[];
    targetInterests: string[];
    targetHasChildren: string | null;
    targetEmploymentStatuses: string[];
    targetIndustries: string[];
    targetMaritalStatuses: string[];
    _count: { sessions: number };
    questions: Array<{ id: string }>;
    creator: {
      name: string | null;
      clientProfile: { companyName: string | null } | null;
      surveysCreated: Array<{ status: string }>;
    };
  }> = [];

  const baseWhere = {
    status: "ACTIVE" as const,
    id: { notIn: exclude.length > 0 ? exclude : ["_none_"] },
    AND: [
      { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
      { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
    ],
  };

  try {
    surveys = await prisma.survey.findMany({
      where: baseWhere,
      select: {
        id: true,
        title: true,
        category: true,
        reward: true,
        estimatedTime: true,
        maxResponses: true,
        createdAt: true,
        startsAt: true,
        endsAt: true,
        targetGender: true,
        targetAgeMin: true,
        targetAgeMax: true,
        targetCities: true,
        targetIncomes: true,
        targetInterests: true,
        targetHasChildren: true,
        targetEmploymentStatuses: true,
        targetIndustries: true,
        targetMaritalStatuses: true,
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
  } catch (error) {
    if (!isPrismaSchemaMismatchError(error)) {
      throw error;
    }

    surveys = await prisma.survey.findMany({
      where: baseWhere,
      select: {
        id: true,
        title: true,
        category: true,
        reward: true,
        estimatedTime: true,
        maxResponses: true,
        createdAt: true,
        startsAt: true,
        endsAt: true,
        targetGender: true,
        targetAgeMin: true,
        targetAgeMax: true,
        targetCities: true,
        targetIncomes: true,
        targetInterests: true,
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
    }) as typeof surveys;
  }

  return surveys
    .map((survey) => {
      const surveyForScore = {
        ...survey,
        targetHasChildren: survey.targetHasChildren ?? null,
        targetEmploymentStatuses: survey.targetEmploymentStatuses ?? [],
        targetIndustries: survey.targetIndustries ?? [],
        targetMaritalStatuses: survey.targetMaritalStatuses ?? [],
      };
      let score = getMatchScore(surveyForScore, profile, age);

      
      const surveyAgeDays = Math.floor((now.getTime() - survey.createdAt.getTime()) / (1000 * 60 * 60 * 24));

      
      if (userAgeDays <= NEW_USER_WINDOW_DAYS && surveyAgeDays <= NEW_SURVEY_BOOST_DAYS) {
        
        const boost = Math.max(0, NEW_SURVEY_BOOST_DAYS - surveyAgeDays + 1);
        score += Math.min(3, boost);
      }

      
      if (userAgeDays > NEW_USER_WINDOW_DAYS && surveyAgeDays <= NEW_SURVEY_BOOST_DAYS) {
        
        score -= 0.8;
      }
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
    select: {
      id: true,
      surveyId: true,
      userId: true,
      status: true,
      startedAt: true,
      completedAt: true,
      timeSpent: true,
      ipAddress: true,
      userAgent: true,
      deviceId: true,
      isValid: true,
      fraudFlags: true,
      survey: {
        select: {
          id: true,
          title: true,
          category: true,
          reward: true,
          estimatedTime: true,
          maxResponses: true,
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
    select: {
      id: true,
      surveyId: true,
      userId: true,
      status: true,
      startedAt: true,
      completedAt: true,
      timeSpent: true,
      ipAddress: true,
      userAgent: true,
      deviceId: true,
      isValid: true,
      fraudFlags: true,
      survey: {
        select: {
          id: true,
          title: true,
          category: true,
          reward: true,
          estimatedTime: true,
          maxResponses: true,
          createdAt: true,
        },
      },
    },
    orderBy: { completedAt: "desc" },
    take: 50,
  });
}
