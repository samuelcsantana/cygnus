import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { ArrowLeftIcon } from '@/shared/icons/arrow-left-icon'

import { useBabies, useCreateBaby } from '../api/babies.hooks'
import { BabyForm } from '../components/BabyForm'

export function AddBabyRoute() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const babies = useBabies()
  const createBaby = useCreateBaby()
  const hasBabies = (babies.data?.length ?? 0) > 0

  const goToDashboard = () => navigate('/dashboard')

  return (
    <div className="animate-fade-in-up mx-auto mt-4 max-w-2xl md:mt-12">
      <div className="mb-8">
        {hasBabies && (
          <button
            type="button"
            onClick={goToDashboard}
            className="mb-6 flex w-fit items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-ink-muted shadow-sm transition-colors hover:text-primary"
          >
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            {t('common.back')}
          </button>
        )}
        <h2 className="font-display text-3xl font-extrabold text-ink">{t('babies.form.title')}</h2>
        <p className="mt-2 text-lg text-ink-muted">{t('babies.form.subtitle')}</p>
      </div>

      <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-sm sm:p-10">
        <div className="bg-primary/5 absolute top-0 right-0 z-0 h-32 w-32 -mr-10 -mt-10 rounded-bl-full" />
        <BabyForm
          submitLabel={t('babies.form.submit')}
          onCancel={goToDashboard}
          showCancel={hasBabies}
          onSubmit={async (values) => {
            await createBaby.mutateAsync(values)
            goToDashboard()
          }}
        />
      </div>
    </div>
  )
}
