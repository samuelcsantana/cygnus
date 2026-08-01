import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router-dom'

import { useBabies } from '@/features/babies/api/babies.hooks'
import { useEffectiveBabyId } from '@/hooks/useEffectiveBabyId'
import { EmptyState } from '@/shared/components/EmptyState'
import { SyringeIcon } from '@/shared/icons/syringe-icon'

import { useVaccineCalendar } from '../api/vaccines.hooks'
import { VaccineCalendarList } from '../components/VaccineCalendarList'

export function VaccinesRoute() {
  const { t } = useTranslation()
  const babyId = useEffectiveBabyId()
  const babies = useBabies()
  const calendar = useVaccineCalendar(babyId)

  if (!babyId) {
    return <Navigate to="/dashboard" replace />
  }

  const baby = babies.data?.find((candidate) => candidate.id === babyId)
  const hasAnyDose = calendar.data?.some((group) => group.items.length > 0) ?? false

  return (
    <div className="animate-fade-in-up">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-primary mb-1 text-sm font-semibold tracking-wider uppercase">{t('vaccines.eyebrow')}</p>
          <h2 className="text-3xl font-extrabold text-slate-900">{t('vaccines.title')}</h2>
          {baby && <p className="mt-1 text-lg text-slate-500">{baby.name}</p>}
        </div>
      </div>

      {calendar.isPending ? (
        <div className="flex justify-center py-16">
          <div className="border-t-transparent h-8 w-8 animate-spin rounded-full border-2 border-primary" />
        </div>
      ) : calendar.isError ? (
        <p className="py-16 text-center text-slate-500">{t('vaccines.genericError')}</p>
      ) : !hasAnyDose ? (
        <EmptyState
          icon={<SyringeIcon className="h-10 w-10" />}
          title={t('vaccines.empty.title')}
          description={t('vaccines.empty.description')}
        />
      ) : (
        <VaccineCalendarList groups={calendar.data ?? []} babyId={babyId} />
      )}
    </div>
  )
}
