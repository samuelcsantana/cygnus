import { useTranslation } from 'react-i18next'

import { ageInMonths } from '@/lib/date'
import { cn } from '@/lib/utils'

import type { Baby } from '../api/babies.schemas'

interface BabyCardProps {
  baby: Baby
  selected?: boolean
  onSelect?: () => void
}

export function BabyCard({ baby, selected, onSelect }: BabyCardProps) {
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

  if (!onSelect) {
    return (
      <div className="flex items-center rounded-2xl border border-slate-200 bg-white p-3 pr-5 shadow-sm">{content}</div>
    )
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'flex items-center rounded-2xl border bg-white p-3 pr-5 shadow-sm transition-all',
        selected ? 'border-primary ring-primary/20 ring-2' : 'border-slate-200 hover:border-slate-300',
      )}
    >
      {content}
    </button>
  )
}
