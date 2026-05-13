'use client'
import { useState, useEffect } from 'react'

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return
    setPermission(Notification.permission)
    checkSubscription()
  }, [])

  async function checkSubscription() {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    setIsSubscribed(!!sub)
  }

  async function subscribe() {
    const permission = await Notification.requestPermission()
    setPermission(permission)
    if (permission !== 'granted') return false

    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly:      true,
      applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    })

    await fetch('/api/push/subscribe', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(sub.toJSON()),
    })

    setIsSubscribed(true)
    return true
  }

  async function unsubscribe() {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (!sub) return

    await fetch('/api/push/subscribe', {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ endpoint: sub.endpoint }),
    })
    await sub.unsubscribe()
    setIsSubscribed(false)
  }

  return { permission, isSubscribed, subscribe, unsubscribe }
}