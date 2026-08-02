import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

import type { VaccineItem } from '../api/vaccines.schemas'
import { ApplyVaccineDialog } from './ApplyVaccineDialog'
import { VaccineStatusBadge } from './VaccineStatusBadge'

interface VaccineCalendarListProps {
  items: VaccineItem[]
  babyId: string
}

const STATUS_ICON_CLASS: Record<VaccineItem['status'], string> = {
  APPLIED: 'bg-teal-50 text-teal-600',
  DELAYED: 'bg-rose-50 text-rose-500',
  PENDING: 'bg-amber-50 text-amber-500',
}

const STATUS_ICON_GLYPH: Record<VaccineItem['status'], string> = {
  APPLIED: '✓',
  DELAYED: '!',
  PENDING: '○',
}

export function VaccineCalendarList({ items, babyId }: VaccineCalendarListProps) {
  const [applyTarget, setApplyTarget] = useState<VaccineItem | null>(null)

  return (
    <div>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.vaccineId}>
            <VaccineRow item={item} onApply={() => setApplyTarget(item)} />
          </li>
        ))}
      </ul>

      <ApplyVaccineDialog babyId={babyId} item={applyTarget} onOpenChange={(open) => !open && setApplyTarget(null)} />
    </div>
  )
}

interface VaccineRowProps {
  item: VaccineItem
  onApply: () => void
}

function VaccineRow({ item, onApply }: VaccineRowProps) {
  const { t } = useTranslation()

  const content = (
    <>
      <span
        className={cn(
          'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] text-sm font-extrabold',
          STATUS_ICON_CLASS[item.status],
        )}
      >
        {STATUS_ICON_GLYPH[item.status]}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-ink">{item.name}</p>
        <p className="text-xs text-ink-muted">
          {t('vaccines.doseLabel', { count: item.doseNumber })} ·{' '}
          {t('vaccines.ageGroupLabel', { count: item.recommendedAgeInMonths })}
        </p>
      </div>
      <div className="hidden flex-1 sm:block">
        <p className="text-xs text-ink-muted">{item.description}</p>
      </div>
      <VaccineStatusBadge item={item} />
    </>
  )

  const rowClass = cn(
    'flex w-full items-center gap-3.5 rounded-2xl bg-white p-4 shadow-[0_1px_6px_rgba(0,0,0,0.03)]',
    item.status === 'DELAYED' ? 'border border-amber-100' : 'border border-transparent',
  )

  if (item.status === 'APPLIED') {
    return <div className={rowClass}>{content}</div>
  }

  return (
    <button type="button" onClick={onApply} className={cn(rowClass, 'text-left transition-colors hover:bg-slate-50/50')}>
      {content}
    </button>
  )
}
