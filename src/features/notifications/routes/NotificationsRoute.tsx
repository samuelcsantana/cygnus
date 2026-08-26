import { useTranslation } from 'react-i18next'

import { EmptyState } from '@/shared/components/EmptyState'
import { BellIcon } from '@/shared/icons/bell-icon'

import { useMarkNotificationRead, useNotifications } from '../api/notifications.hooks'
import { NotificationsPanel } from '../components/NotificationsPanel'

export function NotificationsRoute() {
  const { t } = useTranslation()
  const notifications = useNotifications()
  const markRead = useMarkNotificationRead()

  const items = notifications.data ?? []
  const unreadItems = items.filter((notification) => !notification.readAt)

  const markAllRead = () => {
    Promise.all(unreadItems.map((notification) => markRead.mutateAsync(notification.id))).catch(() => {
      // surfaced per-item via markRead.isError elsewhere; a batch failure isn't fatal here
    })
  }

  return (
    <div className="animate-fade-in-up">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-display text-3xl font-extrabold text-ink">{t('notifications.title')}</h2>
          {/* unreadItems comes from `data ?? []`, so it is empty while the
              query is pending and while it failed — and "0 não lida" is a
              reassuring sentence to read when the truth is that nothing was
              fetched. Fifth screen with this shape. */}
          {notifications.isError ? (
            // Nothing on error: the message below already says the list did not
            // load.
            null
          ) : (
            <p className="mt-1 text-lg text-ink-muted">
              {notifications.isPending
                ? t('notifications.unreadCountUnavailable')
                : t('notifications.unreadCount', { count: unreadItems.length })}
            </p>
          )}
        </div>
        {unreadItems.length > 0 && (
          <button type="button" onClick={markAllRead} className="text-primary text-sm font-bold">
            {t('notifications.markAllRead')}
          </button>
        )}
      </div>

      {notifications.isPending ? (
        <div className="animate-pulse space-y-2">
          {[0, 1, 2].map((index) => (
            <div key={index} className="h-20 rounded-2xl bg-card shadow-sm" />
          ))}
        </div>
      ) : notifications.isError ? (
        <p className="py-16 text-center text-ink-muted">{t('notifications.genericError')}</p>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<BellIcon className="h-10 w-10" />}
          title={t('notifications.emptyState.title')}
          description={t('notifications.emptyState.description')}
          tone="rose"
        />
      ) : (
        <div className="overflow-hidden rounded-2xl bg-card shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <NotificationsPanel
            notifications={items}
            onMarkRead={(id) => markRead.mutate(id)}
            compact={false}
          />
        </div>
      )}
    </div>
  )
}
