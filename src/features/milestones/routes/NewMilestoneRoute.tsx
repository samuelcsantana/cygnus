import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate } from 'react-router-dom'

import { useBabies } from '@/features/babies/api/babies.hooks'
import { useEffectiveBabyId } from '@/hooks/useEffectiveBabyId'
import { ArrowLeftIcon } from '@/shared/icons/arrow-left-icon'

import { useCreateMilestone } from '../api/milestones.hooks'
import { MilestoneForm } from '../components/MilestoneForm'

export function NewMilestoneRoute() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const babyId = useEffectiveBabyId()
  const babies = useBabies()
  const createMilestone = useCreateMilestone(babyId ?? '')

  if (!babyId) {
    return <Navigate to="/dashboard" replace />
  }

  const baby = babies.data?.find((candidate) => candidate.id === babyId)

  if (!baby) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="animate-fade-in-up mx-auto max-w-2xl">
      <div className="mb-8">
        <button
          type="button"
          onClick={() => navigate('/milestones')}
          className="mb-6 flex w-fit items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-ink-muted shadow-sm transition-colors hover:text-ink"
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          {t('common.back')}
        </button>
        <h2 className="font-display text-3xl font-extrabold text-ink">{t('milestones.form.createTitle')}</h2>
        <p className="mt-2 text-lg text-ink-muted">{t('milestones.form.createSubtitle')}</p>
      </div>

      <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-sm sm:p-10">
        <MilestoneForm
          birthDate={baby.birthDate}
          submitLabel={t('milestones.form.submit')}
          onSubmit={async (values) => {
            await createMilestone.mutateAsync(values)
            navigate('/milestones')
          }}
        />
      </div>
    </div>
  )
}
