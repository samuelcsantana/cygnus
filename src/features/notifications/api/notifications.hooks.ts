import { ApiError } from '@/lib/http-client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { fetchNotifications, markNotificationRead } from './notifications.api'
import type { Notification } from './notifications.schemas'

export const notificationsQueryKey = ['notifications'] as const

// No websocket/push channel in the contract — poll instead.
export function useNotifications() {
  return useQuery({
    queryKey: notificationsQueryKey,
    queryFn: fetchNotifications,
    refetchInterval: 60_000,
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: (updated) => {
      queryClient.setQueryData<Notification[]>(notificationsQueryKey, (prev) =>
        prev?.map((notification) => (notification.id === updated.id ? updated : notification)),
      )
    },
  })
}

/** Serialize bulk updates to avoid a request burst against the API rate limit. */
export function useMarkNotificationsRead() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (ids: string[]) => {
      let failed = 0
      const uniqueIds = [...new Set(ids)]
      for (const [index, id] of uniqueIds.entries()) {
        try {
          const updated = await markNotificationRead(id)
          await client.cancelQueries({ queryKey: notificationsQueryKey })
          client.setQueryData<Notification[]>(notificationsQueryKey, (previous) =>
            previous?.map((item) => (item.id === updated.id ? updated : item)),
          )
        } catch (error) {
          if (error instanceof ApiError && error.status === 401) throw error
          if (error instanceof ApiError && error.status === 429) {
            failed += uniqueIds.length - index
            break
          }
          failed += 1
        }
      }
      return { failed }
    },
    onSettled: () => {
      void client.invalidateQueries({ queryKey: notificationsQueryKey })
    },
  })
}
