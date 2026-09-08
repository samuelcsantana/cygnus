import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useCurrentUser } from '@/features/auth/api/auth.hooks'
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher'
import { ThemeToggle } from '@/shared/components/ThemeToggle'
import { Skeleton } from '@/components/ui/skeleton'
import { ChangePasswordForm } from '../components/ChangePasswordForm'
import { DeleteAccountDialog } from '../components/DeleteAccountDialog'
import { ProfileForm } from '../components/ProfileForm'

export function ProfileRoute() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const currentUser = useCurrentUser()
  return (
    <div className="mx-auto max-w-5xl animate-fade-in-up">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-extrabold text-ink">{t('profile.page.title')}</h1>
        <p className="mt-2 text-sm text-ink-muted">{t('profile.subtitle')}</p>
      </header>
      {currentUser.isPending ? (
        <div
          role="status"
          aria-label={t('common.loading')}
          className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"
        >
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      ) : currentUser.isError || !currentUser.data ? (
        <div role="alert" className="rounded-2xl border border-border bg-card p-6">
          <p className="text-sm text-ink-muted">{t('profile.page.error')}</p>
          <button
            type="button"
            className="mt-2 min-h-11 font-semibold text-primary"
            onClick={() => {
              void currentUser.refetch()
            }}
          >
            {t('nav.shell.retry')}
          </button>
        </div>
      ) : (
        <>
          <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div className="min-w-0 space-y-5">
              <section
                className="rounded-2xl border border-border bg-card p-5 sm:p-6"
                aria-labelledby="profile-personal-title"
              >
                <h2
                  id="profile-personal-title"
                  className="mb-5 font-display text-lg font-extrabold text-ink"
                >
                  {t('profile.form.sectionTitle')}
                </h2>
                <ProfileForm key={currentUser.data.id} user={currentUser.data} />
              </section>
              <section
                className="rounded-2xl border border-border bg-card p-5 sm:p-6"
                aria-labelledby="profile-security-title"
              >
                <h2
                  id="profile-security-title"
                  className="mb-4 font-display text-lg font-extrabold text-ink"
                >
                  {t('profile.password.sectionTitle')}
                </h2>
                <ChangePasswordForm />
              </section>
            </div>
            <aside
              className="min-w-0 rounded-2xl border border-border bg-card p-5 sm:p-6"
              aria-labelledby="profile-preferences-title"
            >
              <h2
                id="profile-preferences-title"
                className="font-display text-lg font-extrabold text-ink"
              >
                {t('profile.page.preferences')}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                {t('profile.page.preferencesHint')}
              </p>
              <h3 className="mb-3 mt-6 text-sm font-semibold text-ink">
                {t('profile.language.sectionTitle')}
              </h3>
              <LanguageSwitcher variant="field" className="w-full" />
              <h3 className="mb-3 mt-6 text-sm font-semibold text-ink">
                {t('common.theme.label')}
              </h3>
              <ThemeToggle variant="field" className="w-full" />
            </aside>
          </div>
          <section className="mt-8 flex flex-col gap-4 border-t border-border px-1 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-base font-bold text-ink">
                {t('profile.delete.sectionTitle')}
              </h2>
              <p className="mt-1 max-w-xl text-sm text-ink-muted">
                {t('profile.delete.sectionDescription')}
              </p>
            </div>
            <DeleteAccountDialog onDeleted={() => navigate('/login', { replace: true })} />
          </section>
        </>
      )}
    </div>
  )
}
