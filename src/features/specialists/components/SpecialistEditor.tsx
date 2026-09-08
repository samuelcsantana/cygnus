import { zodResolver } from '@hookform/resolvers/zod'
import { useRef, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Baby } from '@/features/babies/api/babies.schemas'
import { AutocompleteInput } from '@/shared/components/AutocompleteInput'
import { CloseIcon } from '@/shared/icons/close-icon'
import { StethoscopeIcon } from '@/shared/icons/stethoscope-icon'
import type { CoGuardian } from '../api/specialists.hooks'
import {
  specialistFormSchema,
  type Specialist,
  type SpecialistFormInput,
} from '../api/specialists.schemas'
import { SpecialistAccessFields } from './SpecialistAccessFields'

export interface SpecialistEditorProps {
  specialist?: Specialist | null
  babies: Baby[]
  guardians: CoGuardian[]
  specialties: string[]
  babiesLoading?: boolean
  babiesError?: boolean
  guardiansLoading?: boolean
  guardiansError?: boolean
  specialtiesLoading?: boolean
  specialtiesError?: boolean
  retryBabies: () => void
  retryGuardians: () => void
  retrySpecialties: () => void
  onOpenChange: (open: boolean) => void
  onSave: (input: SpecialistFormInput) => Promise<void>
}

