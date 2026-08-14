import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/ui/badge'
import { formatDateDisplay } from '@/lib/date'

import type { VaccineItem } from '../api/vaccines.schemas'

export function VaccineStatusBadge({ item }: { item: VaccineItem }) {
  const { t, i18n } = useTranslation()

  if (item.status === 'APPLIED') {
    return (
      <Badge variant="outline" className="border-teal-100 bg-teal-50 text-teal-700">
        {t('vaccines.status.applied', {
          date: item.applicationDate ? formatDateDisplay(item.applicationDate, i18n.language) : '',
        })}
      </Badge>
    )
  }

  if (item.status === 'DELAYED') {
    return (
      <Badge variant="outline" className="border-rose-100 bg-rose-50 text-rose-700">
        {t('vaccines.status.delayed')}
      </Badge>
    )
  }

  if (item.status === 'GUIDANCE') {
    return (
      <Badge variant="outline" className="border-sky-100 bg-sky-50 text-sky-700">
        {t('vaccines.status.guidance')}
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="border-amber-100 bg-amber-50 text-amber-700">
      {t('vaccines.status.pending')}
    </Badge>
  )
}
