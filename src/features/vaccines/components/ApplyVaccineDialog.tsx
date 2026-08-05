import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { todayDateString } from '@/lib/date'

import { useApplyVaccine } from '../api/vaccines.hooks'
import { applyVaccineSchema, type ApplyVaccineInput, type VaccineItem } from '../api/vaccines.schemas'
import { VaccineApplicationDetailsFields } from './VaccineApplicationDetailsFields'

interface ApplyVaccineDialogProps {
  babyId: string
  item: VaccineItem | null
  onOpenChange: (open: boolean) => void
}

export function ApplyVaccineDialog({ babyId, item, onOpenChange }: ApplyVaccineDialogProps) {
  const { t } = useTranslation()
  const applyVaccine = useApplyVaccine(babyId)

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ApplyVaccineInput>({
    resolver: zodResolver(applyVaccineSchema),
    defaultValues: { applicationDate: todayDateString(), notes: '' },
  })

  useEffect(() => {
    if (item) {
      reset({ applicationDate: todayDateString(), notes: '' })
    }
  }, [item, reset])

  const onSubmit = handleSubmit(async (values) => {
    if (!item) return
    try {
      await applyVaccine.mutateAsync({ vaccineId: item.vaccineId, input: values })
      onOpenChange(false)
    } catch {
      // surfaced below via applyVaccine.error
    }
  })

  return (
    <Dialog open={!!item} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('vaccines.apply.title')}</DialogTitle>
        </DialogHeader>

        {item && (
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div className="rounded-xl bg-teal-50 px-4 py-3">
              <p className="font-bold text-ink">{item.name}</p>
              <p className="text-sm font-medium text-teal-600">{t('vaccines.doseLabel', { count: item.doseNumber })}</p>
            </div>

            <VaccineApplicationDetailsFields register={register} control={control} errors={errors} />

            {applyVaccine.isError && (
              <p role="alert" className="text-destructive text-sm">
                {t('vaccines.apply.genericError')}
              </p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={applyVaccine.isPending}>
                {applyVaccine.isPending ? t('common.saving') : t('vaccines.apply.submit')}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
