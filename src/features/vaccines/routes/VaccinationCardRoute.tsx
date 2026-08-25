import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'

import { useBabies } from '@/features/babies/api/babies.hooks'
import { formatDateDisplay } from '@/lib/date'
import { cn } from '@/lib/utils'
import { ArrowLeftIcon } from '@/shared/icons/arrow-left-icon'
import { LogoIcon } from '@/shared/icons/logo-icon'
import { PrinterIcon } from '@/shared/icons/printer-icon'

import { useAdhocVaccines, useVaccineCalendar } from '../api/vaccines.hooks'
import type { VaccineStatus } from '../api/vaccines.schemas'
import { VaccineCatalogNotice } from '../components/VaccineCatalogNotice'

interface CardRow {
  key: string
  date: string | null
  name: string
  dose: string
  status: VaccineStatus
}

const STATUS_BADGE_CLASS: Record<VaccineStatus, string> = {
  APPLIED: 'bg-teal-50 text-teal-700',
  DELAYED: 'bg-rose-50 text-rose-600',
  PENDING: 'bg-amber-50 text-amber-700',
  GUIDANCE: 'bg-sky-50 text-sky-700',
}

/**
 * A dedicated, print-friendly page — not a modal/section of VaccinesRoute —
 * so `window.print()` can render just this content: the app chrome
 * (nav/header) is hidden globally in print via `print:hidden` on
 * AppShellLayout, and this card's own container strips its screen-only
 * decoration (shadow/rounded corners) under the `print:` variant too.
 */
export function VaccinationCardRoute() {
  const { t, i18n } = useTranslation()
  const { babyId = '' } = useParams<{ babyId: string }>()
  const babies = useBabies()
  const baby = babies.data?.find((item) => item.id === babyId)
  const calendar = useVaccineCalendar(babyId)
  const adhoc = useAdhocVaccines(babyId)

  const catalogRows: CardRow[] = (calendar.data?.groups ?? []).flatMap((group) =>
    group.items.map((item) => ({
      key: `catalog-${item.vaccineId}`,
      date: item.applicationDate,
      name: item.name,
      dose: t('vaccines.doseLabel', { count: item.doseNumber }),
      status: item.status,
    })),
  )

  const adhocRows: CardRow[] = (adhoc.data ?? []).map((record) => ({
    key: `adhoc-${record.id}`,
    date: record.applicationDate,
    name: record.customName,
    dose: record.customDose || '—',
    status: 'APPLIED',
  }))

  // Dated entries first (chronological), undated (still-pending catalog
  // doses) last, alphabetically among themselves.
  const rows = [...catalogRows, ...adhocRows].sort((a, b) => {
    if (a.date && b.date) return a.date.localeCompare(b.date)
    if (a.date) return -1
    if (b.date) return 1
    return a.name.localeCompare(b.name)
  })

  const isPending = babies.isPending || calendar.isPending || adhoc.isPending
  const isError = calendar.isError || adhoc.isError

  return (
    <div className="mx-auto max-w-3xl">
      <div className="print:hidden mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link
          to="/vaccines"
          className="text-ink-muted hover:text-ink inline-flex items-center gap-2 text-sm font-semibold"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          {t('common.back')}
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-teal-900/20 transition-colors hover:bg-teal-700"
        >
          <PrinterIcon className="h-4 w-4" />
          {t('vaccines.card.printAction')}
        </button>
      </div>

      <div className="print:rounded-none print:border-0 print:p-0 print:shadow-none rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex items-center gap-3 border-b border-border pb-6">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-teal-500 text-white">
            <LogoIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-xl font-extrabold text-ink">{t('vaccines.card.title')}</h1>
            {baby && (
              <p className="truncate text-sm text-ink-muted">
                {baby.name} · {t('vaccines.card.birthDateLabel')} {formatDateDisplay(baby.birthDate, i18n.language)}
              </p>
            )}
          </div>
        </div>

        {isPending ? (
          <p className="py-10 text-center text-ink-muted">{t('common.loading')}</p>
        ) : isError ? (
          <p role="alert" className="text-destructive py-10 text-center">
            {t('vaccines.card.loadError')}
          </p>
        ) : rows.length === 0 ? (
          <p className="py-10 text-center text-ink-muted">{t('vaccines.card.empty')}</p>
        ) : (
          <div className="divide-y divide-border">
            <div className="text-ink-faint hidden gap-x-4 pb-2 text-xs font-bold tracking-wide uppercase sm:flex">
              <span className="w-28 flex-shrink-0">{t('vaccines.card.columnDate')}</span>
              <span className="min-w-[10rem] flex-1">{t('vaccines.card.columnVaccine')}</span>
              <span className="w-32 flex-shrink-0">{t('vaccines.card.columnDose')}</span>
              <span className="w-28 flex-shrink-0">{t('vaccines.card.columnStatus')}</span>
            </div>
            {rows.map((row) => (
              <div key={row.key} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 text-sm">
                <span className="text-ink-muted w-28 flex-shrink-0">
                  {row.date ? formatDateDisplay(row.date, i18n.language) : '—'}
                </span>
                <span className="min-w-[10rem] flex-1 font-semibold text-ink">{row.name}</span>
                <span className="text-ink-muted w-32 flex-shrink-0">{row.dose}</span>
                <span
                  className={cn(
                    'w-fit flex-shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold sm:w-28',
                    STATUS_BADGE_CLASS[row.status],
                  )}
                >
                  {row.status === 'APPLIED'
                    ? t('vaccines.status.applied', { date: row.date ? formatDateDisplay(row.date, i18n.language) : '' })
                    : row.status === 'DELAYED'
                      ? t('vaccines.status.delayed')
                      : row.status === 'GUIDANCE'
                        ? t('vaccines.status.guidance')
                        : t('vaccines.status.pending')}
                </span>
              </div>
            ))}
          </div>
        )}

        {calendar.data?.metadata && (
          <VaccineCatalogNotice metadata={calendar.data.metadata} className="mt-6 print:border-border print:bg-card" />
        )}
      </div>
    </div>
  )
}
