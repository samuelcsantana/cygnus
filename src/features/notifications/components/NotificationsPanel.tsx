import { useTranslation } from 'react-i18next'

import { formatDateTimeDisplay } from '@/lib/date'
import { cn } from '@/lib/utils'

import type { Notification } from '../api/notifications.schemas'
import { NOTIFICATION_TYPE_META } from './notification-type-meta'

interface NotificationsPanelProps {
  notifications: Notification[]
  onMarkRead: (id: string) => void
  compact?: boolean
}

export function NotificationsPanel({ notifications, onMarkRead, compact = true }: NotificationsPanelProps) {
  const { t, i18n } = useTranslation()

  if (notifications.length === 0) {
    return <p className="p-4 text-center text-sm text-ink-muted">{t('notifications.empty')}</p>
  }

  return (
    <ul className={cn('divide-y divide-border', compact && 'max-h-96 overflow-y-auto')}>
      {notifications.map((notification) => {
        const isUnread = !notification.readAt
        const meta = NOTIFICATION_TYPE_META[notification.type]
        return (
          <li key={notification.id}>
            <button
              type="button"
              onClick={() => isUnread && onMarkRead(notification.id)}
              className={cn(
                'flex w-full items-start gap-3 px-3 py-3 text-left transition-colors hover:bg-muted',
                isUnread && 'bg-primary/5',
                compact ? 'gap-2' : 'gap-3.5',
              )}
            >
              {!compact && (
                <span
                  className={cn(
                    'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-lg',
                    meta.iconClassName,
                  )}
                >
                  {meta.emoji}
                </span>
              )}
              <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
                <span className="flex w-full items-center gap-2">
                  {isUnread && <span className="h-2 w-2 shrink-0 rounded-full bg-rose-500" />}
                  <span className="text-sm font-bold text-ink">{notification.title}</span>
                </span>
                <span className="text-xs text-ink-muted">{notification.message}</span>
                <span className="text-[11px] text-ink-muted">
                  {formatDateTimeDisplay(notification.createdAt, i18n.language)}
                </span>
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
