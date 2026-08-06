// Deliberately no "schedule a reminder" checkbox here, unlike the reference
// prototype this wizard is modeled after: there is no per-record reminder
// infrastructure (BullMQ only generates general automatic reminders today),
// so a decorative checkbox with no real effect was left out on purpose.
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { soleBaby, useBabies } from '@/features/babies/api/babies.hooks'
import { todayDateString } from '@/lib/date'
import { cn } from '@/lib/utils'
import { BabyPickerStep } from '@/shared/components/BabyPickerStep'
import { SelectorCardGroup } from '@/shared/components/SelectorCardGroup'
import { StepIndicator, type Step as StepIndicatorStep } from '@/shared/components/StepIndicator'
import { BellIcon } from '@/shared/icons/bell-icon'
import { CalendarIcon } from '@/shared/icons/calendar-icon'
import { PencilIcon } from '@/shared/icons/pencil-icon'
import { SyringeIcon } from '@/shared/icons/syringe-icon'

import { useApplyVaccine, useRegisterAdhocVaccine, useVaccineCalendar } from '../api/vaccines.hooks'
import { applyVaccineSchema } from '../api/vaccines.schemas'
import { CAMPAIGN_VACCINE_SUGGESTIONS } from './campaign-vaccine-suggestions'
import { VaccineApplicationDetailsFields } from './VaccineApplicationDetailsFields'

type VaccineTypeChoice = 'CATALOG' | 'CAMPAIGN' | 'CUSTOM'
type Step = 'baby' | 'type' | 'select' | 'details'

const detailsFormSchema = applyVaccineSchema.extend({
  applicationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})
type DetailsFormInput = z.infer<typeof detailsFormSchema>

interface RegisterVaccineDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RegisterVaccineDialog({ open, onOpenChange }: RegisterVaccineDialogProps) {
  const { t } = useTranslation()
  const babies = useBabies()
  const babyList = babies.data ?? []
  const needsBabyPicker = babyList.length > 1

  const [step, setStep] = useState<Step>('type')
  const [selectedBabyId, setSelectedBabyId] = useState<string | null>(null)
  const [choice, setChoice] = useState<VaccineTypeChoice | null>(null)
  const [selectedVaccineId, setSelectedVaccineId] = useState<string | null>(null)
  const [campaignName, setCampaignName] = useState('')
  const [customName, setCustomName] = useState('')
  const [customDose, setCustomDose] = useState('')

  const calendar = useVaccineCalendar(selectedBabyId)
  const pendingItems = (calendar.data ?? [])
    .flatMap((group) => group.items)
    .filter((item) => item.status !== 'APPLIED')

  const applyVaccine = useApplyVaccine(selectedBabyId)
  const registerAdhocVaccine = useRegisterAdhocVaccine(selectedBabyId)

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DetailsFormInput>({
    resolver: zodResolver(detailsFormSchema),
    defaultValues: { applicationDate: todayDateString() },
  })

  useEffect(() => {
    if (!open) return
    const sole = soleBaby(babies.data)
    setSelectedBabyId(sole?.id ?? null)
    setStep(babyList.length > 1 ? 'baby' : 'type')
    setChoice(null)
    setSelectedVaccineId(null)
    setCampaignName('')
    setCustomName('')
    setCustomDose('')
    reset({ applicationDate: todayDateString() })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, babies.data])

  const selectedVaccine = pendingItems.find((item) => item.vaccineId === selectedVaccineId) ?? null

  const canProceedStep1 =
    choice === 'CATALOG'
      ? !!selectedVaccineId
      : choice === 'CAMPAIGN'
        ? !!campaignName.trim()
        : choice === 'CUSTOM'
          ? !!customName.trim()
          : false

