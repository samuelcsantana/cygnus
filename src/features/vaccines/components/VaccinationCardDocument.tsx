import { useTranslation } from 'react-i18next'
import type { Baby } from '@/features/babies/api/babies.schemas'
import { formatDateDisplay, todayDateString } from '@/lib/date'
import { babyAvatarAppearance, babyInitials } from '@/shared/utils/babyAvatarColor'
import type { VaccineCatalogMetadata, VaccineStatus } from '../api/vaccines.schemas'

export interface VaccinationCardRow {
  key: string
  date: string | null
  name: string
  dose: string
  status: VaccineStatus
  source: 'CATALOG' | 'CAMPAIGN' | 'CUSTOM'
  batchNumber: string | null
  location: string | null
  professional: string | null
  notes: string | null
  photoUrl: string | null
}
interface Props {
  baby: Baby
  applied: VaccinationCardRow[]
  upcoming: VaccinationCardRow[]
  includeCalendar: boolean
  metadata?: VaccineCatalogMetadata
}

export function VaccinationCardDocument({
  baby,
  applied,
  upcoming,
  includeCalendar,
  metadata,
}: Props) {
  const { t, i18n } = useTranslation()
  const avatar = babyAvatarAppearance(baby.id, baby.avatarColor)
  return (
    <article className="vaccination-document overflow-hidden rounded-3xl border border-border bg-card shadow-sm print:overflow-visible print:rounded-none print:border-0 print:shadow-none">
      <header className="border-b border-border bg-primary/5 p-5 sm:p-8 print:bg-white print:p-0 print:pb-5">
        <p className="mb-3 text-sm font-semibold text-primary">Ninho</p>
        <h1 className="font-display text-2xl font-black text-ink sm:text-3xl">
          {t('vaccines.card.title')}
        </h1>
        <div className="mt-5 flex items-center gap-4">
          <span
            aria-hidden
            className={`flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-lg font-bold print:hidden ${avatar.className}`}
            style={avatar.style}
          >
            {baby.avatarUrl ? (
              <img src={baby.avatarUrl} alt="" className="size-full object-cover" />
            ) : (
              babyInitials(baby.name)
            )}
          </span>
          <div className="min-w-0">
            <h2 className="break-words text-lg font-bold text-ink">{baby.name}</h2>
            <p className="mt-1 text-sm text-ink-muted">
              {t('vaccines.card.birthDateLabel')}{' '}
              <span className="font-mono">{formatDateDisplay(baby.birthDate, i18n.language)}</span>
            </p>
          </div>
        </div>
        <p className="mt-4 text-xs text-ink-muted">
          {t('vaccines.document.generated', {
            date: formatDateDisplay(todayDateString(), i18n.language),
          })}
        </p>
      </header>
      <div className="space-y-8 p-5 sm:p-8 print:p-0 print:pt-5">
        <RecordSection
          rows={applied}
          title={t('vaccines.document.applied')}
          empty={t('vaccines.document.noApplied')}
        />
        <div className={includeCalendar ? '' : 'print:hidden'}>
          <RecordSection
            rows={upcoming}
            title={t('vaccines.document.upcoming')}
            empty={t('vaccines.document.noUpcoming')}
          />
        </div>
        <footer className="border-t border-border pt-4 text-xs leading-relaxed text-ink-muted">
          <p>{t('vaccines.document.recordNote')}</p>
          {metadata && (
            <p className="mt-2">
              {t('vaccines.catalog.source', {
                organization: metadata.sourceOrganization,
                date: formatDateDisplay(metadata.sourceUpdatedAt, i18n.language),
              })}{' '}
              <a href={metadata.sourceUrl} target="_blank" rel="noreferrer" className="underline">
                {t('vaccines.catalog.openSource')}
              </a>
            </p>
          )}
        </footer>
      </div>
    </article>
  )
}

