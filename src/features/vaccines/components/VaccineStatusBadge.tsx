import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/ui/badge'
import { formatDateDisplay } from '@/lib/date'

import type { VaccineItem } from '../api/vaccines.schemas'

export function VaccineStatusBadge({ item }: { item: VaccineItem }) {
  const { t, i18n } = useTranslation()

  if (item.status === 'APPLIED') {
    return (
      <Badge variant="outline" className="border-green-100 bg-green-50 text-green-700">
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

  return (
    <Badge variant="outline" className="border-amber-100 bg-amber-50 text-amber-700">
      {t('vaccines.status.pending')}
    </Badge>
  )
}
