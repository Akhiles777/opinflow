'use client'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { Bell, Loader2 } from 'lucide-react'

export default function PushNotificationButton() {
  const { permission, isSubscribed, isLoading, subscribe } = usePushNotifications()

  // Не поддерживается браузером
  if (typeof window !== 'undefined' && !('Notification' in window)) return null

  // Прячем кнопку если уже подписан или пользователь уже принял решение (grant/deny)
  if (isSubscribed || permission !== 'default') return null

  return (
    <button
      onClick={subscribe}
      disabled={isLoading}
      className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-dash-border bg-[#EFEAFF] text-dash-heading transition-colors hover:border-[#6D3AE2]/50 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white/[0.07] dark:text-white"
      title={isLoading ? 'Подключаем...' : 'Включить push-уведомления'}
    >
      {isLoading
        ? <Loader2 className="h-5 w-5 animate-spin" />
        : <Bell className="h-5 w-5" />
      }
    </button>
  )
}