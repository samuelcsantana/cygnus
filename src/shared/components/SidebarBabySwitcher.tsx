import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useBabies } from '@/features/babies/api/babies.hooks'
import { EditBabyDialog } from '@/features/babies/components/EditBabyDialog'
import type { Baby } from '@/features/babies/api/babies.schemas'
import { ageInMonths } from '@/lib/date'
import { cn } from '@/lib/utils'
import { PencilIcon } from '@/shared/icons/pencil-icon'
import { PlusIcon } from '@/shared/icons/plus-icon'
import { useAddBabyDialogStore } from '@/shared/stores/addBabyDialog.store'
import { useSelectedBabyStore } from '@/shared/stores/selectedBaby.store'
import { babyAvatarAppearance, babyInitials } from '@/shared/utils/babyAvatarColor'

export function SidebarBabySwitcher() {
  const { t } = useTranslation()
  const babies = useBabies()
  const selectedBabyId = useSelectedBabyStore((state) => state.selectedBabyId)
  const setSelectedBabyId = useSelectedBabyStore((state) => state.setSelectedBabyId)
  const [editTarget, setEditTarget] = useState<Baby | null>(null)
  const openAddBabyDialog = useAddBabyDialogStore((state) => state.open)

  const babyList = babies.data ?? []

  if (babies.isLoading || babyList.length === 0) {
    return null
  }

  return (
    <div className="border-b border-slate-100 px-4 py-5">
      <p className="mb-3 px-2 text-[10px] font-bold tracking-wider text-ink-muted uppercase">
        {t('babies.yourChildren')}
      </p>
      <div className="flex flex-col gap-1">
        {babyList.map((baby) => (
          <SidebarBabyRow
            key={baby.id}
            baby={baby}
            selected={baby.id === selectedBabyId}
            onSelect={() => setSelectedBabyId(baby.id)}
            onEdit={() => setEditTarget(baby)}
          />
        ))}
        <button
          type="button"
          onClick={openAddBabyDialog}
          className="mt-1 flex items-center gap-2.5 rounded-xl border border-dashed border-teal-200 px-2.5 py-2 text-xs font-semibold text-teal-700 transition-colors hover:bg-teal-50"
        >
          <PlusIcon className="h-4 w-4" />
          {t('babies.addChild')}
        </button>
      </div>

      <EditBabyDialog baby={editTarget} onOpenChange={(open) => !open && setEditTarget(null)} />
    </div>
  )
}

interface SidebarBabyRowProps {
  baby: Baby
  selected: boolean
  onSelect: () => void
  onEdit: () => void
}

function SidebarBabyRow({ baby, selected, onSelect, onEdit }: SidebarBabyRowProps) {
  const { t } = useTranslation()
  const months = ageInMonths(baby.birthDate)
  const avatarAppearance = babyAvatarAppearance(baby.id, baby.avatarColor)

  return (
    <div
      className={cn(
        'group relative flex items-center gap-2.5 rounded-xl px-2.5 py-2 transition-colors',
        selected ? 'bg-teal-50' : 'hover:bg-slate-50',
      )}
    >
      <button type="button" onClick={onSelect} aria-pressed={selected} className="flex flex-1 items-center gap-2.5">
        {baby.avatarUrl ? (
          <img
            src={baby.avatarUrl}
            alt=""
            className={cn('h-8 w-8 flex-shrink-0 rounded-full bg-slate-50 object-cover', baby.avatarColor && 'border-2')}
            style={baby.avatarColor ? { borderColor: baby.avatarColor } : undefined}
          />
        ) : (
          <span
            className={cn(
              'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-extrabold',
              avatarAppearance.className,
            )}
            style={avatarAppearance.style}
          >
            {babyInitials(baby.name)}
          </span>
        )}
        <span className="min-w-0 flex-1 text-left">
          <span className={cn('block truncate text-[13px] font-bold', selected ? 'text-teal-700' : 'text-ink')}>
            {baby.name}
          </span>
          <span className="block text-[11px] text-ink-muted">{t('babies.monthsOld', { count: months })}</span>
        </span>
        {selected && <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-500" />}
      </button>
      <button
        type="button"
        onClick={onEdit}
        aria-label={t('babies.edit.action', { name: baby.name })}
        className="flex-shrink-0 rounded-lg p-1 text-ink-faint opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white hover:text-teal-600"
      >
        <PencilIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
