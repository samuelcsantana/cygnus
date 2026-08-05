import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { useCurrentUser } from '@/features/auth/api/auth.hooks'
import { useBabies } from '@/features/babies/api/babies.hooks'
import { ageInMonths } from '@/lib/date'
import { cn } from '@/lib/utils'
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher'
import { useAddBabyDialogStore } from '@/shared/stores/addBabyDialog.store'
import { babyAvatarAppearance, babyInitials } from '@/shared/utils/babyAvatarColor'

import { ChangePasswordForm } from '../components/ChangePasswordForm'
import { DeleteAccountDialog } from '../components/DeleteAccountDialog'
import { ProfileForm } from '../components/ProfileForm'

export function ProfileRoute() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const currentUser = useCurrentUser()
  const babies = useBabies()
  const openAddBabyDialog = useAddBabyDialogStore((state) => state.open)

  if (currentUser.isPending) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="border-t-transparent h-8 w-8 animate-spin rounded-full border-2 border-primary" />
      </div>
    )
  }

  if (!currentUser.data) {
    return null
  }

  const babyList = babies.data ?? []

  return (
    <div className="animate-fade-in-up mx-auto max-w-3xl">
      <div className="mb-7">
        <h2 className="font-display text-2xl font-extrabold text-ink">{t('profile.title')}</h2>
        <p className="mt-0.5 text-sm text-ink-muted">{t('profile.subtitle')}</p>
      </div>

      <div className="flex flex-col gap-5">
        <section className="rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] sm:p-6">
          <h3 className="font-display mb-4 text-base font-extrabold text-ink">{t('profile.language.sectionTitle')}</h3>
          <LanguageSwitcher className="w-full max-w-xs" />
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] sm:p-6">
          <h3 className="font-display mb-5 text-base font-extrabold text-ink">{t('profile.form.sectionTitle')}</h3>
          <ProfileForm user={currentUser.data} />
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] sm:p-6">
          <h3 className="font-display mb-5 text-base font-extrabold text-ink">{t('profile.password.sectionTitle')}</h3>
          <ChangePasswordForm />
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] sm:p-6">
          <h3 className="font-display mb-5 text-base font-extrabold text-ink">{t('profile.babies.sectionTitle')}</h3>
          {babyList.length === 0 ? (
            <p className="text-sm text-ink-muted">
              {t('profile.babies.empty')}{' '}
              <button type="button" onClick={openAddBabyDialog} className="font-bold text-teal-700">
                {t('profile.babies.addFirst')}
              </button>
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {babyList.map((baby) => {
                const avatarAppearance = babyAvatarAppearance(baby.id, baby.avatarColor)
                return (
                  <div key={baby.id} className="flex items-center gap-3">
                    {baby.avatarUrl ? (
                      <img
                        src={baby.avatarUrl}
                        alt=""
                        className={cn(
                          'h-10 w-10 flex-shrink-0 rounded-full bg-teal-50 object-cover',
                          baby.avatarColor && 'border-2',
                        )}
                        style={baby.avatarColor ? { borderColor: baby.avatarColor } : undefined}
                      />
                    ) : (
                      <span
                        className={`font-display flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-black ${avatarAppearance.className}`}
                        style={avatarAppearance.style}
                      >
                        {babyInitials(baby.name)}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-bold text-ink">{baby.name}</p>
                      <p className="text-[11px] text-ink-muted">
                        {t('babies.monthsOld', { count: ageInMonths(baby.birthDate) })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-rose-100 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] sm:p-6">
          <h3 className="font-display mb-2 text-base font-extrabold text-ink">{t('profile.delete.sectionTitle')}</h3>
          <p className="mb-5 text-sm text-ink-muted">{t('profile.delete.sectionDescription')}</p>
          <DeleteAccountDialog onDeleted={() => navigate('/login', { replace: true })} />
        </section>
      </div>
    </div>
  )
}
