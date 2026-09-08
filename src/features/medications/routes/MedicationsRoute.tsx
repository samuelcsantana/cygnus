import { useSearchDestination } from '@/shared/stores/searchDestination.store'
import { useQueryClient } from '@tanstack/react-query'
import { useLocalToday } from '@/hooks/useLocalToday'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { SearchInput } from '@/shared/components/SearchInput'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import type { Baby } from '@/features/babies/api/babies.schemas'
import { todayDateString } from '@/lib/date'
import { EmptyState } from '@/shared/components/EmptyState'
import { useSelectedBabyStore } from '@/shared/stores/selectedBaby.store'
import { HeartIcon } from '@/shared/icons/heart-icon'

import { useAllBabiesMedications, useEndMedication } from '../api/medications.hooks'
import {
  isOngoing,
  medicationStatus,
  sortMedications,
  type Medication,
} from '../api/medications.schemas'
import { AddMedicationDialog } from '../components/AddMedicationDialog'
import { EditMedicationDialog } from '../components/EditMedicationDialog'
import { MedicationCard } from '../components/MedicationCard'
import { MedicationRecordNotice } from '../components/MedicationRecordNotice'

export function MedicationsRoute() {
  const { t } = useTranslation()
  const all = useAllBabiesMedications()
  const client = useQueryClient()
  const today = useLocalToday()
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'PLANNED' | 'ENDED'>('ALL')
  const [search, setSearch] = useState('')
  const debounced = useDebouncedValue(search)
  const normalize = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase()
  const term = normalize(debounced)
  // The child filter is the menu's, not this page's: the choice outlives the page
  // it was made on. See selectedBaby.store.ts.
  const babyFilter = useSelectedBabyStore((state) => state.selectedBabyId)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Medication | null>(null)

  const babies = all.babies.filter((baby) => !babyFilter || baby.id === babyFilter)
  const entries = all.perBaby.filter((entry) => !babyFilter || entry.baby.id === babyFilter)
  const isPending = all.babies.length ? entries.some((entry) => entry.isPending) : all.isPending
  const isError = all.babies.length ? entries.some((entry) => entry.isError) : all.isError
  const isEmpty = all.isEmpty
  const destination = useSearchDestination('/medications')
  const items = entries
    .filter((entry) => !entry.isError)
    .flatMap((entry) => entry.items)
    .filter((item) => !destination || destination.keys.includes(`medication:${item.id}`))
  const matches = (item: Medication, value: typeof filter) =>
    value === 'ALL' ||
    (value === 'ACTIVE' ? isOngoing(item, today) : medicationStatus(item, today) === value)
  const orderedItems = sortMedications(
    items.filter(
      (item) =>
        matches(item, filter) &&
        (!term ||
          [item.name, item.reason, item.prescriberName].some(
            (value) => value && normalize(value).includes(term),
          )),
    ),
    today,
  )
  const retry = () => {
    if (!all.babies.length) void client.invalidateQueries({ queryKey: ['babies'] })
    entries
      .filter((entry) => entry.isError)
      .forEach(
        (entry) =>
          void client.invalidateQueries({ queryKey: ['babies', entry.baby.id, 'medications'] }),
      )
  }

  if (isEmpty) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="animate-fade-in-up">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-ink">
            {t('medications.title')}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">{t('medications.page.intro')}</p>
        </div>
        <Button
          type="button"
          size="cta"
          onClick={() => setIsAddOpen(true)}
          className="rounded-2xl shadow-lg shadow-emerald-900/20 active:scale-[0.98]"
        >
          {t('medications.action')}
        </Button>
      </div>

      {/* No topo da tela, antes de qualquer dose aparecer. */}
      <MedicationRecordNotice className="mb-6" />

      <AddMedicationDialog open={isAddOpen} onOpenChange={setIsAddOpen} />
      <EditMedicationDialog medication={editTarget} onOpenChange={() => setEditTarget(null)} />

      {isError && (
        <div role="alert" className="mb-5 rounded-2xl bg-card p-5">
          <p>
            {t('medications.genericError')}{' '}
            {entries
              .filter((entry) => entry.isError)
              .map((entry) => entry.baby.name)
              .join(', ')}
          </p>
          <button type="button" onClick={retry} className="min-h-11 font-semibold text-primary">
            {t('nav.shell.retry')}
          </button>
        </div>
      )}
      {isPending && (
        <p role="status" className="py-8 text-center text-ink-muted">
          {t('common.loading')}
        </p>
      )}
      {items.length > 0 && (
        <div className="mb-5 space-y-4">
          <div
            role="group"
            aria-label={t('medications.page.filters')}
            className="flex flex-wrap gap-2"
          >
            {(['ALL', 'ACTIVE', 'PLANNED', 'ENDED'] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
                className={`min-h-11 rounded-xl px-4 py-2 text-sm font-semibold ${filter === value ? 'bg-sky-700 text-white' : 'bg-card text-ink-muted'}`}
              >
                {t(`medications.page.${value}`)} (
                {items.filter((item) => matches(item, value)).length})
              </button>
            ))}
          </div>
          <SearchInput
            id="medication-search"
            label={t('medications.page.search')}
            placeholder={t('medications.page.search')}
            value={search}
            onChange={setSearch}
            clearLabel={t('vaccines.searchUi.clear')}
            inputClassName="h-12 rounded-xl"
            className="w-full sm:max-w-lg"
          />
        </div>
      )}
      {!isPending && !isError && !items.length && (
        <EmptyState
          icon={<HeartIcon className="h-10 w-10" />}
          title={t('medications.empty.title')}
          description={t('medications.empty.description')}
          tone="rose"
          action={
            <Button
              type="button"
              size="cta"
              onClick={() => setIsAddOpen(true)}
              className="rounded-xl shadow-md shadow-emerald-900/20"
            >
              {t('medications.empty.cta')}
            </Button>
          }
        />
      )}
      {items.length > 0 && !orderedItems.length && (
        <p role="status" className="rounded-2xl bg-card p-8 text-center text-ink-muted">
          {t('medications.page.noResults')}
        </p>
      )}
      {orderedItems.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {orderedItems.map((medication) => (
            <MedicationRow
              key={medication.id}
              medication={medication}
              babies={babies}
              onEdit={setEditTarget}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface MedicationRowProps {
  medication: Medication
  babies: Baby[]
  onEdit: (medication: Medication) => void
}

/**
 * O hook de encerrar precisa do `babyId` do registro, e um hook não pode ser chamado dentro de um
 * `map`. Daí a linha ser um componente: cada uma monta o seu, com a criança certa.
 */
function MedicationRow({ medication, babies, onEdit }: MedicationRowProps) {
  const { t } = useTranslation()
  const endMedication = useEndMedication(medication.babyId)
  const baby =
    babies.length > 1 ? babies.find((candidate) => candidate.id === medication.babyId) : undefined
  const [confirm, setConfirm] = useState(false)

  return (
    <>
      <MedicationCard
        medication={medication}
        baby={baby}
        busy={endMedication.isPending}
        onEdit={() => onEdit(medication)}
        onEnd={() => setConfirm(true)}
      />
      <AlertDialog
        open={confirm}
        onOpenChange={(open) => {
          if (!endMedication.isPending) setConfirm(open)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('medications.page.endTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('medications.page.endHint', { name: medication.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={endMedication.isPending}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={endMedication.isPending}
              onClick={async (event) => {
                event.preventDefault()
                const today = todayDateString()
                if (endMedication.isPending || !isOngoing(medication, today)) return
                try {
                  await endMedication.mutateAsync({ medicationId: medication.id, endedOn: today })
                  setConfirm(false)
                  toast.success(t('medications.page.endSaved'))
                } catch {
                  toast.error(t('medications.form.genericError'))
                }
              }}
            >
              {t('medications.page.endConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
