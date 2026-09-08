import { useTranslation } from 'react-i18next'
import { formatDateTimeDisplay } from '@/lib/date'
import { cn } from '@/lib/utils'
import type { Notification } from '../api/notifications.schemas'
import { NOTIFICATION_TYPE_META } from './notification-type-meta'

interface NotificationsPanelProps {
  notifications: Notification[]
  onMarkRead: (id: string) => void
  onOpen?: (notification: Notification) => void
  babies?: { id: string; name: string }[]
  pending?: boolean
  compact?: boolean
}

// Older reminder messages include a UTC timestamp; preserve the message while
// displaying that instant in the reader's locale and timezone.
function formatNotificationMessage(message: string, locale: string): string {
  return message.replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z/g, (value) =>
    Number.isNaN(Date.parse(value)) ? value : formatDateTimeDisplay(value, locale),
  )
}

export function NotificationsPanel({
  notifications,
  onMarkRead,
  onOpen,
  babies,
  pending = false,
  compact = true,
}: NotificationsPanelProps) {
  const { t, i18n } = useTranslation()
  if (notifications.length === 0)
    return <p className="p-4 text-center text-sm text-ink-muted">{t('notifications.empty')}</p>
  return (
    <ul className={cn('divide-y divide-border', compact && 'max-h-96 overflow-y-auto')}>
      {notifications.map((notification) => {
        const isUnread = !notification.readAt
        const meta = NOTIFICATION_TYPE_META[notification.type]
        const baby = babies?.find((item) => item.id === notification.babyId)
        return (
          <li
            key={notification.id}
            className={cn('flex items-start gap-3 p-4 sm:p-5', isUnread && 'bg-primary/5')}
          >
            {!compact && (
              <span
                aria-hidden="true"
                className={cn(
                  'flex size-10 shrink-0 items-center justify-center rounded-xl text-lg',
                  meta.iconClassName,
                )}
              >
                {meta.emoji}
              </span>
            )}
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-ink-muted">
                {baby && <span>{baby.name}</span>}
                <span
                  className={cn(
                    'rounded-full px-2 py-1',
                    isUnread ? 'bg-primary text-primary-foreground' : 'bg-muted text-ink-muted',
                  )}
                >
                  {t(isUnread ? 'notifications.unread' : 'notifications.read')}
                </span>
              </div>
              <h2 className="break-words text-sm font-bold text-ink">{notification.title}</h2>
              <p className="break-words text-sm text-ink-muted">
                {formatNotificationMessage(notification.message, i18n.language)}
              </p>
              <time dateTime={notification.createdAt} className="block text-xs text-ink-muted">
                {formatDateTimeDisplay(notification.createdAt, i18n.language)}
              </time>
              <div className="flex flex-wrap gap-x-4">
                {onOpen && (
                  <button
                    type="button"
                    onClick={() => onOpen(notification)}
                    disabled={!baby}
                    className="min-h-11 text-sm font-semibold text-primary disabled:opacity-50"
                  >
                    {t(
                      notification.type === 'VACCINE_DELAYED'
                        ? 'notifications.openVaccine'
                        : 'notifications.openAppointment',
                    )}
                  </button>
                )}
                {isUnread && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => onMarkRead(notification.id)}
                    className="min-h-11 text-sm font-semibold text-ink-muted disabled:opacity-50"
                  >
                    {t('notifications.markRead')}
                  </button>
                )}
              </div>
              {onOpen && !baby && (
                <p className="text-xs text-ink-muted">{t('notifications.childUnavailable')}</p>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
