import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/ui/badge'

import type { AppointmentStatus } from '../api/appointments.schemas'

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  const { t } = useTranslation()

  if (status === 'COMPLETED') {
    return (
      <Badge variant="outline" className="border-teal-100 bg-teal-50 text-teal-700">
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
    <Badge variant="outline" className="border-violet-100 bg-violet-50 text-violet-700">
      {t('appointments.status.scheduled')}
    </Badge>
  )
}
