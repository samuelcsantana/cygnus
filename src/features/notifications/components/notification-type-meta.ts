import type { NotificationType } from '../api/notifications.schemas'

interface NotificationTypeMeta {
  emoji: string
  iconClassName: string
}

/**
 * Display-only mapping — the API has no icon/color field, only `type`.
 * Colors follow DESIGN.md: vaccine reminders are rose, appointment
 * reminders are violet (matching the accent used for each feature
 * elsewhere in the app).
 */
export const NOTIFICATION_TYPE_META: Record<NotificationType, NotificationTypeMeta> = {
  VACCINE_DELAYED: {
    emoji: '💉',
    iconClassName: 'bg-rose-50 text-rose-700',
  },
  APPOINTMENT_UPCOMING: {
    emoji: '🩺',
    iconClassName: 'bg-violet-50 text-violet-700',
  },
}
