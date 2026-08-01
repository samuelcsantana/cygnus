import { httpClient } from '@/lib/http-client'

import { notificationListSchema, notificationSchema, type Notification } from './notifications.schemas'

export async function fetchNotifications(): Promise<Notification[]> {
  const response = await httpClient.get<unknown>('/notifications')
  return notificationListSchema.parse(response)
}

export async function markNotificationRead(notificationId: string): Promise<Notification> {
  const response = await httpClient.patch<unknown>(`/notifications/${notificationId}/read`)
  return notificationSchema.parse(response)
}
