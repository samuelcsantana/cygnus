import type { ReactNode } from 'react'
import { Phone, Stethoscope, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Baby } from '@/features/babies/api/babies.schemas'
import { babyAvatarAppearance, babyInitials } from '@/shared/utils/babyAvatarColor'
import { isPrivateEntry, type Specialist } from '../api/specialists.schemas'
interface Props {
  specialist: Specialist
  babies: Baby[]
  linksPending?: boolean
  linksError?: boolean
  accessKnown: boolean
  isOwner: boolean
  actions?: ReactNode
}
export function SpecialistCard({
  specialist,
  babies,
  linksPending,
  linksError,
  accessKnown,
  isOwner,
  actions,
}: Props) {
  const { t } = useTranslation()
  const linked = babies.filter((baby) => specialist.babyIds.includes(baby.id))
  const missing = specialist.babyIds.length - linked.length
  return (
    <article className="flex min-w-0 flex-col rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/5 text-primary"
        >
          <Stethoscope className="size-5" />
        </span>
        <div className="min-w-0">
          <h2 className="break-words text-lg font-bold text-ink">{specialist.name}</h2>
          <p className="mt-1 break-words text-sm text-ink-muted">
            {specialist.specialty || t('specialists.page.noSpecialty')}
          </p>
        </div>
      </div>
      {!accessKnown ? (
        <p className="mt-3 text-xs text-ink-muted">{t('specialists.page.accessUnknown')}</p>
      ) : (
        !isOwner && (
          <div className="mt-3 rounded-xl bg-muted/60 p-3 text-xs text-ink-muted">
            <p className="flex items-center gap-2 font-semibold">
              <Users aria-hidden className="size-4" />
              {t('specialists.page.shared')}
            </p>
            <p className="mt-1">{t('specialists.page.readOnly')}</p>
          </div>
        )
      )}
      <div className="mt-4 border-t border-border pt-3">
        {specialist.phone ? (
          <a
            href={`tel:${specialist.phone.replace(/\s/g, '')}`}
            className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-xl py-2 font-mono text-sm font-semibold text-primary underline-offset-4 hover:underline"
          >
            <Phone aria-hidden className="size-4 shrink-0" />
            <span className="break-all">{specialist.phone}</span>
          </a>
        ) : (
          <p className="py-3 text-sm text-ink-muted">{t('specialists.page.noPhone')}</p>
        )}
        {specialist.babyIds.length ? (
          linksPending || linksError ? (
            <p className="mt-2 text-xs text-ink-muted">
              {t(linksError ? 'specialists.page.linksError' : 'common.loading')}
            </p>
          ) : (
            <div className="mt-2">
              {linked.length > 0 && (
                <>
                  <p className="text-xs text-ink-muted">
                    {t('specialists.attends', { list: linked.map((baby) => baby.name).join(', ') })}
                  </p>
                  <div aria-hidden className="mt-2 flex flex-wrap gap-1.5">
                    {linked.map((baby) => {
                      const avatar = babyAvatarAppearance(baby.id, baby.avatarColor)
                      return (
                        <span
                          key={baby.id}
                          className={`flex size-7 items-center justify-center overflow-hidden rounded-full text-xs font-bold ${avatar.className}`}
                          style={avatar.style}
                        >
                          {baby.avatarUrl ? (
                            <img src={baby.avatarUrl} alt="" className="size-full object-cover" />
                          ) : (
                            babyInitials(baby.name)
                          )}
                        </span>
                      )
                    })}
                  </div>
                </>
              )}
              {missing > 0 && (
                <p className="mt-1 text-xs text-ink-muted">{t('specialists.page.otherLinks')}</p>
              )}
            </div>
          )
        ) : (
          <p className="mt-2 text-xs text-ink-muted">
            {t(isPrivateEntry(specialist) ? 'specialists.privateEntry' : 'specialists.sharedOnly')}
          </p>
        )}
      </div>
      {actions && (
        <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-border pt-3">
          {actions}
        </div>
      )}
    </article>
  )
}
