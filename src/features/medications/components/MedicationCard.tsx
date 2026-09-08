import { useTranslation } from 'react-i18next'
import type { Baby } from '@/features/babies/api/babies.schemas'
import { formatDateDisplay } from '@/lib/date'
import { useLocalToday } from '@/hooks/useLocalToday'
import { medicationStatus, type Medication } from '../api/medications.schemas'
interface Props {
  medication: Medication
  baby?: Baby
  onEnd: () => void
  onEdit: () => void
  busy?: boolean
}
export function MedicationCard({ medication, baby, onEnd, onEdit, busy }: Props) {
  const { t, i18n } = useTranslation()
  const today = useLocalToday()
  const status = medicationStatus(medication, today)
  const fields = [
    ['dosage', medication.dosage],
    ['frequency', medication.frequency],
    ['start', formatDateDisplay(medication.startedOn, i18n.language)],
    [
      'end',
      medication.endedOn
        ? formatDateDisplay(medication.endedOn, i18n.language)
        : t('medications.period.OPEN'),
    ],
    ['prescriber', medication.prescriberName],
    ['reason', medication.reason],
  ]
  return (
    <article className="flex min-w-0 flex-col rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-words text-lg font-bold text-ink">{medication.name}</h3>
          {baby && <p className="mt-1 text-sm text-ink-muted">{baby.name}</p>}
        </div>
        <span
          className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${status === 'ENDED' ? 'bg-muted text-ink-muted' : status === 'ENDING_TODAY' ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200' : 'bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-200'}`}
        >
          {t(`medications.period.${status}`)}
        </span>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-4">
        {fields
          .filter(([, value]) => value)
          .map(([key, value]) => (
            <div key={key} className="min-w-0">
              <dt className="text-xs font-semibold text-ink-muted">
                {t(`medications.page.${key}`)}
              </dt>
              <dd className="mt-1 break-words text-sm text-ink">{value}</dd>
            </div>
          ))}
      </dl>
      {medication.notes && (
        <details className="mt-4 rounded-xl bg-muted/40 px-3">
          <summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold text-ink-muted">
            {t('medications.page.notes')}
          </summary>
          <p className="whitespace-pre-wrap break-words pb-3 text-sm text-ink-muted">
            {medication.notes}
          </p>
        </details>
      )}
      <div className="mt-auto flex flex-wrap justify-end gap-2 pt-5">
        <button
          type="button"
          disabled={busy}
          onClick={onEdit}
          className="min-h-11 rounded-xl bg-sky-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {t('medications.editAction')}
        </button>
        {(status === 'OPEN' || status === 'ACTIVE') && (
          <button
            type="button"
            disabled={busy}
            onClick={onEnd}
            className="min-h-11 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-ink-muted disabled:opacity-50"
          >
            {t('medications.page.endAction')}
          </button>
        )}
      </div>
    </article>
  )
}
