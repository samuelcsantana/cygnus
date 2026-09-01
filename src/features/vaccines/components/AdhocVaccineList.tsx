import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import type { Baby } from '@/features/babies/api/babies.schemas'
import { cn } from '@/lib/utils'
import { TrashIcon } from '@/shared/icons/trash-icon'
import { babyAvatarAppearance, babyInitials } from '@/shared/utils/babyAvatarColor'

import { useAllBabiesAdhocVaccines, useDeleteAdhocVaccine } from '../api/vaccines.hooks'
import type { AdhocVaccineRecord } from '../api/vaccines.schemas'

interface AdhocVaccineListProps {
  babies: Baby[]
}

// Household-wide list of campaign/custom vaccine records, each tagged with
// which child it belongs to. All records here are adhoc (not derived from
// the national schedule catalog), so — unlike catalog-derived VaccineCalendarList
// rows — every one of them is eligible for deletion/correction.
export function AdhocVaccineList({ babies }: AdhocVaccineListProps) {
  const { t } = useTranslation()
  const { items } = useAllBabiesAdhocVaccines()
  const babyById = new Map(babies.map((baby) => [baby.id, baby]))

  if (items.length === 0) {
    return null
  }

  return (
    <div className="mt-5 rounded-2xl bg-card p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] sm:p-6">
      <div className="mb-4">
        <h3 className="font-display text-base font-extrabold text-ink">{t('vaccines.adhoc.sectionTitle')}</h3>
        <p className="mt-0.5 text-sm text-ink-muted">{t('vaccines.adhoc.sectionDescription')}</p>
      </div>

      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <AdhocVaccineRow key={item.id} item={item} baby={babyById.get(item.babyId)} />
        ))}
      </ul>
    </div>
  )
}

interface AdhocVaccineRowProps {
  item: AdhocVaccineRecord
  baby: Baby | undefined
}

function AdhocVaccineRow({ item, baby }: AdhocVaccineRowProps) {
  const { t } = useTranslation()
  const deleteAdhocVaccine = useDeleteAdhocVaccine(item.babyId)
  const avatarAppearance = baby ? babyAvatarAppearance(baby.id, baby.avatarColor) : null

  // Radix's AlertDialogAction always closes the alert dialog immediately on
  // click, before this async handler settles — so a failure can't be shown
  // inline inside the (already-unmounted) AlertDialogContent; a toast is the
  // only reliable way to surface it.
  const handleDelete = async () => {
    try {
      await deleteAdhocVaccine.mutateAsync(item.id)
      toast.success(t('vaccines.adhoc.delete.successToast'))
    } catch {
      toast.error(t('vaccines.adhoc.delete.genericError'))
    }
  }

  return (
    <li className="flex items-center gap-3 rounded-2xl border border-transparent bg-card p-4 shadow-[0_1px_6px_rgba(0,0,0,0.03)]">
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
        <p className="text-sm font-bold text-ink">{item.customName}</p>
        <p className="text-xs text-ink-muted">
          {baby?.name} · {item.customDose ? `${item.customDose} · ` : ''}
          {item.applicationDate}
        </p>
      </div>
      <span
        className={cn(
          'flex-shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold',
          item.source === 'CAMPAIGN' ? 'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-300' : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300',
        )}
      >
        {item.source === 'CAMPAIGN' ? t('vaccines.adhoc.sourceLabel.campaign') : t('vaccines.adhoc.sourceLabel.custom')}
      </span>

      <AlertDialog>
        {/* `asChild` on the <button>, not on a wrapping <span>. Radix puts
            `aria-haspopup="dialog"` and `aria-expanded` on whatever element it
            is given, and a bare <span> has no role that may carry either — axe
            reports `aria-allowed-attr`, one node per row.

            This is the second time the same shape has cost a fix here: PR #29
            paid it with `aria-expanded` on a <span> used as an AlertDialogTrigger.
            The rule that survives: **the trigger goes on the interactive
            element**, and layout classes move onto it rather than earning a
            wrapper.

            It stayed invisible until 01/09/2026 only because the seed created
            no ad-hoc vaccine, so this list never rendered a row and the trigger
            never existed for axe to scan. */}
        <AlertDialogTrigger asChild>
          <button
            type="button"
            aria-label={t('vaccines.adhoc.delete.action', { name: item.customName })}
            className="text-destructive relative inline-flex flex-shrink-0 rounded-lg p-1.5 opacity-60 transition-opacity hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:opacity-100 focus-visible:opacity-100"
          >
            <span className="absolute -inset-2.5" aria-hidden="true" />
            <TrashIcon className="h-3.5 w-3.5" />
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('vaccines.adhoc.delete.confirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('vaccines.adhoc.delete.confirmDescription', { name: item.customName })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('vaccines.adhoc.delete.confirmDismiss')}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete} disabled={deleteAdhocVaccine.isPending}>
              {t('vaccines.adhoc.delete.confirmAction')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  )
}
