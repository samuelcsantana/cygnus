import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { useCurrentUser } from '@/features/auth/api/auth.hooks'
import { useBabies } from '@/features/babies/api/babies.hooks'
import type { Baby } from '@/features/babies/api/babies.schemas'
import { EditBabyDialog } from '@/features/babies/components/EditBabyDialog'
import { ageInMonths } from '@/lib/date'
import { cn } from '@/lib/utils'
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher'
import { ThemeToggle } from '@/shared/components/ThemeToggle'
import { PencilIcon } from '@/shared/icons/pencil-icon'
import { PlusIcon } from '@/shared/icons/plus-icon'
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
  const [editTarget, setEditTarget] = useState<Baby | null>(null)

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
  const accountInitial = currentUser.data.name.trim().slice(0, 1).toUpperCase()

  return (
    <div className="animate-fade-in-up mx-auto max-w-3xl">
      <div className="from-primary relative mb-7 overflow-hidden rounded-2xl bg-gradient-to-br to-teal-400 px-6 py-7 sm:px-8 sm:py-8">
        <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-14 right-16 h-28 w-28 rounded-full bg-white/10" />
        <div className="relative flex items-center gap-4">
          <span className="font-display flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-2xl font-black text-white ring-2 ring-white/40">
            {accountInitial}
          </span>
          <div className="min-w-0">
            <h2 className="font-display truncate text-2xl font-extrabold text-white">{currentUser.data.name}</h2>
            <p className="truncate text-sm text-white/80">{currentUser.data.email}</p>
          </div>
        </div>
        <p className="relative mt-5 text-sm text-white/80">{t('profile.subtitle')}</p>
      </div>

      <div className="flex flex-col gap-5">
        <section className="rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] sm:p-6">
          <h3 className="font-display mb-4 text-base font-extrabold text-ink">{t('profile.language.sectionTitle')}</h3>
          <LanguageSwitcher variant="field" className="w-full max-w-xs" />
          <h3 className="font-display mt-5 mb-4 text-base font-extrabold text-ink">{t('common.theme.label')}</h3>
          <ThemeToggle className="w-auto rounded-full border border-slate-200 px-3" />
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
          <div className="mb-5 flex items-center justify-between">
            <h3 className="font-display text-base font-extrabold text-ink">{t('profile.babies.sectionTitle')}</h3>
            {babyList.length > 0 && (
              <button
                type="button"
                onClick={openAddBabyDialog}
                aria-label={t('babies.addChild')}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-bold text-teal-700 transition-colors hover:bg-teal-50"
              >
                <PlusIcon className="h-3.5 w-3.5" />
                {t('babies.addChild')}
              </button>
            )}
          </div>
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
                    <button
                      type="button"
                      onClick={() => setEditTarget(baby)}
                      aria-label={t('babies.edit.action', { name: baby.name })}
                      className="flex-shrink-0 rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-slate-100 hover:text-teal-600"
                    >
                      <PencilIcon className="h-3.5 w-3.5" />
                    </button>
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

      <EditBabyDialog baby={editTarget} onOpenChange={(open) => !open && setEditTarget(null)} />
    </div>
  )
}
