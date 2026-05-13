import webpush from 'web-push'
import { prisma } from '@/lib/prisma'

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
)

type PushPayload = {
  title: string
  body:  string
  url?:  string
  icon?: string
}

// Отправить push всем подпискам пользователя
export async function sendPushToUser(userId: string, payload: PushPayload) {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  })

  const icon = `${process.env.NEXTAUTH_URL}/icon-192.png`

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys:     { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify({ ...payload, icon }),
      )
    } catch (e: any) {
      // Подписка протухла — удалить
      if (e.statusCode === 410 || e.statusCode === 404) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } })
      }
    }
  }
}