import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'
import { AlertCircleIcon } from '@/shared/icons/alert-circle-icon'
import { CheckIcon } from '@/shared/icons/check-icon'
import { ClockIcon } from '@/shared/icons/clock-icon'
import { StethoscopeIcon } from '@/shared/icons/stethoscope-icon'

import './product-preview-card.css'

/**
 * A still of the vaccine card, drawn for the public screens: one child, the PNI
 * progress, three doses and the next visit, with the overdue dose floating
 * beside it.
 *
 * It shows the same family the demo account opens on — Helena at six months,
 * the third VIP dose overdue, a check-up with Dra. Ana Ribeiro in two days — so
 * what the page promises is what the demo then shows. Vaccine and people's
 * names are data and stay as written; everything around them is translated.
 *
 * Exposed to assistive technology as one image with a description, not as a
 * list of doses: read out item by item, a picture of the product would sound
 * like real records.
 *
 * `animated` plays a two-second opening (product-preview-card.css): the bar
 * fills, the doses arrive, the alert comes last. The `data-preview-*`
 * attributes are its hooks.
 */
export function ProductPreviewCard({ className, animated = false }: { className?: string; animated?: boolean }) {
  const { t } = useTranslation()

  const doses = [
    { name: 'Pentavalente (DTP/Hib/HB)', detail: t('landing.preview.pentaDetail'), status: 'applied' },
    { name: 'Covid-19', detail: t('landing.preview.covidFirstDetail'), status: 'applied' },
    { name: 'Covid-19', detail: t('landing.preview.covidSecondDetail'), status: 'pending' },
  ] as const

  return (
    <div
      role="img"
      aria-label={t('landing.preview.label')}
      data-preview-animated={animated || undefined}
      className={cn('relative w-full max-w-[22.5rem] pb-10', className)}
    >
      <div className="rounded-[18px] border border-border bg-card p-4 text-ink shadow-[0_30px_60px_-28px_rgba(26,46,37,0.45)]">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-violet-600 text-[15px] font-semibold text-white">H</span>
          <div>
            <p className="font-display text-lg leading-tight font-medium">Helena</p>
            <p className="text-xs text-ink-muted">{t('landing.preview.age')}</p>
          </div>
          <span className="ml-auto rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
            {t('landing.preview.tag')}
          </span>
        </div>

        <div className="mt-3.5">
          <div className="mb-1.5 flex justify-between gap-2 text-xs font-semibold">
            <span>{t('landing.preview.schedule')}</span>
            <span className="font-normal text-primary">{t('landing.preview.progress', { done: 14, total: 31 })}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div data-preview-bar className="h-full w-[45%] rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400" />
          </div>
        </div>

        <ul className="mt-3 flex flex-col gap-1.5">
          {doses.map((dose, index) => (
            <li
              key={`${dose.name}-${dose.detail}`}
              data-preview-item
              style={{ '--i': index } as CSSProperties}
              className="flex items-center gap-2.5 rounded-[10px] bg-surface px-2.5 py-2"
            >
              <span
                className={cn(
                  'flex size-[26px] shrink-0 items-center justify-center rounded-[7px]',
                  dose.status === 'applied'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
                )}
              >
                {dose.status === 'applied' ? <CheckIcon className="size-3.5" /> : <ClockIcon className="size-3.5" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-semibold">{dose.name}</p>
                <p className="text-[11px] text-ink-muted">{dose.detail}</p>
              </div>
              <span
                className={cn(
                  'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                  dose.status === 'applied'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
                )}
              >
                {t(dose.status === 'applied' ? 'landing.preview.applied' : 'landing.preview.pending')}
              </span>
            </li>
          ))}
        </ul>

        <div data-preview-appointment className="mt-2.5 flex items-center gap-2 border-t border-dashed border-border pt-2.5 text-[12.5px] font-semibold">
          <StethoscopeIcon className="size-4 text-violet-600 dark:text-violet-300" />
          <span>Dra. Ana Ribeiro</span>
          <span className="ml-auto shrink-0 rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700 dark:bg-violet-500/15 dark:text-violet-200">
            {t('landing.preview.appointmentWhen')}
          </span>
        </div>
      </div>

      <div
        data-preview-alert
        className="absolute right-0 bottom-0 flex items-center gap-2.5 rounded-[14px] border border-border bg-card py-2.5 pr-3.5 pl-2.5 shadow-[0_18px_40px_-18px_rgba(26,46,37,0.45)] lg:-right-2"
      >
        <span className="flex size-7 items-center justify-center rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
          <AlertCircleIcon className="size-4" />
        </span>
        <div>
          <p className="text-[12.5px] font-semibold text-ink">{t('landing.preview.overdueTitle')}</p>
          <p className="text-[11px] text-ink-muted">{t('landing.preview.overdueDetail')}</p>
        </div>
      </div>
    </div>
  )
}