export function SpecialistEditor(props: SpecialistEditorProps) {
  const { t } = useTranslation()
  const { specialist, babies } = props
  const heading = useRef<HTMLHeadingElement>(null)
  const [discard, setDiscard] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<SpecialistFormInput>({
    resolver: zodResolver(specialistFormSchema),
    defaultValues: {
      name: specialist?.name ?? '',
      specialty: specialist?.specialty ?? '',
      phone: specialist?.phone ?? '',
      babyIds: specialist?.babyIds ?? [],
      sharedWithUserIds: specialist?.sharedWithUserIds ?? [],
    },
  })
  const [name, specialty, phone, babyIds] = useWatch({
    control,
    name: ['name', 'specialty', 'phone', 'babyIds'],
  })
  const selectedBabies = babies.filter((baby) => babyIds.includes(baby.id))
  const close = () => {
    if (isSubmitting) return
    if (isDirty) setDiscard(true)
    else props.onOpenChange(false)
  }
  const save = handleSubmit(async (input) => {
    setSaveError(false)
    try {
      await props.onSave(input)
    } catch {
      setSaveError(true)
      return
    }
    toast.success(t(specialist ? 'specialists.updateSuccessToast' : 'specialists.addSuccessToast'))
    props.onOpenChange(false)
  })
  return (
    <>
      <Dialog
        open
        onOpenChange={(open) => {
          if (!open) close()
        }}
      >
        <DialogContent
          showCloseButton={false}
          onOpenAutoFocus={(event) => {
            event.preventDefault()
            heading.current?.focus()
          }}
          className="grid h-[min(680px,calc(100dvh-32px))] grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden p-0 sm:max-w-[900px] md:grid-cols-[280px_minmax(0,1fr)] md:grid-rows-1"
        >
          <aside className="flex min-w-0 flex-col bg-emerald-950 px-5 py-4 text-white md:px-7 md:py-8">
            <div className="mb-8 hidden items-center gap-3 md:flex">
              <StethoscopeIcon className="size-6" />
              <span className="font-bold">{t('specialists.editor.contact')}</span>
            </div>
            <p className="pr-10 font-display text-lg font-extrabold break-words line-clamp-2 md:pr-0 md:text-3xl">
              {name.trim() || t('specialists.editor.preview')}
            </p>
            <p className="mt-1 break-words text-sm text-white/80 line-clamp-2">
              {specialty || t('specialists.editor.specialtyPreview')}
            </p>
            {phone && (
              <p className="mt-3 hidden break-words font-mono text-sm text-white/80 md:block">
                {phone}
              </p>
            )}
            <div className="mt-7 hidden space-y-3 md:block">
              <p className="text-xs font-bold uppercase tracking-wider text-white/80">
                {t('specialists.editor.children')}
              </p>
              <p className="break-words text-sm line-clamp-4">
                {selectedBabies.map((baby) => baby.name).join(', ') ||
                  t(
                    babyIds.length
                      ? 'specialists.editor.linkedChildren'
                      : 'specialists.editor.noLinks',
                  )}
              </p>
            </div>
            <div className="mt-auto hidden border-t border-white/20 pt-6 md:block">
              <p className="font-semibold">{t('specialists.editor.railTitle')}</p>
              <p className="mt-2 text-sm leading-relaxed text-white/80">
                {t('specialists.editor.railHint')}
              </p>
            </div>
          </aside>
          <div className="flex min-h-0 min-w-0 flex-col">
            <header className="shrink-0 border-b border-border px-5 py-5 md:px-8 md:py-6">
              <button
                type="button"
                onClick={close}
                disabled={isSubmitting}
                aria-label={t('common.close')}
                className="absolute top-2 right-2 flex size-11 items-center justify-center rounded-full bg-background text-ink-muted hover:bg-muted disabled:opacity-50"
              >
                <CloseIcon className="size-4" />
              </button>
              <DialogTitle
                ref={heading}
                tabIndex={-1}
                className="pr-8 font-display text-xl font-extrabold outline-none md:text-2xl"
              >
                {t(specialist ? 'specialists.editTitle' : 'specialists.addTitle')}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {t('specialists.dialogSubtitle')}
              </DialogDescription>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 md:px-8 md:py-6">
              <form id="specialist-editor-form" onSubmit={save} noValidate>
                <fieldset disabled={isSubmitting} className="min-w-0 space-y-6 disabled:opacity-60">
                  <section aria-labelledby="specialist-details" className="space-y-4">
                    <h3 id="specialist-details" className="font-semibold">
                      {t('specialists.editor.details')}
                    </h3>
                    <div>
                      <Label htmlFor="specialist-name">{t('specialists.nameLabel')}</Label>
                      <Input
                        id="specialist-name"
                        className="mt-2"
                        autoComplete="off"
                        placeholder={t('specialists.namePlaceholder')}
                        aria-required="true"
                        aria-invalid={!!errors.name}
                        aria-describedby={errors.name ? 'specialist-name-error' : undefined}
                        {...register('name')}
                      />
                      {errors.name && (
                        <p id="specialist-name-error" className="mt-1 text-sm text-destructive">
                          {t('specialists.editor.nameRequired')}
                        </p>
                      )}
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor="specialist-specialty">
                          {t('specialists.specialtyLabel')}{' '}
                          <span className="text-ink-muted">{t('specialists.editor.optional')}</span>
                        </Label>
                        <Controller
                          control={control}
                          name="specialty"
                          render={({ field }) => (
                            <AutocompleteInput
                              id="specialist-specialty"
                              className="mt-2"
                              placeholder={t('specialists.specialtyPlaceholder')}
                              value={field.value ?? ''}
                              onValueChange={field.onChange}
                              onBlur={field.onBlur}
                              suggestions={props.specialties}
                            />
                          )}
                        />
                      </div>
                      <div>
                        <Label htmlFor="specialist-phone">
                          {t('specialists.phoneLabel')}{' '}
                          <span className="text-ink-muted">{t('specialists.editor.optional')}</span>
                        </Label>
                        <Input
                          id="specialist-phone"
                          type="tel"
                          className="mt-2 font-mono"
                          placeholder={t('specialists.phonePlaceholder')}
                          {...register('phone')}
                        />
                      </div>
                    </div>
                    {props.specialtiesLoading && (
                      <p role="status" className="text-sm text-ink-muted">
                        {t('specialists.editor.specialtiesLoading')}
                      </p>
                    )}
                    {props.specialtiesError && (
                      <div role="alert" className="space-y-2 text-sm">
                        <p>{t('specialists.editor.specialtiesError')}</p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={props.retrySpecialties}
                        >
                          {t('specialists.editor.retry')}
                        </Button>
                      </div>
                    )}
                  </section>
                  <SpecialistAccessFields {...props} control={control} />
                  {saveError && (
                    <p role="alert" className="text-sm text-destructive">
                      {t('specialists.genericError')}
                    </p>
                  )}
                </fieldset>
              </form>
            </div>
            <footer className="shrink-0 border-t border-border bg-background px-5 py-4 md:px-8">
              <div className="flex items-center justify-between gap-3">
                <Button type="button" variant="ghost" disabled={isSubmitting} onClick={close}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" form="specialist-editor-form" disabled={isSubmitting}>
                  {t(
                    isSubmitting
                      ? 'common.saving'
                      : specialist
                        ? 'specialists.editor.saveChanges'
                        : 'specialists.editor.add',
                  )}
                </Button>
              </div>
            </footer>
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog open={discard} onOpenChange={setDiscard}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('specialists.editor.discardTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('specialists.editor.discardHint')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('specialists.editor.keepEditing')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => props.onOpenChange(false)}>
              {t('specialists.editor.discard')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
