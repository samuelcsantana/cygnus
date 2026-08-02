import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { VaccineAgeGroup, VaccineItem } from '../api/vaccines.schemas'
import { ApplyVaccineDialog } from './ApplyVaccineDialog'
import { VaccineStatusBadge } from './VaccineStatusBadge'

interface VaccineCalendarListProps {
  groups: VaccineAgeGroup[]
  babyId: string
}

export function VaccineCalendarList({ groups, babyId }: VaccineCalendarListProps) {
  const { t } = useTranslation()
  const [applyTarget, setApplyTarget] = useState<VaccineItem | null>(null)

  return (
    <div className="space-y-8">
      {groups
        .filter((group) => group.items.length > 0)
        .map((group) => (
          <section key={group.ageInMonths}>
            <h3 className="mb-3 text-sm font-bold tracking-wider text-ink-muted uppercase">
              {t('vaccines.ageGroupLabel', { count: group.ageInMonths })}
            </h3>
            <div className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-sm">
              <ul className="divide-y divide-slate-100">
                {group.items.map((item) => (
                  <li key={item.vaccineId}>
                    <VaccineRow item={item} onApply={() => setApplyTarget(item)} />
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ))}

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
      <div className="sm:flex-1">
        <p className="text-base font-bold text-ink">{item.name}</p>
        <p className="text-sm font-medium text-ink-muted">{t('vaccines.doseLabel', { count: item.doseNumber })}</p>
      </div>
      <div className="sm:flex-1">
        <p className="text-sm font-medium text-ink-muted">{item.description}</p>
      </div>
      <VaccineStatusBadge item={item} />
    </>
  )

  if (item.status === 'APPLIED') {
    return <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:gap-4 sm:p-6">{content}</div>
  }

  return (
    <button
      type="button"
      onClick={onApply}
      className="flex w-full flex-col gap-3 p-5 text-left transition-colors hover:bg-slate-50/50 sm:flex-row sm:items-center sm:gap-4 sm:p-6"
    >
      {content}
    </button>
  )
}
