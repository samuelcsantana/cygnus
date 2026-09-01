import { useTranslation } from 'react-i18next'

import { formatDateDisplay } from '@/lib/date'
import { cn } from '@/lib/utils'

import type { VaccineCatalogMetadata } from '../api/vaccines.schemas'

interface VaccineCatalogNoticeProps {
  metadata: VaccineCatalogMetadata
  className?: string
}

export function VaccineCatalogNotice({ metadata, className }: VaccineCatalogNoticeProps) {
  const { t, i18n } = useTranslation()

  return (
    <aside
      className={cn(
        'rounded-2xl border border-sky-100 bg-sky-50/70 p-4 text-sm dark:border-sky-900/60 dark:bg-sky-950/40',
        className,
      )}
    >
      <p className="font-bold text-sky-900 dark:text-sky-200">{t('vaccines.catalog.title')}</p>
      <p className="mt-1 text-sky-800 dark:text-sky-300">
        {t('vaccines.catalog.source', {
          organization: metadata.sourceOrganization,
          date: formatDateDisplay(metadata.sourceUpdatedAt, i18n.language),
        })}{' '}
        <a
          href={metadata.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="font-bold underline underline-offset-2"
        >
          {t('vaccines.catalog.openSource')}
        </a>
      </p>
      <p className="mt-2 text-xs leading-relaxed text-sky-800 dark:text-sky-300">
        {t('vaccines.catalog.disclaimer')}
      </p>
    </aside>
  )
}
