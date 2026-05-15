'use client'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { BellIcon, BellSlashIcon } from 'lucide-react'

export default function PushNotificationButton() {
  const { permission, isSubscribed, subscribe, unsubscribe } = usePushNotifications()

  // Если браузер не поддерживает — не показываем кнопку
  if (typeof window !== 'undefined' && !('Notification' in window)) return null

  if (isSubscribed) {
    return (
      <button
        onClick={unsubscribe}
        className="flex items-center gap-2 px-3 py-2 rounded-lg
                   text-sm text-dash-muted hover:text-dash-body
                   hover:bg-dash-bg transition-colors"
        title="Отключить push уведомления"
      >
        <BellSlashIcon className="w-4 h-4" />
        <span className="hidden sm:inline">Уведомления вкл.</span>
      </button>
    )
  }

  return (
    <button
      onClick={subscribe}
      className="flex items-center gap-2 px-3 py-2 rounded-lg
                 text-sm text-brand hover:bg-brand/10
                 border border-brand/20 transition-colors"
      title="Включить push уведомления"
    >
      <BellIcon className="w-4 h-4" />
      <span className="hidden sm:inline">Включить уведомления</span>
    </button>
  )
}