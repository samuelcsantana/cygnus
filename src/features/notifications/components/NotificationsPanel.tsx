import { useTranslation } from 'react-i18next'

import { formatDateTimeDisplay } from '@/lib/date'
import { cn } from '@/lib/utils'

import type { Notification } from '../api/notifications.schemas'

interface NotificationsPanelProps {
  notifications: Notification[]
  onMarkRead: (id: string) => void
}

export function NotificationsPanel({ notifications, onMarkRead }: NotificationsPanelProps) {
  const { t, i18n } = useTranslation()

  if (notifications.length === 0) {
    return <p className="p-4 text-center text-sm text-slate-400">{t('notifications.empty')}</p>
  }

  return (
    <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
      {notifications.map((notification) => {
        const isUnread = !notification.readAt
        return (
          <li key={notification.id}>
            <button
              type="button"
              onClick={() => isUnread && onMarkRead(notification.id)}
              className={cn(
                'flex w-full flex-col items-start gap-1 px-3 py-3 text-left transition-colors hover:bg-slate-50',
                isUnread && 'bg-primary/5',
              )}
            >
              <div className="flex w-full items-center gap-2">
                {isUnread && <span className="h-2 w-2 shrink-0 rounded-full bg-rose-500" />}
                <span className="text-sm font-bold text-slate-900">{notification.title}</span>
              </div>
              <p className="text-xs text-slate-500">{notification.message}</p>
              <span className="text-[11px] text-slate-400">
                {formatDateTimeDisplay(notification.createdAt, i18n.language)}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
