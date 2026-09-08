import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { VaccineDialogLayout } from './VaccineDialogLayout'
import { useBabies } from '@/features/babies/api/babies.hooks'
import { formatDateDisplay, todayDateString } from '@/lib/date'

import { useApplyVaccine } from '../api/vaccines.hooks'
import {
  applyVaccineSchema,
  vaccineApplicationDateSchema,
  type ApplyVaccineInput,
  type VaccineItem,
} from '../api/vaccines.schemas'
import { VaccineApplicationDetailsFields } from './VaccineApplicationDetailsFields'

interface ApplyVaccineDialogProps {
  babyId: string
  item: VaccineItem | null
  onOpenChange: (open: boolean) => void
}

export function ApplyVaccineDialog({ babyId, item, onOpenChange }: ApplyVaccineDialogProps) {
  const { t, i18n } = useTranslation()
  const babies = useBabies()
  const baby = babies.data?.find((value) => value.id === babyId)
  const [processing, setProcessing] = useState(false)
  const applyVaccine = useApplyVaccine(babyId)
  const resetMutation = applyVaccine.reset

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<ApplyVaccineInput>({
    resolver: zodResolver(
      applyVaccineSchema.extend({ applicationDate: vaccineApplicationDateSchema.optional() }),
    ),
    defaultValues: { applicationDate: todayDateString(), notes: '' },
  })

  useEffect(() => {
    if (item) {
      resetMutation()
      reset({ applicationDate: todayDateString(), notes: '' })
    }
    // A calendar refresh must not replace an in-progress form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.vaccineId, reset, resetMutation])

  const onSubmit = handleSubmit(async (values) => {
    if (!item || processing) return
    if (!values.applicationDate || (baby && values.applicationDate < baby.birthDate)) {
      setError('applicationDate', { type: 'custom', message: 'vaccines.editor.dateError' })
      return
    }
    try {
      await applyVaccine.mutateAsync({ vaccineId: item.vaccineId, input: values })
      toast.success(t('vaccines.apply.successToast'))
      onOpenChange(false)
    } catch {
      // surfaced below via applyVaccine.error
    }
  })

  const busy = applyVaccine.isPending || processing || isSubmitting
  const date = watch('applicationDate')
  return (
    <VaccineDialogLayout
      open={!!item}
      onOpenChange={onOpenChange}
      title={t('vaccines.apply.title')}
      baby={baby}
      vaccine={item?.name}
      dose={item ? t('vaccines.doseLabel', { count: item.doseNumber }) : undefined}
      date={date ? formatDateDisplay(date, i18n.language) : undefined}
      stage="details"
      dirty={isDirty}
      busy={busy}
      footer={(close) => (
        <>
          <Button type="button" variant="ghost" disabled={busy} onClick={close}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="apply-vaccine-form" disabled={busy}>
            {t(busy ? 'common.saving' : 'vaccines.apply.submit')}
          </Button>
        </>
      )}
    >
      {item && (
        <form id="apply-vaccine-form" onSubmit={onSubmit} className="space-y-4" noValidate>
          <VaccineApplicationDetailsFields
            register={register}
            control={control}
            errors={errors}
            onProcessingChange={setProcessing}
          />

          {applyVaccine.isError && (
            <p role="alert" className="text-destructive text-sm">
              {t('vaccines.apply.genericError')}
            </p>
          )}
        </form>
      )}
    </VaccineDialogLayout>
  )
}
