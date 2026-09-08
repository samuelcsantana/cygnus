import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useBabies } from '@/features/babies/api/babies.hooks'
import { EmptyState } from '@/shared/components/EmptyState'
import { BellIcon } from '@/shared/icons/bell-icon'
import { useSelectedBabyStore } from '@/shared/stores/selectedBaby.store'
import { useSearchDestinationStore } from '@/shared/stores/searchDestination.store'
import { useMarkNotificationsRead, useNotifications } from '../api/notifications.hooks'
import type { Notification } from '../api/notifications.schemas'
import { NotificationsPanel } from '../components/NotificationsPanel'

export function NotificationsRoute() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const notifications = useNotifications()
  const babies = useBabies()
  const markRead = useMarkNotificationsRead()
  const busy = useRef(false)
  const [feedback, setFeedback] = useState<{
    error: boolean
    text: string
  } | null>(null)
  const [unreadOnly, setUnreadOnly] = useState(false)
  const selectedId = useSelectedBabyStore((state) => state.selectedBabyId)
  const selectBaby = useSelectedBabyStore((state) => state.select)
  const items = (notifications.data ?? []).filter(
    (item) => !selectedId || item.babyId === selectedId,
  )
  const unreadItems = items.filter((item) => !item.readAt)
  const visible = unreadOnly ? unreadItems : items

  const read = async (ids: string[]) => {
    if (busy.current || ids.length === 0) return
    busy.current = true
    setFeedback(null)
    try {
      const { failed } = await markRead.mutateAsync(ids)
      const text = failed
        ? t('notifications.readFailed', { count: failed })
        : t('notifications.readSuccess', { count: ids.length })
      setFeedback({ error: failed > 0, text })
      if (failed) toast.error(text)
    } catch {
      const text = t('notifications.readFailed', { count: ids.length })
      setFeedback({ error: true, text })
      toast.error(text)
    } finally {
      busy.current = false
    }
  }

  const open = (item: Notification) => {
    const path = item.type === 'VACCINE_DELAYED' ? '/vaccines' : '/appointments'
    selectBaby(item.babyId)
    useSearchDestinationStore.getState().set({
      source: 'notification',
      path,
      babyId: item.babyId,
      query: item.title,
      keys: [
        item.type === 'VACCINE_DELAYED'
          ? `vaccine:${item.babyId}:${item.referenceId}`
          : `appointment:${item.referenceId}`,
      ],
    })
    navigate(path)
  }

  return (
    <div className="animate-fade-in-up">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-ink">
            {t('notifications.title')}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">{t('notifications.intro')}</p>
        </div>
        {unreadItems.length > 0 && (
          <button
            type="button"
            disabled={markRead.isPending}
            onClick={() => void read(unreadItems.map((item) => item.id))}
            className="min-h-11 rounded-xl px-3 text-sm font-bold text-primary hover:bg-muted disabled:opacity-50"
          >
            {t(markRead.isPending ? 'notifications.marking' : 'notifications.markFilteredRead')}
          </button>
        )}
      </div>
      <div className="mb-5 flex flex-wrap items-end gap-4">
        <div className="flex w-full flex-col gap-1 sm:w-60">
          <label htmlFor="notification-child" className="text-sm font-semibold text-ink">
            {t('notifications.childFilter')}
          </label>
          <Select
            value={selectedId ?? 'all'}
            disabled={babies.isPending || babies.isError}
            onValueChange={(value) => {
              selectBaby(value === 'all' ? null : value)
              setFeedback(null)
            }}
          >
            <SelectTrigger id="notification-child" className="w-full rounded-xl px-3 data-[size=default]:h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              position="popper"
              align="start"
              sideOffset={4}
              className="w-(--radix-select-trigger-width) rounded-2xl p-1.5 shadow-lg [&_[data-position=popper]]:min-w-0"
            >
              <SelectItem
                value="all"
                className="min-h-11 rounded-xl pl-3 pr-9 data-[state=checked]:bg-primary/10 data-[state=checked]:font-semibold data-[state=checked]:text-ink"
              >{t('notifications.allChildren')}</SelectItem>
              {(babies.data ?? []).map((baby) => (
                <SelectItem
                  key={baby.id}
                  value={baby.id}
                  className="min-h-11 rounded-xl pl-3 pr-9 data-[state=checked]:bg-primary/10 data-[state=checked]:font-semibold data-[state=checked]:text-ink"
                >
                  {baby.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold text-ink">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(event) => setUnreadOnly(event.target.checked)}
            className="size-4 accent-primary"
          />
          {t('notifications.unreadOnly')}
        </label>
        {!notifications.isError && (
          <p className="py-3 text-sm text-ink-muted" role="status">
            {notifications.isPending
              ? t('notifications.unreadCountUnavailable')
              : t('notifications.unreadCount', { count: unreadItems.length })}
          </p>
        )}
      </div>
      {babies.isError && (
        <div role="alert" className="mb-4 text-sm text-ink-muted">
          {t('notifications.childrenError')}
          <button
            type="button"
            onClick={() => void babies.refetch()}
            className="ml-2 min-h-11 font-semibold text-primary"
          >
            {t('nav.shell.retry')}
          </button>
        </div>
      )}
      {feedback && (
        <p
          role={feedback.error ? 'alert' : 'status'}
          className="mb-4 rounded-xl border border-border bg-card p-3 text-sm text-ink"
        >
          {feedback.text}
        </p>
      )}
      {notifications.isError && (
        <div
          role="alert"
          className="mb-4 rounded-2xl border border-border bg-card p-4 text-sm text-ink-muted"
        >
          <p>{t('notifications.genericError')}</p>
          <button
            type="button"
            onClick={() => void notifications.refetch()}
            className="mt-2 min-h-11 font-semibold text-primary"
          >
            {t('nav.shell.retry')}
          </button>
        </div>
      )}
      {notifications.isPending ? (
        <div
          aria-label={t('notifications.unreadCountUnavailable')}
          className="animate-pulse space-y-2"
        >
          {[0, 1, 2].map((index) => (
            <div key={index} className="h-28 rounded-2xl bg-card shadow-sm" />
          ))}
        </div>
      ) : visible.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <NotificationsPanel
            notifications={visible}
            onMarkRead={(id) => void read([id])}
            onOpen={open}
            pending={markRead.isPending}
            babies={babies.data}
            compact={false}
          />
        </div>
      ) : (
        !notifications.isError && (
          <EmptyState
            icon={<BellIcon className="size-10" />}
            title={t(unreadOnly ? 'notifications.allRead' : 'notifications.emptyState.title')}
            description={t(
              unreadOnly
                ? 'notifications.allReadDescription'
                : 'notifications.emptyState.description',
            )}
            tone="rose"
          />
        )
      )}
    </div>
  )
}
