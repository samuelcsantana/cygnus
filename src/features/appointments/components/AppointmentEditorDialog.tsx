import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useBabies } from '@/features/babies/api/babies.hooks'
import { useCreateSpecialist } from '@/features/specialists/api/specialists.hooks'
import { formatDateDisplay, splitScheduledAt } from '@/lib/date'
import { BabyPickerStep } from '@/shared/components/BabyPickerStep'
import { useCreateAppointment, useUpdateAppointment } from '../api/appointments.hooks'
import {
  appointmentFormSchema,
  type Appointment,
  type AppointmentFormInput,
} from '../api/appointments.schemas'
import { AppointmentDialogLayout } from './AppointmentDialogLayout'
import { AppointmentProfessionalFields } from './AppointmentProfessionalFields'
import { AppointmentScheduleFields } from './AppointmentScheduleFields'
import { AppointmentMeasurementFields } from './AppointmentMeasurementFields'

type Step = 'baby' | 'professional' | 'schedule'
export function AppointmentEditorDialog({
  appointment,
  initialStatus = 'SCHEDULED',
  onOpenChange,
}: {
  appointment?: Appointment
  initialStatus?: 'SCHEDULED' | 'COMPLETED'
  onOpenChange: (open: boolean) => void
}) {
  const { t, i18n } = useTranslation()
  const babies = useBabies()
  const babyList = babies.data ?? []
  const [chosenBabyId, setChosenBabyId] = useState<string | null>(appointment?.babyId ?? null)
  const babyId = chosenBabyId
  const baby = babyList.find((value) => value.id === babyId)
  const [section, setSection] = useState<Step>(appointment ? 'schedule' : 'baby')
  const initialized = useRef(!!appointment)
  useEffect(() => {
    if (initialized.current || !babies.isSuccess) return
    initialized.current = true
    if (babies.data.length === 1) {
      setChosenBabyId(babies.data[0]!.id)
      setSection('professional')
    }
  }, [babies.data, babies.isSuccess])
  const step = section
  const createAppointment = useCreateAppointment(babyId)
  const updateAppointment = useUpdateAppointment(babyId ?? '')
  const createSpecialist = useCreateSpecialist()
  const createdSpecialists = useRef(new Map<string, string>())
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    control,
    setValue,
    setError: setFieldError,
    trigger,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<AppointmentFormInput>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      status: initialStatus,
      doctorName: appointment?.doctorName ?? '',
      specialty: appointment?.specialty ?? '',
      location: appointment?.location ?? '',
      reason: appointment?.reason ?? '',
      specialistId: appointment?.specialistId ?? undefined,
      saveSpecialist: false,
      weightKg: '',
      heightCm: '',
      ...(appointment ? splitScheduledAt(appointment.scheduledAt) : { date: '', time: '' }),
    },
  })
  const [doctorName, specialty, location, date, time, status] = useWatch({
    control,
    name: ['doctorName', 'specialty', 'location', 'date', 'time', 'status'],
  })
  const busy =
    isSubmitting ||
    createAppointment.isPending ||
    updateAppointment.isPending ||
    createSpecialist.isPending
  const continueFromProfessional = async () => {
    if (await trigger('doctorName', { shouldFocus: true })) setSection('schedule')
  }
  const save = handleSubmit(
    async (values) => {
      if (!babyId) return
      setError(null)
      if (baby && values.date < baby.birthDate) {
        setFieldError(
          'date',
          { type: 'custom', message: 'appointments.editor.beforeBirth' },
          { shouldFocus: true },
        )
        return
      }
      let specialistId = values.specialistId
      if (values.saveSpecialist && !specialistId) {
        const key = JSON.stringify([
          babyId,
          values.doctorName.trim().toLowerCase(),
          values.specialty?.trim() ?? '',
        ])
        specialistId = createdSpecialists.current.get(key)
        if (!specialistId) {
          try {
            const saved = await createSpecialist.mutateAsync({
              name: values.doctorName,
              specialty: values.specialty,
              babyIds: [babyId],
              sharedWithUserIds: [],
            })
            specialistId = saved.id
            createdSpecialists.current.set(key, saved.id)
          } catch {
            setError('appointments.editor.saveProfessionalError')
            return
          }
        }
        setValue('specialistId', specialistId)
        setValue('saveSpecialist', false)
      }
      try {
        if (appointment) {
          await updateAppointment.mutateAsync({
            appointmentId: appointment.id,
            input: {
              scheduledAt: new Date(`${values.date}T${values.time}`).toISOString(),
              doctorName: values.doctorName,
              specialty: values.specialty?.trim() || null,
              location: values.location?.trim() || null,
              reason: values.reason?.trim() || null,
              specialistId: specialistId ?? null,
            },
          })
        } else await createAppointment.mutateAsync({ input: values, specialistId })
      } catch {
        setError(
          createdSpecialists.current.size
            ? 'appointments.editor.appointmentAfterProfessionalError'
            : 'appointments.form.genericError',
        )
        return
      }
      toast.success(
        t(appointment ? 'appointments.reschedule.successToast' : 'appointments.form.successToast'),
      )
      onOpenChange(false)
    },
    (invalid) => {
      setSection(invalid.doctorName ? 'professional' : 'schedule')
    },
  )
  const title = t(
    appointment
      ? 'appointments.reschedule.title'
      : status === 'COMPLETED'
        ? 'appointments.editor.completedTitle'
        : 'appointments.form.createTitle',
  )
  return (
    <AppointmentDialogLayout
      open
      onOpenChange={onOpenChange}
      title={title}
      baby={baby}
      professional={doctorName}
      specialty={specialty}
      location={location}
      date={
        date ? `${formatDateDisplay(date, i18n.language)}${time ? ` · ${time}` : ''}` : undefined
      }
      stage={step}
      dirty={isDirty}
      busy={busy}
      progress={
        <ol className="flex flex-wrap gap-x-5 gap-y-2">
          {(['professional', 'schedule'] as const).map((item, index) => (
            <li
              key={item}
              aria-current={step === item ? 'step' : undefined}
              className={`flex items-center gap-2 text-sm font-semibold ${step === item ? 'text-violet-700 dark:text-violet-300' : 'text-ink-muted'}`}
            >
              <span className="text-xs">0{index + 1}</span>
              {t(`appointments.editor.${item}`)}
            </li>
          ))}
        </ol>
      }
      footer={(close) => (
        <>
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={() => {
              if (step === 'schedule') setSection('professional')
              else if (step === 'professional' && !appointment && babyList.length > 1)
                setSection('baby')
              else close()
            }}
          >
            {t(
              step === 'schedule' ||
                (step === 'professional' && !appointment && babyList.length > 1)
                ? 'appointments.wizard.back'
                : 'common.cancel',
            )}
          </Button>
          {step === 'schedule' ? (
            <Button
              key="save"
              type="submit"
              form="appointment-editor-form"
              disabled={busy || !babyId}
              className="bg-violet-700 text-white hover:bg-violet-800"
            >
              {t(
                busy
                  ? 'common.saving'
                  : appointment
                    ? 'appointments.reschedule.submit'
                    : status === 'COMPLETED'
                      ? 'appointments.editor.completedSubmit'
                      : 'appointments.editor.scheduleSubmit',
              )}
            </Button>
          ) : (
            <Button
              key="continue"
              type="button"
              disabled={busy || !babyId || !babies.isSuccess}
              className="bg-violet-700 text-white hover:bg-violet-800"
              onClick={() => {
                if (step === 'baby') setSection('professional')
                else void continueFromProfessional()
              }}
            >
              {t('appointments.wizard.continue')}
            </Button>
          )}
        </>
      )}
    >
      {babies.isPending ? (
        <p role="status">{t('common.loading')}</p>
      ) : babies.isError ? (
        <div role="alert" className="space-y-3">
          <p>{t('appointments.editor.childrenError')}</p>
          <Button onClick={() => void babies.refetch()}>{t('appointments.editor.retry')}</Button>
        </div>
      ) : babyList.length === 0 ? (
        <p>{t('appointments.editor.noChildren')}</p>
      ) : (
        <>
          {step === 'baby' ? (
            <BabyPickerStep
              babies={babyList}
              value={babyId}
              onSelect={(id) => {
                setChosenBabyId(id)
                setValue('specialistId', undefined)
                setValue('saveSpecialist', false)
              }}
            />
          ) : step === 'professional' ? (
            <AppointmentProfessionalFields
              register={register}
              control={control}
              setValue={setValue}
              errors={errors}
              babyId={babyId}
            />
          ) : (
            <form id="appointment-editor-form" onSubmit={save} noValidate className="space-y-5">
              <AppointmentScheduleFields
                register={register}
                control={control}
                errors={errors}
                hideIntent={!!appointment}
              />
              {!appointment && status === 'COMPLETED' && (
                <div className="rounded-2xl border border-border p-4">
                  <AppointmentMeasurementFields register={register} errors={errors} />
                </div>
              )}
            </form>
          )}
          {error && (
            <p role="alert" className="mt-4 text-sm text-destructive">
              {t(error)}
            </p>
          )}
        </>
      )}
    </AppointmentDialogLayout>
  )
}
