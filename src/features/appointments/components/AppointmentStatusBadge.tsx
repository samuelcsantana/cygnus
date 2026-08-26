import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/ui/badge'

import type { AppointmentStatus } from '../api/appointments.schemas'

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  const { t } = useTranslation()

  if (status === 'COMPLETED') {
    return (
      <Badge variant="outline" className="border-emerald-100 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
        {t('appointments.status.completed')}
      </Badge>
    )
  }

  if (status === 'CANCELLED') {
    return (
      <Badge variant="outline" className="border-border bg-muted text-ink-muted">
        {t('appointments.status.cancelled')}
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="border-violet-100 bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300">
      {t('appointments.status.scheduled')}
    </Badge>
  )
}