function RecordSection({
  rows,
  title,
  empty,
}: {
  rows: VaccinationCardRow[]
  title: string
  empty: string
}) {
  const { t, i18n } = useTranslation()
  return (
    <section>
      <h2 className="mb-4 font-display text-xl font-bold text-ink print:break-after-avoid">
        {title}{' '}
        <span className="font-sans text-sm font-normal text-ink-muted">({rows.length})</span>
      </h2>
      {!rows.length ? (
        <p className="rounded-xl bg-muted/50 p-4 text-sm text-ink-muted">{empty}</p>
      ) : (
        <table
          role="table"
          className="block w-full border-collapse text-left text-sm sm:table print:table"
        >
          <caption className="sr-only">{title}</caption>
          <thead
            role="rowgroup"
            className="hidden border-b border-border text-xs text-ink-muted sm:table-header-group print:table-header-group"
          >
            <tr role="row">
              {[
                t('vaccines.card.columnVaccine'),
                t('vaccines.card.columnDate'),
                t('vaccines.card.columnDose'),
                t('vaccines.card.columnStatus'),
              ].map((label) => (
                <th key={label} scope="col" className="px-2 pb-3 font-semibold first:pl-0">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          {rows.map((row) => (
            <RecordRows key={row.key} row={row} locale={i18n.language} />
          ))}
        </table>
      )}
    </section>
  )
}

function RecordRows({ row, locale }: { row: VaccinationCardRow; locale: string }) {
  const { t } = useTranslation()
  const statusKey = row.status === 'APPLIED' ? 'appliedShort' : row.status.toLowerCase()
  const details = [
    ['batch', row.batchNumber],
    ['location', row.location],
    ['professional', row.professional],
    ['notes', row.notes],
  ].filter(([, value]) => value)
  const hasDetails = details.length > 0 || !!row.photoUrl
  const detailContent = (
    <div className="space-y-3">
      <dl className="grid gap-3 sm:grid-cols-2">
        {details.map(([key, value]) => (
          <div key={key} className="min-w-0">
            <dt className="text-xs font-semibold text-ink-muted">
              {t(`vaccines.document.${key}`)}
            </dt>
            <dd className="mt-1 whitespace-pre-wrap break-words text-sm text-ink">{value}</dd>
          </div>
        ))}
      </dl>
      {row.photoUrl && (
        <figure>
          <figcaption className="mb-2 text-xs font-semibold text-ink-muted">
            {t('vaccines.document.proof')}
          </figcaption>
          <img
            src={row.photoUrl}
            alt={t('vaccines.document.proof')}
            loading="lazy"
            className="max-h-64 max-w-full rounded-lg object-contain print:max-h-28"
          />
        </figure>
      )}
    </div>
  )
  return (
    <tbody
      role="rowgroup"
      className="mb-3 block break-inside-avoid rounded-xl border border-border p-3 sm:table-row-group sm:rounded-none sm:border-0 sm:p-0 print:table-row-group print:rounded-none print:border-0 print:p-0"
    >
      <tr role="row" className="grid grid-cols-2 gap-3 sm:table-row print:table-row">
        <th
          role="rowheader"
          scope="row"
          className="col-span-2 min-w-0 break-words text-left align-top font-semibold text-ink sm:max-w-64 sm:py-4 sm:pr-3 print:py-3 print:pr-3"
        >
          {row.name}
          <span className="mt-1 block text-xs font-normal text-ink-muted">
            {t(`vaccines.document.source${row.source}`)}
          </span>
        </th>
        <td role="cell" className="align-top text-ink-muted sm:px-2 sm:py-4 print:px-2 print:py-3">
          <span className="mb-1 block text-xs sm:hidden print:hidden">
            {t('vaccines.card.columnDate')}
          </span>
          <span className="whitespace-nowrap font-mono">
            {row.date ? formatDateDisplay(row.date, locale) : t('vaccines.document.noDate')}
          </span>
        </td>
        <td
          role="cell"
          className="break-words align-top text-ink-muted sm:px-2 sm:py-4 print:px-2 print:py-3"
        >
          <span className="mb-1 block text-xs sm:hidden print:hidden">
            {t('vaccines.card.columnDose')}
          </span>
          {row.dose}
        </td>
        <td role="cell" className="col-span-2 align-top sm:px-2 sm:py-4 print:px-2 print:py-3">
          <span
            className={`inline-block rounded-lg px-2 py-1 text-xs font-semibold ${row.status === 'APPLIED' ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200' : row.status === 'DELAYED' ? 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200' : 'bg-muted text-ink-muted'}`}
          >
            {t(`vaccines.status.${statusKey}`)}
          </span>
        </td>
      </tr>
      {hasDetails && (
        <tr role="row" className="mt-2 block sm:table-row print:table-row">
          <td role="cell" colSpan={4} className="block pb-4 sm:table-cell print:table-cell">
            <details className="rounded-xl bg-muted/40 px-3 print:hidden">
              <summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold text-primary">
                {t('vaccines.document.details')}
              </summary>
              <div className="pb-4">{detailContent}</div>
            </details>
            <div className="hidden print:block">{detailContent}</div>
          </td>
        </tr>
      )}
    </tbody>
  )
}
