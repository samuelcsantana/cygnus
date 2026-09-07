import { useTranslation } from 'react-i18next'

import { formatDateDisplay } from '@/lib/date'
import { formatCentimeters, formatKilograms } from '@/shared/utils/measurements'

import type { GrowthPoint } from '../api/growth.selectors'

interface GrowthMeasurementsTableProps {
  points: GrowthPoint[]
}

/**
 * The same series as the charts, in words.
 *
 * This is not a nicety beside the graphic — it is how the graphic is readable at
 * all to someone who cannot see it, and why the charts can be a single
 * `role="img"` with no focusable dots. It is also the only place the numbers are
 * exact: a curve says "it went up", a table says 7,9 kg on 28/07.
 *
 * Oldest first, matching the charts. The appointment list runs the other way,
 * which is right there and would be confusing here — a reader glancing between
 * the line and the rows should find them in the same order.
 */
export function GrowthMeasurementsTable({ points }: GrowthMeasurementsTableProps) {
  const { t, i18n } = useTranslation()

  return (
    // Its own scroller: four columns of numbers fit a phone, but a long date
    // format or a large default font must not push the page sideways.
    <div className="overflow-x-auto">
      <table className="w-full min-w-72 border-collapse text-left text-sm">
        <caption className="sr-only">{t('growth.table.title')}</caption>
        <thead>
          <tr className="border-b border-border">
            <th scope="col" className="py-2 pr-3 text-xs font-bold text-ink-faint uppercase">
              {t('growth.table.date')}
            </th>
            <th scope="col" className="py-2 pr-3 text-xs font-bold text-ink-faint uppercase">
              {t('growth.table.age')}
            </th>
            <th scope="col" className="py-2 pr-3 text-xs font-bold text-ink-faint uppercase">
              {t('growth.table.weight')}
            </th>
            <th scope="col" className="py-2 text-xs font-bold text-ink-faint uppercase">
              {t('growth.table.height')}
            </th>
          </tr>
        </thead>
        <tbody>
          {points.map((point) => (
            <tr key={point.appointmentId} className="border-b border-border/60 last:border-0">
              <td className="py-2 pr-3 font-mono text-[13px] text-ink">
                {formatDateDisplay(point.scheduledAt.slice(0, 10), i18n.language)}
              </td>
              <td className="py-2 pr-3 text-[13px] text-ink-muted">
                {t('babies.monthsOld', { count: point.ageMonthsWhole })}
              </td>
              {/* An em dash, not a blank: an empty cell reads as "we lost it",
                  and this visit genuinely did not record that measure. */}
              <td className="py-2 pr-3 font-mono text-[13px] text-ink">
                {point.weightGrams === null
                  ? t('growth.table.missing')
                  : formatKilograms(point.weightGrams, i18n.language)}
              </td>
              <td className="py-2 font-mono text-[13px] text-ink">
                {point.heightMillimeters === null
                  ? t('growth.table.missing')
                  : formatCentimeters(point.heightMillimeters, i18n.language)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
