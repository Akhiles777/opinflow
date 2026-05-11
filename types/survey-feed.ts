import { prisma } from '@/lib/prisma'


function getAge(birthDate?: Date | null): number {
  if (!birthDate) return 0
  const diffMs = Date.now() - birthDate.getTime()
  return Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000))
}

export async function getSurveyFeed(userId: string) {
  
  const profile = await prisma.respondentProfile.findUnique({
    where: { userId },
  })

  
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

      
      id: { notIn: excludeIds.length > 0 ? excludeIds : [''] },

      
      OR: [
        { endsAt: null },
        { endsAt: { gt: now } },
      ],

      
      AND: [
        {
          OR: [
            { startsAt: null },
            { startsAt: { lte: now } },
          ],
        },

        
        {
          OR: [
            { targetGender: 'any' },
            { targetGender: null },
            { targetGender: profile?.gender ?? 'any' },
          ],
        },

        
        {
          OR: [
            { targetAgeMin: null },
            { targetAgeMin: { lte: userAge } },
          ],
        },

        
        {
          OR: [
            { targetAgeMax: null },
            { targetAgeMax: { gte: userAge } },
          ],
        },

        
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
      questions: { select: { id: true } },  
      _count:    { select: { sessions: { where: { isValid: true, status: 'COMPLETED' } } } },
    },

    orderBy: [
      { reward: 'desc' },     
      { createdAt: 'desc' },  
    ],

    take: 20,
  })

  return surveys
}


export async function getInProgressSurveys(userId: string) {
  return prisma.surveySession.findMany({
    where:   { userId, status: 'IN_PROGRESS' },
    include: { survey: { include: { questions: { select: { id: true } } } } },
    orderBy: { startedAt: 'desc' },
  })
}


export async function getCompletedSurveys(userId: string) {
  return prisma.surveySession.findMany({
    where:   { userId, status: { in: ['COMPLETED', 'REJECTED'] } },
    include: { survey: true },
    orderBy: { completedAt: 'desc' },
    take:    50,
  })
}