  const mutation = choice === 'CATALOG' ? applyVaccine : registerAdhocVaccine

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (choice === 'CATALOG' && selectedVaccineId) {
        await applyVaccine.mutateAsync({ vaccineId: selectedVaccineId, input: values })
      } else if (choice === 'CAMPAIGN') {
        await registerAdhocVaccine.mutateAsync({ source: 'CAMPAIGN', customName: campaignName, ...values })
      } else if (choice === 'CUSTOM') {
        await registerAdhocVaccine.mutateAsync({
          source: 'CUSTOM',
          customName,
          customDose: customDose || undefined,
          ...values,
        })
      }
      onOpenChange(false)
    } catch {
      // surfaced below via mutation.error
    }
  })

  const summaryName = choice === 'CATALOG' ? (selectedVaccine?.name ?? '') : choice === 'CAMPAIGN' ? campaignName : customName

  const submitErrorMessage = mutation.error ? t('vaccines.register.genericError') : null

  const steps: StepIndicatorStep[] = [
    ...(needsBabyPicker ? [{ id: 'baby', label: t('babies.picker.stepLabel') }] : []),
    { id: 'type', label: t('vaccines.register.stepType') },
    { id: 'select', label: t('vaccines.register.stepSelect') },
    { id: 'details', label: t('vaccines.register.stepDetails') },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] bg-teal-50 text-teal-600">
              <SyringeIcon className="h-[18px] w-[18px]" />
            </span>
            {step === 'details' ? t('vaccines.register.detailsTitle') : t('vaccines.register.title')}
          </DialogTitle>
        </DialogHeader>

        <StepIndicator steps={steps} currentStepId={step} accentClassName="bg-teal-500" />

        {step === 'baby' ? (
          <div className="animate-fade-in-up space-y-5">
            <BabyPickerStep babies={babyList} value={selectedBabyId} onSelect={setSelectedBabyId} />
            <DialogFooter>
              <Button type="button" disabled={!selectedBabyId} onClick={() => setStep('type')}>
                {t('vaccines.register.continue')}
              </Button>
            </DialogFooter>
          </div>
        ) : step === 'type' ? (
          <div className="animate-fade-in-up space-y-5">
            <SelectorCardGroup
              layout="vertical"
              value={choice ?? ''}
              onValueChange={(value) => {
                setChoice(value as VaccineTypeChoice)
                setStep('select')
              }}
              options={[
                {
                  value: 'CATALOG',
                  label: t('vaccines.register.type.catalog.title'),
                  description: t('vaccines.register.type.catalog.description'),
                  media: (
                    <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                      <CalendarIcon className="h-5 w-5" />
                    </span>
                  ),
                },
                {
                  value: 'CAMPAIGN',
                  label: t('vaccines.register.type.campaign.title'),
                  description: t('vaccines.register.type.campaign.description'),
                  media: (
                    <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                      <BellIcon className="h-5 w-5" />
                    </span>
                  ),
                },
                {
                  value: 'CUSTOM',
                  label: t('vaccines.register.type.custom.title'),
                  description: t('vaccines.register.type.custom.description'),
                  media: (
                    <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                      <PencilIcon className="h-5 w-5" />
                    </span>
                  ),
                },
              ]}
            />
          </div>
        ) : step === 'select' ? (
          <div className="animate-fade-in-up space-y-5">
            {choice === 'CATALOG' && (
              <div className="overflow-hidden rounded-2xl border border-teal-100">
                <div className="flex items-center gap-2 bg-teal-50 px-4 py-2.5">
                  <CalendarIcon className="h-3.5 w-3.5 flex-shrink-0 text-teal-700" />
                  <p className="text-xs font-bold text-teal-700">{t('vaccines.register.catalogPicker.label')}</p>
                </div>
                <div className="max-h-56 overflow-y-auto">
                  {pendingItems.length === 0 ? (
                    <p className="p-4 text-center text-sm text-ink-muted">
                      {t('vaccines.register.catalogPicker.empty')}
                    </p>
                  ) : (
                    pendingItems.map((item) => (
                      <button
                        key={item.vaccineId}
                        type="button"
                        onClick={() => setSelectedVaccineId(item.vaccineId)}
                        className={cn(
                          'flex w-full items-center gap-3 border-b border-slate-50 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-slate-50',
                          selectedVaccineId === item.vaccineId && 'bg-teal-50/60',
                        )}
                      >
                        <span
                          className={cn(
                            'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[10px] text-sm font-extrabold',
                            item.status === 'DELAYED' ? 'bg-rose-50 text-rose-500' : 'bg-amber-50 text-amber-500',
                          )}
                        >
                          {item.status === 'DELAYED' ? '!' : '○'}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold text-ink">{item.name}</span>
                          <span className="block text-xs text-ink-muted">
                            {t('vaccines.doseLabel', { count: item.doseNumber })}
                          </span>
                        </span>
                        <span
                          className={cn(
                            'flex-shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                            item.status === 'DELAYED' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800',
                          )}
                        >
                          {item.status === 'DELAYED' ? t('vaccines.status.delayed') : t('vaccines.status.pending')}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {choice === 'CAMPAIGN' && (
              <div className="space-y-3">
                <div className="overflow-hidden rounded-2xl border border-violet-100">
                  <div className="flex items-center gap-2 bg-violet-50 px-4 py-2.5">
                    <BellIcon className="h-3.5 w-3.5 flex-shrink-0 text-violet-700" />
                    <p className="text-xs font-bold text-violet-700">
                      {t('vaccines.register.campaignPicker.suggestedLabel')}
                    </p>
                  </div>
                  <div className="max-h-40 overflow-y-auto">
                    {CAMPAIGN_VACCINE_SUGGESTIONS.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => setCampaignName(suggestion)}
                        className={cn(
                          'block w-full border-b border-slate-50 px-4 py-2.5 text-left text-sm transition-colors last:border-b-0 hover:bg-slate-50',
                          campaignName === suggestion ? 'font-bold text-ink' : 'text-ink-muted',
                        )}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="campaignName">{t('vaccines.register.campaignPicker.customLabel')}</Label>
                  <Input
                    id="campaignName"
                    className="mt-2"
                    value={campaignName}
                    onChange={(event) => setCampaignName(event.target.value)}
                    placeholder={t('vaccines.register.campaignPicker.customPlaceholder')}
                  />
                </div>
              </div>
            )}

            {choice === 'CUSTOM' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2.5">
                  <PencilIcon className="h-3.5 w-3.5 flex-shrink-0 text-amber-700" />
                  <p className="text-xs font-bold text-amber-700">{t('vaccines.register.custom.sectionLabel')}</p>
                </div>
                <div>
                  <Label htmlFor="customName">{t('vaccines.register.custom.nameLabel')}</Label>
                  <Input
                    id="customName"
                    className="mt-2"
                    value={customName}
                    onChange={(event) => setCustomName(event.target.value)}
                    placeholder={t('vaccines.register.custom.namePlaceholder')}
                  />
                </div>
                <div>
                  <Label htmlFor="customDose">{t('vaccines.register.custom.doseLabel')}</Label>
                  <Input
                    id="customDose"
                    className="mt-2"
                    value={customDose}
                    onChange={(event) => setCustomDose(event.target.value)}
                    placeholder={t('vaccines.register.custom.dosePlaceholder')}
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setStep('type')}>
                {t('vaccines.register.back')}
              </Button>
              <Button type="button" disabled={!canProceedStep1} onClick={() => setStep('details')}>
                {t('vaccines.register.continue')}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="animate-fade-in-up space-y-4" noValidate>
            <div className="flex items-center gap-3 rounded-xl bg-teal-50 px-4 py-3">
              <SyringeIcon className="h-5 w-5 flex-shrink-0 text-teal-600" />
              <p className="font-bold text-ink">{summaryName}</p>
            </div>

            <VaccineApplicationDetailsFields register={register} control={control} errors={errors} />

            {submitErrorMessage && (
              <p role="alert" className="text-destructive text-sm">
                {submitErrorMessage}
              </p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setStep('select')}>
                {t('vaccines.register.back')}
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? t('common.saving') : t('vaccines.register.submit')}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
