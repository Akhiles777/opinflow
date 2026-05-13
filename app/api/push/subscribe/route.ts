import { NextRequest, NextResponse } from 'next/server'
import { auth }   from '@/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { endpoint, keys } = await req.json()
  const { p256dh, auth: authKey } = keys

  // Сохранить или обновить подписку
  await prisma.pushSubscription.upsert({
    where:  { endpoint },
    create: {
      userId:    session.user.id,
      endpoint,
      p256dh,
      auth:      authKey,
      userAgent: req.headers.get('user-agent') ?? undefined,
    },
    update: { p256dh, auth: authKey },
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const { endpoint } = await req.json()
  await prisma.pushSubscription.deleteMany({ where: { endpoint } })
  return NextResponse.json({ ok: true })
}