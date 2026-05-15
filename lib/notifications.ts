import { prisma }                from '@/lib/prisma'
import {
  sendNewSurveyEmail, sendEarningEmail,
  sendWithdrawalStatusEmail, sendSurveyStatusEmail,
} from '@/lib/email'
import { sendPushToUser }        from '@/lib/push'
import type { NotificationType } from '@prisma/client'

type NotifyParams = {
  userId:  string
  type:    NotificationType
  title:   string
  body:    string
  link?:   string
  // Данные для email
  emailData?: Record<string, any>
}

export async function notify(params: NotifyParams) {
  // 1. Сохранить в БД
  const notification = await prisma.notification.create({
    data: {
      userId:  params.userId,
      type:    params.type,
      title:   params.title,
      body:    params.body,
      link:    params.link,
    },
    select: {
      id: true,
    },
  })

  // 2. Отправить Push (не блокируем основной поток)
  try {
    const pushDelivered = await sendPushToUser(params.userId, {
      title: params.title,
      body:  params.body,
      url:   params.link,
    })

    if (pushDelivered) {
      await prisma.notification.update({
        where: { id: notification.id },
        data:  { sentPush: true },
      })
    }
  } catch (error) {
    console.error('[notify] push error:', error)
  }

  // 3. Отправить Email по типу
  const user = await prisma.user.findUnique({
    where:  { id: params.userId },
    select: { email: true, name: true },
  })
  if (!user?.email) return

  const name = user.name ?? 'Пользователь'
  let emailSent = false

  try {
    switch (params.type) {
      case 'NEW_SURVEY':
        await sendNewSurveyEmail(user.email, name, {
          title:         String(params.emailData?.title ?? params.emailData?.surveyTitle ?? params.title),
          reward:        Number(params.emailData?.reward ?? 0),
          estimatedTime: params.emailData?.estimatedTime ?? null,
          id:            String(params.emailData?.id ?? params.link?.split('/').pop() ?? ''),
        })
        emailSent = true
        break
      case 'EARNING_CREDITED':
        await sendEarningEmail(
          user.email, name,
          params.emailData?.amount,
          params.emailData?.surveyTitle,
        )
        emailSent = true
        break
      case 'WITHDRAWAL_STATUS':
        await sendWithdrawalStatusEmail(
          user.email, name,
          params.emailData?.amount,
          params.emailData?.status,
          params.emailData?.adminNote,
        )
        emailSent = true
        break
      case 'SURVEY_APPROVED':
        await sendSurveyStatusEmail(user.email, name, params.emailData?.surveyTitle, 'APPROVED')
        emailSent = true
        break
      case 'SURVEY_REJECTED':
        await sendSurveyStatusEmail(
          user.email, name,
          params.emailData?.surveyTitle,
          'REJECTED',
          params.emailData?.moderationNote,
        )
        emailSent = true
        break
    }

    if (emailSent) {
      await prisma.notification.update({
        where: { id: notification.id },
        data:  { sentEmail: true },
      })
    }
  } catch (e) {
    console.error('[notify] email error:', e)
  }
}

// Отправить всем подходящим респондентам о новом опросе
export async function notifyRespondentsNewSurvey(survey: {
  id: string; title: string; reward: any; estimatedTime: number | null
  targetGender: string | null; targetAgeMin: number | null; targetAgeMax: number | null
  targetCities: string[]
}) {
  // Найти подходящих респондентов
  const respondents = await prisma.user.findMany({
    where: {
      role:   'RESPONDENT',
      status: 'ACTIVE',
      respondentProfile: {
        // Базовый таргетинг
        OR: [
          { gender: null },
          { gender: survey.targetGender ?? undefined },
        ],
      },
    },
    select: { id: true, email: true, name: true },
    take: 500, // не спамить всем сразу
  })

  const BATCH_SIZE = 10

  for (let index = 0; index < respondents.length; index += BATCH_SIZE) {
    const batch = respondents.slice(index, index + BATCH_SIZE)

    await Promise.allSettled(
      batch.map(async (user) => {
        // Не отправлять тем кто уже проходил
        const alreadyDone = await prisma.surveySession.findUnique({
          where: { surveyId_userId: { surveyId: survey.id, userId: user.id } },
        })
        if (alreadyDone) return

        await notify({
          userId: user.id,
          type:   'NEW_SURVEY',
          title:  'Новый опрос для вас',
          body:   `${survey.title} — ${Number(survey.reward)} ₽`,
          link:   `/survey/${survey.id}`,
          emailData: {
            title:         survey.title,
            reward:        Number(survey.reward),
            estimatedTime: survey.estimatedTime,
            id:            survey.id,
          },
        })
      }),
    )
  }
}
