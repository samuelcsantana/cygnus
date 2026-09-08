// Deliberately no "schedule a reminder" checkbox here, unlike the reference
// prototype this wizard is modeled after: there is no per-record reminder
// infrastructure (BullMQ only generates general automatic reminders today),
// so a decorative checkbox with no real effect was left out on purpose.
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { VaccineDialogLayout } from './VaccineDialogLayout'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { soleBaby, useBabies } from '@/features/babies/api/babies.hooks'
import { formatDateDisplay, todayDateString } from '@/lib/date'
import { cn } from '@/lib/utils'
import { BabyPickerStep } from '@/shared/components/BabyPickerStep'
import { VaccineTypePicker, type VaccineTypeChoice } from './VaccineTypePicker'
import { BellIcon } from '@/shared/icons/bell-icon'
import { CalendarIcon } from '@/shared/icons/calendar-icon'
import { CheckIcon } from '@/shared/icons/check-icon'
import { PencilIcon } from '@/shared/icons/pencil-icon'

import { useApplyVaccine, useRegisterAdhocVaccine, useVaccineCalendar } from '../api/vaccines.hooks'
import { applyVaccineSchema, vaccineApplicationDateSchema } from '../api/vaccines.schemas'
import { CAMPAIGN_VACCINE_SUGGESTIONS } from './campaign-vaccine-suggestions'
import { VaccineApplicationDetailsFields } from './VaccineApplicationDetailsFields'

// 'confirmation' is a post-submit interstitial (not a real wizard step, so
// it's deliberately left out of the `steps` StepIndicator array below) that
// lets a parent log several historical doses in one sitting — "add another"
// loops back to 'type' instead of closing the dialog.
type Step = 'baby' | 'type' | 'select' | 'details' | 'confirmation'

const detailsFormSchema = applyVaccineSchema.extend({
  applicationDate: vaccineApplicationDateSchema,
})
type DetailsFormInput = z.infer<typeof detailsFormSchema>

interface RegisterVaccineDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RegisterVaccineDialog({ open, onOpenChange }: RegisterVaccineDialogProps) {
  const { t, i18n } = useTranslation()
  const babies = useBabies()
  const babyList = babies.data ?? []
  const needsBabyPicker = babyList.length > 1

  const initialized = useRef(false)
  const [search, setSearch] = useState('')
  const [processing, setProcessing] = useState(false)
  const [step, setStep] = useState<Step>('type')
  const [selectedBabyId, setSelectedBabyId] = useState<string | null>(null)
  const [choice, setChoice] = useState<VaccineTypeChoice | null>(null)
  const [selectedVaccineId, setSelectedVaccineId] = useState<string | null>(null)
  const [campaignName, setCampaignName] = useState('')
  const [customName, setCustomName] = useState('')
  const [customDose, setCustomDose] = useState('')
  const [lastRegisteredName, setLastRegisteredName] = useState('')

  const calendar = useVaccineCalendar(selectedBabyId)
  const pendingItems = (calendar.data?.groups ?? [])
    .flatMap((group) => group.items)
    .filter((item) => item.status !== 'APPLIED' && item.recommendationKind !== 'RECURRING')

  const applyVaccine = useApplyVaccine(selectedBabyId)
  const registerAdhocVaccine = useRegisterAdhocVaccine(selectedBabyId)
  const resetApply = applyVaccine.reset
  const resetAdhoc = registerAdhocVaccine.reset
  useEffect(() => {
    if (open) {
      resetApply()
      resetAdhoc()
    }
  }, [open, resetApply, resetAdhoc])

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<DetailsFormInput>({
    resolver: zodResolver(detailsFormSchema),
    defaultValues: { applicationDate: todayDateString() },
  })

