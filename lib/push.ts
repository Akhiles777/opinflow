import webpush from 'web-push'
import { prisma } from '@/lib/prisma'

const vapidEmail = process.env.VAPID_EMAIL
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
const pushConfigured = Boolean(vapidEmail && vapidPublicKey && vapidPrivateKey)

if (pushConfigured) {
  webpush.setVapidDetails(vapidEmail!, vapidPublicKey!, vapidPrivateKey!)
}

type PushPayload = {
  title: string
  body:  string
  url?:  string
  icon?: string
}

// Отправить push всем подпискам пользователя
export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!pushConfigured) {
    return false
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  })

  const icon = `${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/icon-192.png`
  let delivered = false

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys:     { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify({ ...payload, icon }),
      )
      delivered = true
    } catch (e: any) {
      // Подписка протухла — удалить
      if (e.statusCode === 410 || e.statusCode === 404) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } })
      }
    }
  }

  return delivered
}
