import { prisma } from '@/lib/prisma'

export type FraudCheckInput = {
  userId:    string
  surveyId:  string
  timeSpent: number             // секунды
  answers:   Record<string, any>
  ipAddress: string
  userAgent: string
  deviceId:  string
}


export type FraudCheckResult = {
  isValid: boolean
  flags:   string[]
}
export async function checkFraud(input: FraudCheckInput): Promise<FraudCheckResult> {
  const flags: string[] = []

  // Загружаем данные опроса параллельно
  const [survey, user, sameIpSession, sameDeviceSession] = await Promise.all([
    prisma.survey.findUnique({
      where:   { id: input.surveyId },
      include: { questions: true },
    }),
    prisma.user.findUnique({
      where: { id: input.userId },
    }),
    // Проверяем тот же IP у другого пользователя
    prisma.surveySession.findFirst({
      where: {
        surveyId:  input.surveyId,
        ipAddress: input.ipAddress,
        userId:    { not: input.userId },
        isValid:   true,
        status:    'COMPLETED',
      },
    }),
    // Проверяем то же устройство у другого пользователя
    input.deviceId
      ? prisma.surveySession.findFirst({
          where: {
            surveyId: input.surveyId,
            deviceId: input.deviceId,
            userId:   { not: input.userId },
            isValid:  true,
            status:   'COMPLETED',
          },
        })
      : Promise.resolve(null),
  ])

  // ─── Проверка 1: Слишком быстрое прохождение ───────────
  // Минимум 8 секунд на каждый вопрос
  const questionCount = survey?.questions.length ?? 5
  const minTimeSeconds = questionCount * 8
  if (input.timeSpent < minTimeSeconds) {
    flags.push('TOO_FAST')
  }

  // ─── Проверка 2: Дублирующий IP адрес ──────────────────
  if (sameIpSession) {
    flags.push('DUPLICATE_IP')
  }

  // ─── Проверка 3: Дублирующее устройство ────────────────
  if (sameDeviceSession) {
    flags.push('DUPLICATE_DEVICE')
  }

  // ─── Проверка 4: Одинаковые ответы на все вопросы ──────
  // Если пользователь тыкал одну и ту же кнопку везде
  const answerValues = Object.values(input.answers)
  if (answerValues.length > 3) {
    const firstAnswerStr = JSON.stringify(answerValues[0])
    const allSame = answerValues.every(v => JSON.stringify(v) === firstAnswerStr)
    if (allSame) {
      flags.push('IDENTICAL_ANSWERS')
    }
  }

  // ─── Проверка 5: Очень новый аккаунт ───────────────────
  // Аккаунт создан менее 24 часов назад
  if (user) {
    const accountAgeMs = Date.now() - user.createdAt.getTime()
    const oneDayMs = 24 * 60 * 60 * 1000
    if (accountAgeMs < oneDayMs) {
      flags.push('NEW_ACCOUNT')
    }
  }

  return {
    isValid: flags.length === 0,
    flags,
  }
}