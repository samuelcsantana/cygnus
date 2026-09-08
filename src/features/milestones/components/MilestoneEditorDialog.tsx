import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
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
import { useBabies } from '@/features/babies/api/babies.hooks'
import type { Baby } from '@/features/babies/api/babies.schemas'
import { formatDateDisplay, todayDateString } from '@/lib/date'
import { BabyPickerStep } from '@/shared/components/BabyPickerStep'
import {
  useCreateMilestone,
  useUpdateMilestone,
  useUploadMilestonePhoto,
} from '../api/milestones.hooks'
import {
  createMilestoneFormSchema,
  type Milestone,
  type MilestoneFormInput,
  type MilestoneCategory,
} from '../api/milestones.schemas'
import { MilestoneDialogLayout } from './MilestoneDialogLayout'
import { MilestoneCoreFields } from './MilestoneCoreFields'
import { MilestoneDetailFields } from './MilestoneDetailFields'
import { MILESTONE_SUGGESTIONS } from './milestone-suggestions'
import { MILESTONE_CATEGORY_META } from './category-meta'

type Suggestion = { title: string; category: MilestoneCategory }
const EMPTY_BABIES: Baby[] = []
export function MilestoneEditorDialog({
  milestone,
  suggestion,
  providedBabies,
  onOpenChange,
}: {
  milestone?: Milestone
  suggestion?: Suggestion
  providedBabies?: Baby[]
  onOpenChange: (open: boolean) => void
}) {
  const { t, i18n } = useTranslation()
  const babiesQuery = useBabies()
  const babies = providedBabies ?? babiesQuery.data ?? EMPTY_BABIES
  const ready = !!providedBabies || babiesQuery.isSuccess
  const [babyId, setBabyId] = useState<string | null>(milestone?.babyId ?? null)
  const [step, setStep] = useState<'baby' | 'core' | 'details'>(milestone ? 'core' : 'baby')
  const initialized = useRef(!!milestone)
  useEffect(() => {
    if (initialized.current || !ready) return
    initialized.current = true
    if (babies.length === 1) {
      setBabyId(babies[0]!.id)
      setStep('core')
    }
  }, [babies, ready])
  const baby = babies.find((item) => item.id === babyId)
  const create = useCreateMilestone(babyId)
  const update = useUpdateMilestone(babyId ?? '', milestone?.id ?? '')
  const upload = useUploadMilestonePhoto()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const uploaded = useRef<{ file: File; url: string } | null>(null)
  const [replacement, setReplacement] = useState<Suggestion | null>(null)
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    control,
    setValue,
    trigger,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<MilestoneFormInput>({
    resolver: zodResolver(createMilestoneFormSchema(baby?.birthDate ?? todayDateString())),
    defaultValues: {
      title: milestone?.title ?? suggestion?.title ?? '',
      category: milestone?.category ?? suggestion?.category,
      achievedAt: milestone?.achievedAt ?? '',
      description: milestone?.description ?? '',
      photoUrl: milestone?.photoUrl ?? '',
    },
  })
  const [title, category, achievedAt, description, photoUrl] = useWatch({
    control,
    name: ['title', 'category', 'achievedAt', 'description', 'photoUrl'],
  })
  const busy = isSubmitting || upload.isPending || create.isPending || update.isPending
  const applySuggestion = (value: Suggestion) => {
    setValue('title', value.title, { shouldDirty: true })
    setValue('category', value.category, { shouldDirty: true })
    setReplacement(null)
  }
  const advance = async () => {
    if (await trigger(['title', 'achievedAt', 'category'], { shouldFocus: true }))
      setStep('details')
  }
  const save = handleSubmit(
    async (values) => {
      if (!baby || busy) return
      setError(null)
      let url = values.photoUrl
      if (file) {
        if (uploaded.current?.file === file) url = uploaded.current.url
        else {
          try {
            url = await upload.mutateAsync(file)
            uploaded.current = { file, url }
          } catch {
            setError('milestones.form.photoUploadError')
            return
          }
        }
      }
      try {
        if (milestone) await update.mutateAsync({ ...values, photoUrl: url })
        else await create.mutateAsync({ ...values, photoUrl: url })
      } catch {
        setError('milestones.form.genericError')
        return
      }
      toast.success(t(milestone ? 'milestones.edit.successToast' : 'milestones.form.successToast'))
      onOpenChange(false)
    },
    (invalid) =>
      setStep(invalid.title || invalid.category || invalid.achievedAt ? 'core' : 'details'),
  )
  return (
    <>
      <MilestoneDialogLayout
        open
        onOpenChange={onOpenChange}
        title={t(milestone ? 'milestones.edit.title' : 'milestones.form.createTitle')}
        baby={baby}
        moment={title}
        categoryClassName={category ? MILESTONE_CATEGORY_META[category].badgeClass : undefined}
        category={
          category
            ? `${MILESTONE_CATEGORY_META[category].emoji} ${t(`milestones.category.${category.toLowerCase()}`)}`
            : undefined
        }
        date={achievedAt ? formatDateDisplay(achievedAt, i18n.language) : undefined}
        description={description}
        photo={preview ?? photoUrl}
        stage={step}
        dirty={isDirty || !!file}
        busy={busy}
        progress={
          <ol className="flex flex-wrap gap-x-5 gap-y-2">
            {(['core', 'details'] as const).map((item, index) => (
              <li
                key={item}
                aria-current={step === item ? 'step' : undefined}
                className={`text-sm font-semibold ${step === item ? 'text-amber-800 dark:text-amber-300' : 'text-ink-muted'}`}
              >
                <span className="mr-2 text-xs">0{index + 1}</span>
                {t(`milestones.editor.${item === 'core' ? 'moment' : 'details'}`)}
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
                if (step === 'details') setStep('core')
                else if (step === 'core' && !milestone && babies.length > 1) setStep('baby')
                else close()
              }}
            >
              {t(
                step === 'details' || (step === 'core' && !milestone && babies.length > 1)
                  ? 'milestones.wizard.back'
                  : 'common.cancel',
              )}
            </Button>
            {step === 'details' ? (
              <Button
                key="save"
                type="submit"
                form="milestone-editor-form"
                disabled={busy || !baby}
                className="bg-amber-800 text-white hover:bg-amber-900"
              >
                {t(
                  upload.isPending
                    ? 'milestones.editor.photoLoading'
                    : busy
                      ? 'common.saving'
                      : milestone
                        ? 'milestones.edit.submit'
                        : 'milestones.editor.save',
                )}
              </Button>
            ) : (
              <Button
                key="continue"
                type="button"
                disabled={busy || !baby || !ready}
                className="bg-amber-800 text-white hover:bg-amber-900"
                onClick={() => {
                  if (step === 'baby') setStep('core')
                  else void advance()
                }}
              >
                {t('milestones.wizard.continue')}
              </Button>
            )}
          </>
        )}
      >
        {!ready && babiesQuery.isPending ? (
          <p role="status">{t('common.loading')}</p>
        ) : !ready && babiesQuery.isError ? (
          <div role="alert" className="space-y-3">
            <p>{t('milestones.editor.childrenError')}</p>
            <Button
              onClick={() => {
                void babiesQuery.refetch()
              }}
            >
              {t('milestones.editor.retry')}
            </Button>
          </div>
        ) : !babies.length ? (
          <p>{t('milestones.editor.noChildren')}</p>
        ) : (
          <>
            {step === 'baby' && (
              <BabyPickerStep babies={babies} value={babyId} onSelect={setBabyId} />
            )}
            <form
              id="milestone-editor-form"
              hidden={step === 'baby'}
              onSubmit={(event) => {
                if (step === 'core') {
                  event.preventDefault()
                  void advance()
                } else void save(event)
              }}
              noValidate
            >
              <div hidden={step !== 'core'} className="space-y-5">
                {!milestone && (
                  <div>
                    <p className="mb-2 text-xs font-semibold text-ink-muted">
                      {t('milestones.editor.suggestions')}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {MILESTONE_SUGGESTIONS.map((item) => (
                        <button
                          key={item.titleKey}
                          type="button"
                          className="rounded-full border border-border px-3 py-2 text-xs text-ink hover:bg-muted"
                          onClick={() => {
                            const next = { title: t(item.titleKey), category: item.category }
                            if (title.trim() && title !== next.title) setReplacement(next)
                            else applySuggestion(next)
                          }}
                        >
                          {t(item.titleKey)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <MilestoneCoreFields register={register} control={control} errors={errors} />
              </div>
              <div hidden={step !== 'details'}>
                <MilestoneDetailFields
                  register={register}
                  control={control}
                  errors={errors}
                  onFileChange={(next, local) => {
                    setFile(next)
                    setPreview(local)
                    uploaded.current = null
                  }}
                />
              </div>
              {error && (
                <p role="alert" className="mt-4 text-sm text-destructive">
                  {t(error)}
                </p>
              )}
            </form>
          </>
        )}
      </MilestoneDialogLayout>
      <AlertDialog
        open={!!replacement}
        onOpenChange={(open) => {
          if (!open) setReplacement(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('milestones.editor.replaceTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('milestones.editor.replaceHint')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (replacement) applySuggestion(replacement)
              }}
            >
              {t('milestones.editor.replace')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
