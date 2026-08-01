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
