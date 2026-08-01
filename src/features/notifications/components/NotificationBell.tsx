import { useTranslation } from 'react-i18next'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { BellIcon } from '@/shared/icons/bell-icon'

import { useMarkNotificationRead, useNotifications } from '../api/notifications.hooks'
import { NotificationsPanel } from './NotificationsPanel'

export function NotificationBell() {
  const { t } = useTranslation()
  const notifications = useNotifications()
  const markRead = useMarkNotificationRead()

  const items = notifications.data ?? []
  const unreadCount = items.filter((notification) => !notification.readAt).length

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={t('notifications.bellAria', { count: unreadCount })}
          className="hover:text-primary relative rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-50"
        >
          <BellIcon className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-rose-500 text-[9px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 sm:w-96">
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="text-sm font-bold text-slate-900">{t('notifications.title')}</p>
        </div>
        <NotificationsPanel notifications={items} onMarkRead={(id) => markRead.mutate(id)} />
      </PopoverContent>
    </Popover>
  )
}
