'use client'
import { useState, useEffect } from 'react'

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return new Uint8Array([...rawData].map((c) => c.charCodeAt(0)))
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return
    setPermission(Notification.permission)
    checkSubscription()
  }, [])

  async function checkSubscription() {
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      setIsSubscribed(!!sub)
    } catch {
      // SW not ready yet
    }
  }

  async function subscribe() {
    setIsLoading(true)
    try {
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== 'granted') return false

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) {
        console.error('[push] NEXT_PUBLIC_VAPID_PUBLIC_KEY not set')
        return false
      }

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      })

      setIsSubscribed(true)
      return true
    } catch (e) {
      console.error('[push] subscribe error:', e)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  async function unsubscribe() {
    setIsLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (!sub) return

      await fetch('/api/push/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      })
      await sub.unsubscribe()
      setIsSubscribed(false)
    } finally {
      setIsLoading(false)
    }
  }

  return { permission, isSubscribed, isLoading, subscribe, unsubscribe }
}
