import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/ui/badge'

import type { AppointmentStatus } from '../api/appointments.schemas'

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  const { t } = useTranslation()

  if (status === 'COMPLETED') {
    return (
      <Badge variant="outline" className="border-green-100 bg-green-50 text-green-700">
        {t('appointments.status.completed')}
      </Badge>
    )
  }

  if (status === 'CANCELLED') {
    return (
      <Badge variant="outline" className="border-slate-200 bg-slate-100 text-slate-600">
        {t('appointments.status.cancelled')}
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="border-indigo-100 bg-indigo-50 text-indigo-700">
      {t('appointments.status.scheduled')}
    </Badge>
  )
}
