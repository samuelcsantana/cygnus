import { useTranslation } from 'react-i18next'

import { ageInMonths } from '@/lib/date'
import { cn } from '@/lib/utils'
import { PencilIcon } from '@/shared/icons/pencil-icon'

import type { Baby } from '../api/babies.schemas'

interface BabyCardProps {
  baby: Baby
  selected?: boolean
  onSelect?: () => void
  onEdit?: () => void
}

export function BabyCard({ baby, selected, onSelect, onEdit }: BabyCardProps) {
  const { t } = useTranslation()
  const avatarUrl = baby.avatarUrl ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(baby.name)}`
  const months = ageInMonths(baby.birthDate)

  const content = (
    <>
      <img src={avatarUrl} alt="" className="mr-3 h-12 w-12 rounded-full bg-slate-50" />
      <div className="text-left">
        <p className="leading-tight font-bold text-slate-900">{baby.name}</p>
        <p className="text-xs font-medium text-slate-500">{t('babies.monthsOld', { count: months })}</p>
      </div>
    </>
  )

  const editButton = onEdit && (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation()
        onEdit()
      }}
      aria-label={t('babies.edit.action', { name: baby.name })}
      className="absolute top-2 right-2 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
    >
      <PencilIcon className="h-4 w-4" />
    </button>
  )

  if (!onSelect) {
    return (
      <div className="relative flex items-center rounded-2xl border border-slate-200 bg-white p-3 pr-5 shadow-sm">
        {content}
        {editButton}
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className={cn(
          'flex items-center rounded-2xl border bg-white p-3 pr-10 shadow-sm transition-all',
          selected ? 'border-primary ring-primary/20 ring-2' : 'border-slate-200 hover:border-slate-300',
        )}
      >
        {content}
      </button>
      {editButton}
    </div>
  )
}
