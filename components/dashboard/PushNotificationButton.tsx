'use client'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { Bell, Loader2 } from 'lucide-react'

export default function PushNotificationButton() {
  const { permission, isSubscribed, isLoading, subscribe } = usePushNotifications()

  // Не поддерживается браузером
  if (typeof window !== 'undefined' && !('Notification' in window)) return null

  // Уже подписан или пользователь заблокировал — прячем кнопку
  if (isSubscribed || permission === 'denied') return null

  return (
    <button
      onClick={subscribe}
      disabled={isLoading}
      className="flex items-center gap-2 px-3 py-2 rounded-lg
                 text-sm text-brand hover:bg-brand/10
                 border border-brand/20 transition-colors
                 disabled:opacity-60 disabled:cursor-not-allowed"
      title="Включить push-уведомления"
    >
      {isLoading
        ? <Loader2 className="w-4 h-4 animate-spin" />
        : <Bell className="w-4 h-4" />
      }
      <span className="hidden sm:inline">
        {isLoading ? 'Подключаем...' : 'Уведомления'}
      </span>
    </button>
  )
}
