import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate } from 'react-router-dom'

import { useEffectiveBabyId } from '@/hooks/useEffectiveBabyId'
import { ArrowLeftIcon } from '@/shared/icons/arrow-left-icon'

import { useCreateAppointment } from '../api/appointments.hooks'
import { AppointmentForm } from '../components/AppointmentForm'

export function NewAppointmentRoute() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const babyId = useEffectiveBabyId()
  const createAppointment = useCreateAppointment(babyId ?? '')

  if (!babyId) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="animate-fade-in-up mx-auto max-w-2xl">
      <div className="mb-8">
        <button
          type="button"
          onClick={() => navigate('/appointments')}
          className="mb-6 flex w-fit items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-500 shadow-sm transition-colors hover:text-indigo-600"
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          {t('common.back')}
        </button>
        <h2 className="text-3xl font-extrabold text-slate-900">{t('appointments.form.createTitle')}</h2>
        <p className="mt-2 text-lg text-slate-500">{t('appointments.form.createSubtitle')}</p>
      </div>

      <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-sm sm:p-10">
        <AppointmentForm
          submitLabel={t('appointments.form.submit')}
          onSubmit={async (values) => {
            await createAppointment.mutateAsync(values)
            navigate('/appointments')
          }}
        />
      </div>
    </div>
  )
}
