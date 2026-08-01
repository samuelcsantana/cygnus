import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { todayDateString } from '@/lib/date'
import { fieldErrorKey } from '@/shared/utils/zod-error'

import { useApplyVaccine } from '../api/vaccines.hooks'
import { applyVaccineSchema, type ApplyVaccineInput, type VaccineItem } from '../api/vaccines.schemas'

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

  const dateErrorKey = fieldErrorKey(errors.applicationDate)

  return (
    <Dialog open={!!item} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('vaccines.apply.title')}</DialogTitle>
        </DialogHeader>

        {item && (
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div>
              <p className="font-bold text-slate-900">{item.name}</p>
              <p className="text-sm text-slate-500">{t('vaccines.doseLabel', { count: item.doseNumber })}</p>
            </div>

            <div>
              <Label htmlFor="applicationDate">{t('vaccines.apply.dateLabel')}</Label>
              <Input
                id="applicationDate"
                type="date"
                className="mt-2"
                aria-invalid={!!errors.applicationDate}
                {...register('applicationDate')}
              />
              {dateErrorKey && <p className="text-destructive mt-1 text-sm">{t(dateErrorKey)}</p>}
            </div>

            <div>
              <Label htmlFor="notes">{t('vaccines.apply.notesLabel')}</Label>
              <Textarea id="notes" rows={3} className="mt-2" {...register('notes')} />
            </div>

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
