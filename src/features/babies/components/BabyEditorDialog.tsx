import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAgeLabel } from '@/hooks/useAgeLabel'
import { formatDateDisplay, parseDateString, splitScheduledAt, todayDateString } from '@/lib/date'
import { AvatarUploadField } from '@/shared/components/AvatarUploadField'
import { DatePickerField } from '@/shared/components/DatePickerField'
import { CloseIcon } from '@/shared/icons/close-icon'
import { LogoIcon } from '@/shared/icons/logo-icon'
import { babyInitials } from '@/shared/utils/babyAvatarColor'
import { formatCentimeters, formatKilograms } from '@/shared/utils/measurements'
import type { GrowthPoint } from '@/features/growth/api/growth.selectors'

import { babyFormSchema, type Baby, type BabyFormInput } from '../api/babies.schemas'
import { BabyHealthFields } from './BabyHealthFields'
import { BabyProfileFields } from './BabyProfileFields'

type Section = 'profile' | 'health' | 'guardians'
interface BabyEditorDialogProps {
  open: boolean
  baby?: Baby
  onOpenChange: (open: boolean) => void
  onSave: (values: BabyFormInput) => Promise<void>
  management?: ReactNode
  busy?: boolean
  latestMeasurement?: GrowthPoint | null
}

export function BabyEditorDialog({
  open,
  baby,
  onOpenChange,
  onSave,
  management,
  busy,
  latestMeasurement,
}: BabyEditorDialogProps) {
  const { t, i18n } = useTranslation()
  const ageLabel = useAgeLabel()
  const [section, setSection] = useState<Section>('profile')
  const [discard, setDiscard] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [submitError, setSubmitError] = useState(false)
  const [addingMeasurement, setAddingMeasurement] = useState(!baby)
  const heading = useRef<HTMLHeadingElement>(null)
  const form = useForm<BabyFormInput>({
    resolver: zodResolver(babyFormSchema),
    defaultValues: {
      name: baby?.name ?? '',
      birthDate: baby?.birthDate ?? '',
      sexAtBirth: baby?.sexAtBirth ?? undefined,
      bloodType: baby?.bloodType ?? undefined,
      allergies: baby?.allergies ?? [],
      healthPlanName: baby?.healthPlanName ?? '',
      healthPlanNumber: baby?.healthPlanNumber ?? '',
      avatarUrl: baby?.avatarUrl ?? '',
      avatarColor: baby?.avatarColor || '#16745B',
      weightKg: '',
      heightCm: '',
      measuredOn: todayDateString(),
    },
  })
  const {
    register,
    control,
    handleSubmit,
    trigger,
    setValue,
    formState: { errors, isDirty, isSubmitting },
  } = form
  const [name, birthDate, avatarUrl, avatarColor] = useWatch({
    control,
    name: ['name', 'birthDate', 'avatarUrl', 'avatarColor'],
  })
  const locked = isSubmitting || processing || busy
  const requestClose = () => {
    if (locked) return
    if (isDirty) setDiscard(true)
    else onOpenChange(false)
  }
  useEffect(() => {
    heading.current?.focus()
  }, [section])
  const continueToHealth = async () => {
    if (await trigger(['name', 'birthDate', 'avatarUrl'], { shouldFocus: true })) setSection('health')
  }
  const save = handleSubmit(
    async (values) => {
      if (locked) return
      setSubmitError(false)
      try {
        await onSave(values)
      } catch {
        setSubmitError(true)
      }
    },
    (invalid) => {
      setSection(invalid.name || invalid.birthDate || invalid.avatarUrl ? 'profile' : 'health')
    },
  )
  const sections: Section[] = baby ? ['profile', 'health', 'guardians'] : ['profile', 'health']

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) requestClose()
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="grid h-[min(660px,calc(100dvh-32px))] max-h-none grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden p-0 sm:max-w-[880px] md:grid-cols-[280px_minmax(0,1fr)] md:grid-rows-1"
          onOpenAutoFocus={(event) => {
            event.preventDefault()
            heading.current?.focus()
          }}
        >
          <aside className="relative flex min-w-0 flex-col bg-emerald-900 px-5 py-4 text-white md:px-7 md:py-8">
            <div className="mb-8 hidden items-center gap-2 text-sm font-bold text-white/80 md:flex">
              <LogoIcon className="size-6" /> Ninho
            </div>
            <AvatarUploadField
              id="avatarUrl"
              className="gap-3 md:flex-col md:items-start md:gap-5 [&>div:last-child]:flex-none"
              value={avatarUrl}
              onValueChange={(value) => setValue('avatarUrl', value, { shouldDirty: true })}
              fallback={
                <span className="text-3xl font-extrabold md:text-4xl">{babyInitials(name || '') || 'N'}</span>
              }
              color={avatarColor}
              onColorChange={(value) => setValue('avatarColor', value || '#16745B', { shouldDirty: true })}
              colorOptions={['#16745B', '#A95318', '#B83F52', '#6950C7'].map((value, index) => ({
                value,
                label: t('babies.form.avatarColorOption', { number: index + 1 }),
              }))}
              colorGroupLabel={t('babies.form.avatarColorGroupLabel')}
              uploadLabel={t('babies.form.avatarUploadAria')}
              removeLabel={t('babies.form.avatarRemove')}
              fileTooLargeError={t('babies.form.avatarFileTooLarge')}
              invalidImageError={t('babies.form.avatarInvalidImage')}
              disabled={locked}
              onProcessingChange={setProcessing}
            />
            <p className="mt-4 truncate font-display text-xl font-extrabold md:mt-7 md:whitespace-normal md:break-words md:text-3xl">
              {name?.trim() || t('babies.editor.previewName')}
            </p>
            <p className="mt-1 text-sm text-white/80">
              {birthDate && parseDateString(birthDate) && birthDate <= todayDateString()
                ? ageLabel(birthDate)
                : t('babies.editor.previewHint')}
            </p>
            <div className="mt-auto hidden border-t border-white/20 pt-6 md:block">
              <p className="text-sm font-semibold">{t('babies.editor.identityTitle')}</p>
              <p className="mt-2 text-sm leading-relaxed text-white/75">{t('babies.editor.identityHint')}</p>
            </div>
          </aside>
          <div className="flex min-h-0 min-w-0 flex-col">
            <header className="shrink-0 border-b border-border px-5 pt-5 md:px-8 md:pt-7">
              <button
                type="button"
                aria-label={t('common.close')}
                disabled={locked}
                onClick={requestClose}
                className="absolute top-2 right-2 flex size-11 items-center justify-center rounded-full bg-background text-ink-muted hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-40"
              >
                <CloseIcon className="size-4" />
              </button>
              <DialogTitle className="pr-8 font-display text-xl font-extrabold md:text-2xl">
                {t(baby ? 'babies.edit.title' : 'babies.form.title')}
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm">{t('babies.editor.subtitle')}</DialogDescription>
              <nav aria-label={t('babies.editor.sections')} className="mt-4 flex gap-4 md:gap-6">
                {sections.map((item, index) => (
                  <button
                    key={item}
                    type="button"
                    disabled={locked}
                    aria-current={section === item ? 'step' : undefined}
                    onClick={() => {
                      if (!baby && item === 'health') void continueToHealth()
                      else setSection(item)
                    }}
                    className={`min-h-11 border-b-2 pb-2 text-sm font-semibold transition-colors ${section === item ? 'border-primary text-primary' : 'border-transparent text-ink-muted hover:text-ink'}`}
                  >
                    <span className="mr-1.5 text-xs">0{index + 1}</span>
                    {t(`babies.editor.${item}`)}
                  </button>
                ))}
              </nav>
            </header>
            <form
              onSubmit={(event) => {
                if (!baby && section === 'profile') {
                  event.preventDefault()
                  void continueToHealth()
                } else void save(event)
              }}
              noValidate
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 md:px-8 md:py-6">
                <h2 ref={heading} tabIndex={-1} className="mb-1 font-display text-lg font-bold outline-none">
                  {t(`babies.editor.${section}Title`)}
                </h2>
                <p className="mb-5 text-sm leading-relaxed text-ink-muted">
                  {t(`babies.editor.${section}Hint`)}
                </p>
                <fieldset disabled={locked} className="min-w-0 space-y-6 disabled:opacity-60">
                  {section === 'profile' && (
                    <BabyProfileFields register={register} control={control} errors={errors} hideAvatar />
                  )}
                  {section === 'health' && (
                    <>
                      {baby && (
                        <div className="rounded-2xl border border-border bg-muted/40 p-4">
                          <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                            {t('babies.editor.lastMeasurement')}
                          </p>
                          {latestMeasurement ? (
                            <>
                              <p className="mt-2 text-lg font-bold">
                                {[
                                  latestMeasurement.weightGrams !== null
                                    ? formatKilograms(latestMeasurement.weightGrams, i18n.language)
                                    : null,
                                  latestMeasurement.heightMillimeters !== null
                                    ? formatCentimeters(latestMeasurement.heightMillimeters, i18n.language)
                                    : null,
                                ]
                                  .filter(Boolean)
                                  .join(' · ')}
                              </p>
                              <p className="mt-1 text-xs text-ink-muted">
                                {formatDateDisplay(
                                  splitScheduledAt(latestMeasurement.scheduledAt).date,
                                  i18n.language,
                                )}
                              </p>
                            </>
                          ) : (
                            <p className="mt-2 text-sm text-ink-muted">{t('babies.editor.noMeasurement')}</p>
                          )}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-3"
                            onClick={() => {
                              setAddingMeasurement(!addingMeasurement)
                              if (addingMeasurement) {
                                setValue('weightKg', '', { shouldDirty: true })
                                setValue('heightCm', '', { shouldDirty: true })
                              }
                            }}
                          >
                            {t(
                              addingMeasurement
                                ? 'babies.editor.cancelMeasurement'
                                : 'babies.editor.addMeasurement',
                            )}
                          </Button>
                        </div>
                      )}
                      {addingMeasurement && (
                        <div className="space-y-4 rounded-2xl border border-border p-4">
                          <p className="text-sm font-bold">{t('babies.editor.measurements')}</p>
                          <div className="grid grid-cols-2 gap-4">
                            {(['weightKg', 'heightCm'] as const).map((field) => (
                              <div key={field}>
                                <Label htmlFor={field}>{t(`babies.editor.${field}`)}</Label>
                                <Input
                                  id={field}
                                  inputMode="decimal"
                                  placeholder={field === 'weightKg' ? '3,5' : '50'}
                                  className="mt-2"
                                  {...register(field)}
                                  aria-invalid={!!errors[field]}
                                  aria-describedby={errors[field] ? `${field}-error` : undefined}
                                />
                                {errors[field] && (
                                  <p id={`${field}-error`} className="mt-1 text-xs text-destructive">
                                    {t(`babies.editor.${field}Error`)}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                          <div>
                            <Label htmlFor="measuredOn">{t('babies.editor.measuredOn')}</Label>
                            <Controller
                              control={control}
                              name="measuredOn"
                              render={({ field }) => (
                                <DatePickerField
                                  id="measuredOn"
                                  value={field.value ?? ''}
                                  onValueChange={field.onChange}
                                  className="mt-2"
                                  aria-invalid={!!errors.measuredOn}
                                  aria-describedby={errors.measuredOn ? 'measuredOn-error' : undefined}
                                />
                              )}
                            />
                            {errors.measuredOn && (
                              <p id="measuredOn-error" className="mt-1 text-xs text-destructive">
                                {t('babies.editor.dateError')}
                              </p>
                            )}
                          </div>
                          <p className="text-xs leading-relaxed text-ink-muted">
                            {t('babies.editor.measurementsHint')}
                          </p>
                        </div>
                      )}
                      <BabyHealthFields control={control} />
                    </>
                  )}
                  {section === 'guardians' && management}
                </fieldset>
              </div>
              <footer className="shrink-0 border-t border-border bg-background px-5 py-4 md:px-8">
                {submitError && (
                  <p role="alert" className="mb-3 text-sm text-destructive">
                    {t('babies.form.genericError')}
                  </p>
                )}
                <div className="flex items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={locked}
                    onClick={() => {
                      if (!baby && section === 'health') setSection('profile')
                      else requestClose()
                    }}
                  >
                    {t(!baby && section === 'health' ? 'babies.wizard.back' : 'common.cancel')}
                  </Button>
                  {!baby && section === 'profile' ? (
                    <Button
                      key="continue"
                      type="button"
                      disabled={locked}
                      onClick={() => void continueToHealth()}
                    >
                      {t('babies.wizard.continue')}
                    </Button>
                  ) : (
                    <Button key="save" type="submit" disabled={locked}>
                      {t(isSubmitting ? 'common.saving' : baby ? 'babies.edit.submit' : 'babies.form.submit')}
                    </Button>
                  )}
                </div>
              </footer>
            </form>
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog open={discard} onOpenChange={setDiscard}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('babies.editor.discardTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('babies.editor.discardHint')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('babies.editor.keepEditing')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => onOpenChange(false)}>
              {t('babies.editor.discard')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
