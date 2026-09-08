import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Printer } from 'lucide-react'
import { useBabies } from '@/features/babies/api/babies.hooks'
import { useAdhocVaccines, useVaccineCalendar } from '../api/vaccines.hooks'
import {
  VaccinationCardDocument,
  type VaccinationCardRow,
} from '../components/VaccinationCardDocument'
import './vaccination-card-print.css'

export function VaccinationCardRoute() {
  const { t } = useTranslation()
  const { babyId = '' } = useParams<{ babyId: string }>()
  useEffect(() => {
    if (window.scrollY) window.scrollTo({ top: 0, behavior: 'instant' })
  }, [babyId])
  const babies = useBabies()
  const baby = babies.data?.find((item) => item.id === babyId)
  const calendar = useVaccineCalendar(baby?.id ?? null)
  const adhoc = useAdhocVaccines(baby?.id ?? null)
  const [includeCalendar, setIncludeCalendar] = useState(false)
  const isPending = babies.isPending || (!!baby && (calendar.isPending || adhoc.isPending))
  const isError = babies.isError || (!!baby && (calendar.isError || adhoc.isError))
  const rows: VaccinationCardRow[] = [
    ...(calendar.data?.groups ?? []).flatMap((group) =>
      group.items.map((item) => ({
        ...item,
        key: `catalog-${item.vaccineId}`,
        date: item.applicationDate,
        dose: t('vaccines.doseLabel', { count: item.doseNumber }),
        source: 'CATALOG' as const,
      })),
    ),
    ...(adhoc.data ?? []).map((item) => ({
      ...item,
      key: `adhoc-${item.id}`,
      date: item.applicationDate,
      name: item.customName,
      dose: item.customDose || '—',
      source: item.source,
    })),
  ]
  const applied = rows
    .filter((row) => row.status === 'APPLIED')
    .sort((a, b) =>
      a.date && b.date
        ? a.date.localeCompare(b.date)
        : a.date
          ? -1
          : b.date
            ? 1
            : a.name.localeCompare(b.name),
    )
  const upcoming = rows.filter((row) => row.status !== 'APPLIED')
  const ready = !!baby && !isPending && !isError
  const canPrint = ready && (applied.length > 0 || (includeCalendar && upcoming.length > 0))
  const retry = () => {
    void babies.refetch()
    if (baby) {
      void calendar.refetch()
      void adhoc.refetch()
    }
  }
  return (
    <div className={`vaccination-card-page mx-auto max-w-5xl ${ready ? '' : 'print:hidden'}`}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          to="/vaccines"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-ink-muted"
        >
          <ArrowLeft aria-hidden className="size-4" />
          {t('vaccines.document.back')}
        </Link>
        <button
          type="button"
          disabled={!canPrint}
          onClick={() => window.print()}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          <Printer aria-hidden className="size-4" />
          {t('vaccines.document.print')}
        </button>
      </div>
      {ready && (
        <fieldset className="mb-5 rounded-2xl border border-border bg-card p-4 print:hidden">
          <legend className="px-1 text-sm font-semibold text-ink">
            {t('vaccines.document.printScope')}
          </legend>
          <div className="flex flex-wrap gap-x-6">
            {[false, true].map((value) => (
              <label
                key={String(value)}
                className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-ink-muted"
              >
                <input
                  type="radio"
                  name="print-scope"
                  checked={includeCalendar === value}
                  onChange={() => setIncludeCalendar(value)}
                  className="size-4 accent-primary"
                />
                {t(value ? 'vaccines.document.include' : 'vaccines.document.onlyApplied')}
              </label>
            ))}
          </div>
          {!canPrint && (
            <p className="mt-1 text-sm text-ink-muted">{t('vaccines.document.nothingToPrint')}</p>
          )}
        </fieldset>
      )}
      {isPending ? (
        <div role="status" className="rounded-3xl bg-card p-10 text-center text-ink-muted">
          {t('common.loading')}
        </div>
      ) : isError ? (
        <div role="alert" className="rounded-3xl bg-card p-8 text-center">
          <p>{t('vaccines.card.loadError')}</p>
          <button
            type="button"
            onClick={retry}
            className="mt-3 min-h-11 px-4 font-semibold text-primary"
          >
            {t('nav.shell.retry')}
          </button>
        </div>
      ) : !baby ? (
        <div role="status" className="rounded-3xl bg-card p-8 text-center text-ink-muted">
          {t('vaccines.document.notFound')}
        </div>
      ) : (
        <VaccinationCardDocument
          baby={baby}
          applied={applied}
          upcoming={upcoming}
          includeCalendar={includeCalendar}
          metadata={calendar.data?.metadata}
        />
      )}
    </div>
  )
}
