import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { Baby } from '@/features/babies/api/babies.schemas'
import { cn } from '@/lib/utils'
import { BabyFilterChips } from '@/shared/components/BabyFilterChips'
import { babyAvatarAppearance, babyInitials } from '@/shared/utils/babyAvatarColor'

import type { VaccineItemWithBaby } from '../api/vaccines.hooks'
import { ApplyVaccineDialog } from './ApplyVaccineDialog'
import { VaccineStatusBadge } from './VaccineStatusBadge'

interface VaccineCalendarListProps {
  items: VaccineItemWithBaby[]
  babies: Baby[]
}

const STATUS_ICON_CLASS: Record<VaccineItemWithBaby['status'], string> = {
  APPLIED: 'bg-teal-50 text-teal-600',
  DELAYED: 'bg-rose-50 text-rose-500',
  PENDING: 'bg-amber-50 text-amber-500',
}

const STATUS_ICON_GLYPH: Record<VaccineItemWithBaby['status'], string> = {
  APPLIED: '✓',
  DELAYED: '!',
  PENDING: '○',
}

// Renders a single, merged, household-wide list — each row tagged with which
// baby it belongs to, so a family with several children sees one urgency-sorted
// list instead of one full section repeated per child.
export function VaccineCalendarList({ items, babies }: VaccineCalendarListProps) {
  const [applyTarget, setApplyTarget] = useState<VaccineItemWithBaby | null>(null)
  const [babyFilter, setBabyFilter] = useState<string | null>(null)
  const babyById = new Map(babies.map((baby) => [baby.id, baby]))

  const filteredItems = babyFilter ? items.filter((item) => item.babyId === babyFilter) : items

  return (
    <div>
      <BabyFilterChips babies={babies} value={babyFilter} onChange={setBabyFilter} className="mb-4" />

      <ul className="flex flex-col gap-2">
        {filteredItems.map((item) => (
          <li key={`${item.babyId}-${item.vaccineId}`}>
            <VaccineRow item={item} baby={babyById.get(item.babyId)} onApply={() => setApplyTarget(item)} />
          </li>
        ))}
      </ul>

      <ApplyVaccineDialog
        babyId={applyTarget?.babyId ?? ''}
        item={applyTarget}
        onOpenChange={(open) => !open && setApplyTarget(null)}
      />
    </div>
  )
}

interface VaccineRowProps {
  item: VaccineItemWithBaby
  baby: Baby | undefined
  onApply: () => void
}

function VaccineRow({ item, baby, onApply }: VaccineRowProps) {
  const { t } = useTranslation()
  const avatarAppearance = baby ? babyAvatarAppearance(baby.id, baby.avatarColor) : null

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
      {baby && (
        <span
          title={baby.name}
          className={cn(
            'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-black',
            avatarAppearance?.className,
          )}
          style={avatarAppearance?.style}
        >
          {babyInitials(baby.name)}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-ink">{item.name}</p>
        <p className="text-xs text-ink-muted">
          {baby?.name} · {t('vaccines.doseLabel', { count: item.doseNumber })} ·{' '}
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
    'flex w-full items-center gap-3 rounded-2xl bg-white p-4 shadow-[0_1px_6px_rgba(0,0,0,0.03)]',
    item.status === 'DELAYED' ? 'border border-rose-100' : 'border border-transparent',
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