  // Reset only when the dialog opens — not on every `babies.data` change —
  // so a late-resolving babies query doesn't wipe in-progress input/errors
  // out from under the user while the dialog is already open.
  useEffect(() => {
    if (!open) return
    setSearch('')
    setChoice(null)
    setSelectedVaccineId(null)
    setCampaignName('')
    setCustomName('')
    setCustomDose('')
    reset({ applicationDate: todayDateString() })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!open) {
      initialized.current = false
      return
    }
    if (!babies.isSuccess || initialized.current) return
    initialized.current = true
    const sole = soleBaby(babies.data)
    setSelectedBabyId(sole?.id ?? null)
    setStep(babyList.length > 1 ? 'baby' : 'type')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, babies.data, babies.isSuccess])

  const selectedVaccine = pendingItems.find((item) => item.vaccineId === selectedVaccineId) ?? null

  const canProceedStep1 =
    choice === 'CATALOG'
      ? !!selectedVaccine && !calendar.isPending && !calendar.isError
      : choice === 'CAMPAIGN'
        ? !!campaignName.trim()
        : choice === 'CUSTOM'
          ? !!customName.trim()
          : false

  const mutation = choice === 'CATALOG' ? applyVaccine : registerAdhocVaccine

  const summaryName =
    choice === 'CATALOG' ? (selectedVaccine?.name ?? '') : choice === 'CAMPAIGN' ? campaignName : customName

  const onSubmit = handleSubmit(async (values) => {
    if (!selectedBabyId || !canProceedStep1 || processing) return
    if (values.applicationDate < (babyList.find((baby) => baby.id === selectedBabyId)?.birthDate ?? '')) {
      setError('applicationDate', { type: 'custom', message: 'vaccines.editor.dateError' })
      return
    }
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
      toast.success(t('vaccines.register.successToast'))
      setLastRegisteredName(summaryName)
      setStep('confirmation')
    } catch {
      // surfaced below via mutation.error
    }
  })

  // Loops back to the type step instead of closing the dialog, so a parent
  // catching up on several historical doses doesn't have to reopen it each
  // time — only the vaccine-specific selections reset; the chosen baby stays.
  const handleAddAnother = () => {
    setChoice(null)
    setSelectedVaccineId(null)
    setCampaignName('')
    setCustomName('')
    setCustomDose('')
    reset({ applicationDate: todayDateString() })
    applyVaccine.reset()
    registerAdhocVaccine.reset()
    setStep('type')
  }

  const submitErrorMessage = mutation.error ? t('vaccines.register.genericError') : null

  const steps = [
    { id: 'select', label: t('vaccines.editor.vaccine') },
    { id: 'details', label: t('vaccines.editor.application') },
  ]

  const busy = mutation.isPending || isSubmitting || processing
  const applicationDate = watch('applicationDate')
  const selectedBaby = babyList.find((baby) => baby.id === selectedBabyId)
  const dirty = step !== 'confirmation' && (!!choice || isDirty)
  const footer = (close: () => void) => {
    if (step === 'confirmation')
      return (
        <>
          <Button variant="outline" onClick={close}>
            {t('vaccines.register.addAnother.done')}
          </Button>
          <Button onClick={handleAddAnother}>{t('vaccines.register.addAnother.action')}</Button>
        </>
      )
    return (
      <>
        <Button
          type="button"
          variant="ghost"
          disabled={busy}
          onClick={() => {
            if (step === 'details') setStep('select')
            else if (step === 'select') setStep('type')
            else if (step === 'type' && needsBabyPicker) setStep('baby')
            else close()
          }}
        >
          {t(
            step === 'details' || step === 'select' || (step === 'type' && needsBabyPicker)
              ? 'vaccines.register.back'
              : 'common.cancel',
          )}
        </Button>
        {step === 'details' ? (
          <Button key="save" type="submit" form="register-vaccine-form" disabled={busy}>
            {t(busy ? 'common.saving' : 'vaccines.register.submit')}
          </Button>
        ) : (
          step !== 'type' && (
            <Button
              key="continue"
              type="button"
              disabled={busy || (step === 'baby' ? !selectedBabyId : !canProceedStep1)}
              onClick={() => setStep(step === 'baby' ? 'type' : 'details')}
            >
              {t('vaccines.register.continue')}
            </Button>
          )
        )}
      </>
    )
  }
  return (
    <VaccineDialogLayout
      open={open}
      onOpenChange={onOpenChange}
      title={t('vaccines.register.title')}
      baby={selectedBaby}
      vaccine={
        step === 'confirmation'
          ? lastRegisteredName
          : step === 'type' || step === 'baby'
            ? undefined
            : summaryName
      }
      dose={
        choice === 'CATALOG' && selectedVaccine
          ? t('vaccines.doseLabel', { count: selectedVaccine.doseNumber })
          : choice === 'CUSTOM'
            ? customDose
            : undefined
      }
      date={applicationDate ? formatDateDisplay(applicationDate, i18n.language) : undefined}
      stage={step}
      dirty={dirty}
      busy={busy}
      footer={footer}
      progress={
        step !== 'confirmation' && (
          <ol className="flex gap-6">
            {steps.map((item, index) => (
              <li
                key={item.id}
                aria-current={(step === 'details' ? 'details' : 'select') === item.id ? 'step' : undefined}
                className={cn(
                  'flex items-center gap-2 text-sm font-semibold',
                  (step === 'details' ? 'details' : 'select') === item.id ? 'text-primary' : 'text-ink-muted',
                )}
              >
                <span className="text-xs">0{index + 1}</span>
                {item.label}
              </li>
            ))}
          </ol>
        )
      }
    >
      {babies.isPending ? (
        <p role="status">{t('common.loading')}</p>
      ) : babies.isError ? (
        <div role="alert">
          <p>{t('vaccines.editor.loadError')}</p>
          <Button onClick={() => void babies.refetch()}>{t('vaccines.editor.retry')}</Button>
        </div>
      ) : babyList.length === 0 ? (
        <p>{t('vaccines.editor.noChildren')}</p>
      ) : (
        <>
          {step === 'baby' ? (
            <div className="animate-fade-in-up space-y-5">
              <BabyPickerStep
                babies={babyList}
                value={selectedBabyId}
                onSelect={(id) => {
                  setSelectedBabyId(id)
                  setSelectedVaccineId(null)
                  setChoice(null)
                  setSearch('')
                }}
              />
            </div>
          ) : step === 'type' ? (
            <div className="animate-fade-in-up space-y-5">
              <VaccineTypePicker
                onSelect={(value) => {
                  setChoice(value)
                  setStep('select')
                }}
              />
            </div>
          ) : step === 'select' ? (
            <div className="animate-fade-in-up space-y-5">
              {choice === 'CATALOG' && (
                <div className="overflow-hidden rounded-2xl border border-emerald-100">
                  <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-2.5">
                    <CalendarIcon className="h-3.5 w-3.5 flex-shrink-0 text-emerald-700 dark:text-emerald-300" />
                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                      {t('vaccines.register.catalogPicker.label')}
                    </p>
                  </div>
                  <div className="p-3">
                    <Label htmlFor="vaccineSearch" className="sr-only">
                      {t('vaccines.editor.search')}
                    </Label>
                    <Input
                      id="vaccineSearch"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder={t('vaccines.editor.search')}
                    />
                  </div>
                  {calendar.isSuccess &&
                    pendingItems.length > 0 &&
                    !pendingItems.some((item) =>
                      item.name
                        .toLocaleLowerCase(i18n.language)
                        .includes(search.trim().toLocaleLowerCase(i18n.language)),
                    ) && (
                      <p role="status" className="p-4 text-sm text-ink-muted">
                        {t('vaccines.editor.noResults')}
                      </p>
                    )}
                  <div className="divide-y divide-border">
                    {calendar.isPending ? (
                      <p role="status" className="p-4 text-sm text-ink-muted">
                        {t('common.loading')}
                      </p>
                    ) : calendar.isError ? (
                      <div role="alert" className="space-y-3 p-4">
                        <p>{t('vaccines.editor.loadError')}</p>
                        <Button type="button" variant="outline" onClick={() => void calendar.refetch()}>
                          {t('vaccines.editor.retry')}
                        </Button>
                      </div>
                    ) : pendingItems.length === 0 ? (
                      <p className="p-4 text-center text-sm text-ink-muted">
                        {t('vaccines.register.catalogPicker.empty')}
                      </p>
                    ) : (
                      pendingItems
                        .filter((item) =>
                          item.name
                            .toLocaleLowerCase(i18n.language)
                            .includes(search.trim().toLocaleLowerCase(i18n.language)),
                        )
                        .map((item) => (
                          <button
                            key={item.vaccineId}
                            aria-pressed={selectedVaccineId === item.vaccineId}
                            type="button"
                            onClick={() => setSelectedVaccineId(item.vaccineId)}
                            className={cn(
                              'flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-muted',
                              selectedVaccineId === item.vaccineId &&
                                'bg-emerald-50/60 dark:bg-emerald-950/40',
                            )}
                          >
                            <span
                              className={cn(
                                'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[10px] text-sm font-extrabold',
                                item.status === 'DELAYED'
                                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300',
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
                                item.status === 'DELAYED'
                                  ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300'
                                  : 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300',
                              )}
                            >
                              {item.status === 'DELAYED'
                                ? t('vaccines.status.delayed')
                                : item.status === 'GUIDANCE'
                                  ? t('vaccines.status.guidance')
                                  : t('vaccines.status.pending')}
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
                    <div className="flex items-center gap-2 bg-violet-50 dark:bg-violet-950/40 px-4 py-2.5">
                      <BellIcon className="h-3.5 w-3.5 flex-shrink-0 text-violet-700 dark:text-violet-300" />
                      <p className="text-xs font-bold text-violet-700 dark:text-violet-300">
                        {t('vaccines.register.campaignPicker.suggestedLabel')}
                      </p>
                    </div>
                    {/* Chips que quebram linha, no lugar da lista rolável de
                      `max-h-40` que estava aqui: as oito sugestões cabem todas
                      na tela ao mesmo tempo, e antes se viam quatro por vez.
                      Numa lista fechada e curta, rolagem esconde metade das
                      opções atrás de um gesto — e quem não rola conclui que as
                      quatro visíveis são tudo o que há.

                      Vem da referência `LoginAndDashboardDesign`, que sugere os
                      nomes do PNI em chips ao lado do campo. Aqui os nomes do
                      calendário público já são um passo próprio deste diálogo
                      (o `CATALOG`, com o calendário real da criança), então o
                      padrão de chip entra onde ele de fato faltava: a campanha,
                      que é texto livre com um punhado de valores prováveis.

                      `aria-pressed` e não `aria-selected`: é o mesmo tipo de
                      botão de alternância dos filtros de status da tela de
                      vacinas, e ganha aqui o mesmo tratamento. */}
                    <div className="flex flex-wrap gap-2 p-4">
                      {CAMPAIGN_VACCINE_SUGGESTIONS.map((suggestion) => {
                        const isSelected = campaignName === suggestion
                        return (
                          <button
                            key={suggestion}
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() => setCampaignName(isSelected ? '' : suggestion)}
                            className={cn(
                              'rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors',
                              isSelected
                                ? 'bg-violet-600 text-white'
                                : 'bg-muted text-ink-muted hover:bg-violet-50 hover:text-violet-700 dark:hover:bg-violet-950/40 dark:hover:text-violet-300',
                            )}
                          >
                            {suggestion}
                          </button>
                        )
                      })}
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
                  <div className="flex items-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 px-4 py-2.5">
                    <PencilIcon className="h-3.5 w-3.5 flex-shrink-0 text-amber-700 dark:text-amber-300" />
                    <p className="text-xs font-bold text-amber-700 dark:text-amber-300">
                      {t('vaccines.register.custom.sectionLabel')}
                    </p>
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
            </div>
          ) : step === 'details' ? (
            <form
              id="register-vaccine-form"
              onSubmit={onSubmit}
              className="animate-fade-in-up space-y-4"
              noValidate
            >
              <VaccineApplicationDetailsFields
                register={register}
                control={control}
                errors={errors}
                onProcessingChange={setProcessing}
              />

              {submitErrorMessage && (
                <p role="alert" className="text-destructive text-sm">
                  {submitErrorMessage}
                </p>
              )}
            </form>
          ) : (
            // Post-submit interstitial (item 13): lets a parent log several
            // historical doses in one sitting instead of closing/reopening the
            // dialog for each one.
            <div className="animate-fade-in-up space-y-5 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                <CheckIcon className="h-7 w-7" />
              </div>
              <div>
                <p className="font-display text-lg font-extrabold text-ink">
                  {t('vaccines.register.addAnother.title', { name: lastRegisteredName })}
                </p>
                <p className="mt-1 text-sm text-ink-muted">{t('vaccines.register.addAnother.prompt')}</p>
              </div>
            </div>
          )}
        </>
      )}
    </VaccineDialogLayout>
  )
}
