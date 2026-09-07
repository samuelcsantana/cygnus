import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAllBabiesAppointments } from '@/features/appointments/api/appointments.hooks'
import { BabyFilterChips } from '@/shared/components/BabyFilterChips'
import { EmptyState } from '@/shared/components/EmptyState'
import { GrowthIcon } from '@/shared/icons/growth-icon'
import { babyAvatarAppearance, babyInitials } from '@/shared/utils/babyAvatarColor'
import { formatCentimeters, formatKilograms } from '@/shared/utils/measurements'

import { growthSeries, indicatorPoints } from '../api/growth.selectors'
import { GrowthChart } from '../components/GrowthChart'
import { GrowthMeasurementsTable } from '../components/GrowthMeasurementsTable'

/**
 * Weight and height over time, one section per child.
 *
 * It reads the appointments and nothing else — there is no growth endpoint,
 * because the measurements are recorded on the visit that took them. Reaching
 * into another feature's `api/` is the sanctioned shape for exactly this: the
 * domain spans both, and the alternative is a second copy of the same rows that
 * can disagree with the first.
 *
 * One section per child rather than one chart with a line each: two children are
 * two different ages at the same instant, so a shared axis would either compare
 * them at the same *date* (meaningless — growth is a function of age) or stack
 * two curves whose points never line up. The chips filter which sections show,
 * the same local, non-global filter the other aggregate pages use.
 */
export function GrowthRoute() {
  const { t, i18n } = useTranslation()
  const { isPending, isError, isEmpty, babies, perBaby } = useAllBabiesAppointments()
  const [selectedBabyId, setSelectedBabyId] = useState<string | null>(null)

  if (isEmpty) {
    return <Navigate to="/dashboard" replace />
  }

  const sections = perBaby
    .filter((entry) => selectedBabyId === null || entry.baby.id === selectedBabyId)
    .map((entry) => ({ baby: entry.baby, series: growthSeries(entry.items, entry.baby.birthDate) }))

  const measurementCount = sections.reduce((total, section) => total + section.series.length, 0)

  return (
    <div className="animate-fade-in-up">
      <div className="mb-8">
        <h2 className="font-display text-3xl font-extrabold text-ink">{t('growth.title')}</h2>
        {/* Nothing under the title on error: the message below already says the
            measurements did not load, and a count derived from an empty array
            would assert zero and then admit, one line down, that it read
            nothing. Same shape as the appointments and vaccines summaries. */}
        {!isError && (
          <p className="mt-1 text-lg text-ink-muted">
            {isPending ? t('growth.summaryUnavailable') : t('growth.summary', { count: measurementCount })}
          </p>
        )}
      </div>

      <BabyFilterChips babies={babies} value={selectedBabyId} onChange={setSelectedBabyId} className="mb-6" />

      {isPending ? (
        <GrowthSkeleton />
      ) : isError ? (
        <p className="py-16 text-center text-ink-muted">{t('growth.genericError')}</p>
      ) : measurementCount === 0 ? (
        <EmptyState
          icon={<GrowthIcon className="h-10 w-10" />}
          title={t('growth.empty.title')}
          description={t('growth.empty.description')}
          tone="emerald"
          action={
            <Button asChild size="cta" className="rounded-2xl">
              <Link to="/appointments">{t('growth.empty.cta')}</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          {sections.map(({ baby, series }) => {
            const appearance = babyAvatarAppearance(baby.id, baby.avatarColor)
            const weight = indicatorPoints(series, 'weight')
            const height = indicatorPoints(series, 'height')

            return (
              <section
                key={baby.id}
                className="rounded-2xl bg-card p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] sm:p-6"
                aria-labelledby={`growth-${baby.id}`}
              >
                <div className="mb-5 flex items-center gap-3">
                  <span
                    className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-black ${appearance.className}`}
                    style={appearance.style}
                    aria-hidden="true"
                  >
                    {babyInitials(baby.name)}
                  </span>
                  <h3 id={`growth-${baby.id}`} className="font-display truncate text-lg font-extrabold text-ink">
                    {baby.name}
                  </h3>
                </div>

                {series.length === 0 ? (
                  <p className="py-6 text-center text-sm text-ink-muted">{t('growth.empty.title')}</p>
                ) : (
                  <>
                    {/* One measurement is a dot, and a dot is not a curve. Said
                        out loud once per child, because a lone point on a full
                        axis looks like the rest of the data failed to load. */}
                    {series.length === 1 && <p className="mb-4 text-sm text-ink-muted">{t('growth.singlePoint')}</p>}

                    <div className="grid gap-8 lg:grid-cols-2">
                      <div>
                        <h4 className="mb-3 text-xs font-bold text-ink-faint uppercase">{t('growth.weight')}</h4>
                        {weight.length === 0 ? (
                          <p className="text-sm text-ink-muted">{t('growth.noWeight')}</p>
                        ) : (
                          <GrowthChart
                            points={weight}
                            indicator="weight"
                            formatValue={(value) => formatKilograms(value, i18n.language)}
                            label={t('growth.chart.weightLabel', { name: baby.name, count: weight.length })}
                          />
                        )}
                      </div>
                      <div>
                        <h4 className="mb-3 text-xs font-bold text-ink-faint uppercase">{t('growth.height')}</h4>
                        {height.length === 0 ? (
                          <p className="text-sm text-ink-muted">{t('growth.noHeight')}</p>
                        ) : (
                          <GrowthChart
                            points={height}
                            indicator="height"
                            formatValue={(value) => formatCentimeters(value, i18n.language)}
                            label={t('growth.chart.heightLabel', { name: baby.name, count: height.length })}
                          />
                        )}
                      </div>
                    </div>

                    <div className="mt-8">
                      <h4 className="mb-2 text-xs font-bold text-ink-faint uppercase">{t('growth.table.title')}</h4>
                      <GrowthMeasurementsTable points={series} />
                    </div>
                  </>
                )}
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}

function GrowthSkeleton() {
  return (
    <div className="rounded-2xl bg-card p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] sm:p-6" aria-hidden="true">
      <div className="mb-5 flex items-center gap-3">
        <Skeleton className="h-9 w-9 flex-shrink-0 rounded-full" />
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
        <Skeleton className="h-44 w-full rounded-xl" />
        <Skeleton className="h-44 w-full rounded-xl" />
      </div>
    </div>
  )
}
