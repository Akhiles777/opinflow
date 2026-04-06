import { prisma } from '@/lib/prisma'

// Возраст в годах из даты рождения
function getAge(birthDate?: Date | null): number {
  if (!birthDate) return 0
  const diffMs = Date.now() - birthDate.getTime()
  return Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000))
}

export async function getSurveyFeed(userId: string) {
  // Загружаем профиль респондента для таргетинга
  const profile = await prisma.respondentProfile.findUnique({
    where: { userId },
  })

  // ID опросов которые пользователь уже проходил (или проходит)
  const existingSessions = await prisma.surveySession.findMany({
    where:  { userId },
    select: { surveyId: true },
  })
  const excludeIds = existingSessions.map(s => s.surveyId)

  const userAge = getAge(profile?.birthDate)
  const now = new Date()

  const surveys = await prisma.survey.findMany({
    where: {
      status: 'ACTIVE',

      // Исключить уже пройденные
      id: { notIn: excludeIds.length > 0 ? excludeIds : [''] },

      // Опрос ещё идёт
      OR: [
        { endsAt: null },
        { endsAt: { gt: now } },
      ],

      // Опрос уже начался
      AND: [
        {
          OR: [
            { startsAt: null },
            { startsAt: { lte: now } },
          ],
        },

        // Таргетинг по полу
        {
          OR: [
            { targetGender: 'any' },
            { targetGender: null },
            { targetGender: profile?.gender ?? 'any' },
          ],
        },

        // Таргетинг по минимальному возрасту
        {
          OR: [
            { targetAgeMin: null },
            { targetAgeMin: { lte: userAge } },
          ],
        },

        // Таргетинг по максимальному возрасту
        {
          OR: [
            { targetAgeMax: null },
            { targetAgeMax: { gte: userAge } },
          ],
        },

        // Таргетинг по городу
        {
          OR: [
            { targetCities: { isEmpty: true } },
            profile?.city
              ? { targetCities: { has: profile.city } }
              : {},
          ],
        },
      ],
    },

    include: {
      questions: { select: { id: true } },  // только для подсчёта
      _count:    { select: { sessions: { where: { isValid: true, status: 'COMPLETED' } } } },
    },

    orderBy: [
      { reward: 'desc' },     // сначала самые дорогие
      { createdAt: 'desc' },  // потом новые
    ],

    take: 20,
  })

  return surveys
}

// Незавершённые сессии пользователя (опросы в работе)
export async function getInProgressSurveys(userId: string) {
  return prisma.surveySession.findMany({
    where:   { userId, status: 'IN_PROGRESS' },
    include: { survey: { include: { questions: { select: { id: true } } } } },
    orderBy: { startedAt: 'desc' },
  })
}

// Завершённые сессии пользователя
export async function getCompletedSurveys(userId: string) {
  return prisma.surveySession.findMany({
    where:   { userId, status: { in: ['COMPLETED', 'REJECTED'] } },
    include: { survey: true },
    orderBy: { completedAt: 'desc' },
    take:    50,
  })
}