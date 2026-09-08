import { Controller, useWatch, type Control } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { babyAvatarAppearance, babyInitials } from '@/shared/utils/babyAvatarColor'
import type { SpecialistFormInput } from '../api/specialists.schemas'
import type { SpecialistEditorProps } from './SpecialistEditor'

type Props = Pick<
  SpecialistEditorProps,
  | 'babies'
  | 'guardians'
  | 'babiesLoading'
  | 'babiesError'
  | 'guardiansLoading'
  | 'guardiansError'
  | 'retryBabies'
  | 'retryGuardians'
> & { control: Control<SpecialistFormInput> }
const toggle = (list: string[], id: string) =>
  list.includes(id) ? list.filter((item) => item !== id) : [...list, id]
const selectionClass = (selected: boolean) =>
  `flex min-w-0 cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition-colors ${selected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'}`

export function SpecialistAccessFields(props: Props) {
  const { t } = useTranslation()
  const { babies, guardians, control } = props
  const [babyIds, sharedIds] = useWatch({ control, name: ['babyIds', 'sharedWithUserIds'] })
  const retry = (callback: () => void) => (
    <Button type="button" variant="outline" size="sm" onClick={callback}>
      {t('specialists.editor.retry')}
    </Button>
  )
  return (
    <section aria-labelledby="specialist-links" className="space-y-4 border-t border-border pt-5">
      <h3 id="specialist-links" className="font-semibold">
        {t('specialists.editor.links')}
      </h3>
      <fieldset>
        <legend className="text-sm font-medium">{t('specialists.babiesLabel')}</legend>
        <p className="mt-1 text-sm text-ink-muted">{t('specialists.editor.babiesHint')}</p>
        {props.babiesLoading ? (
          <p role="status" className="mt-3 text-sm">
            {t('common.loading')}
          </p>
        ) : props.babiesError ? (
          <div role="alert" className="mt-3 space-y-2 text-sm">
            <p>{t('specialists.editor.babiesError')}</p>
            {retry(props.retryBabies)}
          </div>
        ) : babies.length === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">{t('specialists.editor.noChildren')}</p>
        ) : (
          <Controller
            control={control}
            name="babyIds"
            render={({ field }) => (
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {babies.map((baby) => {
                  const avatar = babyAvatarAppearance(baby.id, baby.avatarColor)
                  return (
                    <label key={baby.id} className={selectionClass(field.value.includes(baby.id))}>
                      <input
                        type="checkbox"
                        className="size-4 shrink-0 accent-primary"
                        checked={field.value.includes(baby.id)}
                        onChange={() => field.onChange(toggle(field.value, baby.id))}
                      />
                      <span
                        aria-hidden="true"
                        className={`flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full font-bold ${avatar.className}`}
                        style={avatar.style}
                      >
                        {baby.avatarUrl ? (
                          <img src={baby.avatarUrl} alt="" className="size-full object-cover" />
                        ) : (
                          babyInitials(baby.name)
                        )}
                      </span>
                      <span className="min-w-0 break-words font-medium">{baby.name}</span>
                    </label>
                  )
                })}
              </div>
            )}
          />
        )}
      </fieldset>
      <fieldset>
        <legend className="text-sm font-medium">{t('specialists.editor.additionalShare')}</legend>
        <p className="mt-1 text-sm text-ink-muted">{t('specialists.editor.shareHint')}</p>
        {props.guardiansLoading ? (
          <p role="status" className="mt-3 text-sm">
            {t('common.loading')}
          </p>
        ) : props.guardiansError ? (
          <div role="alert" className="mt-3 space-y-2 text-sm">
            <p>{t('specialists.editor.guardiansError')}</p>
            {retry(props.retryGuardians)}
          </div>
        ) : guardians.length === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">{t('specialists.editor.noGuardians')}</p>
        ) : (
          <Controller
            control={control}
            name="sharedWithUserIds"
            render={({ field }) => (
              <div className="mt-3 space-y-2">
                {guardians.map((guardian) => (
                  <label
                    key={guardian.userId}
                    className={selectionClass(field.value.includes(guardian.userId))}
                  >
                    <input
                      type="checkbox"
                      className="size-4 shrink-0 accent-primary"
                      checked={field.value.includes(guardian.userId)}
                      onChange={() => field.onChange(toggle(field.value, guardian.userId))}
                    />
                    <span className="min-w-0 break-words">
                      <span className="font-medium">{guardian.name}</span>
                      <span className="block text-xs text-ink-muted">{guardian.email}</span>
                    </span>
                  </label>
                ))}
              </div>
            )}
          />
        )}
      </fieldset>
      <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm" aria-live="polite">
        <p className="font-semibold">{t('specialists.editor.visibility')}</p>
        <p className="mt-1 text-ink-muted">
          {t(
            babyIds.length
              ? 'specialists.editor.childAccess'
              : sharedIds.length
                ? 'specialists.editor.sharedAccess'
                : 'specialists.editor.privateAccess',
          )}
        </p>
        {sharedIds.length > 0 && (
          <p className="mt-2 break-words text-ink-muted">
            {t('specialists.editor.directAccess', { count: sharedIds.length })}
            {guardians.length > 0 &&
              ` ${guardians
                .filter((person) => sharedIds.includes(person.userId))
                .map((person) => person.name)
                .join(', ')}`}
          </p>
        )}
      </div>
    </section>
  )
}
