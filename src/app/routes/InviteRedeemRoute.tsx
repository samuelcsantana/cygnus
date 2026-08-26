import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { useCurrentUser } from '@/features/auth/api/auth.hooks'
import { useInvitePreview, useRedeemInvite } from '@/features/babies/api/invites.hooks'
import { ApiError } from '@/lib/http-client'
import { AlertCircleIcon } from '@/shared/icons/alert-circle-icon'
import { LogoIcon } from '@/shared/icons/logo-icon'
import { UsersIcon } from '@/shared/icons/users-icon'

/**
 * Sits outside ProtectedLayout (see router.tsx) so it renders the invite
 * preview for logged-out visitors too — only the "accept" action itself
 * requires an authenticated session (see handleAccept).
 */
export function InviteRedeemRoute() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { code = '' } = useParams<{ code: string }>()
  const preview = useInvitePreview(code)
  const currentUser = useCurrentUser()
  const redeemInvite = useRedeemInvite(code)

  const handleAccept = async () => {
    const isAuthenticated = currentUser.isSuccess
    if (!isAuthenticated) {
      navigate(`/login?redirectTo=${encodeURIComponent(`/invites/${code}`)}`)
      return
    }

    try {
      const result = await redeemInvite.mutateAsync()
      toast.success(t('invites.redeem.successToast', { babyName: result.babyName }))
      navigate('/dashboard', { replace: true })
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        toast.error(t('invites.redeem.alreadyGuardianError'))
      } else if (error instanceof ApiError && error.status === 410) {
        toast.error(t('invites.redeem.expiredError'))
      } else {
        toast.error(t('invites.redeem.genericError'))
      }
    }
  }

  const invalidCodeError = preview.isError && preview.error instanceof ApiError && preview.error.status === 404

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="bg-primary/10 text-primary flex h-16 w-16 items-center justify-center rounded-2xl">
        <LogoIcon className="h-8 w-8" />
      </div>

      {preview.isPending ? (
        <div className="border-t-transparent border-primary h-8 w-8 animate-spin rounded-full border-2" />
      ) : invalidCodeError ? (
        <div className="max-w-md">
          <h1 className="text-2xl font-bold text-ink">{t('invites.redeem.invalidTitle')}</h1>
          <p className="mt-2 text-ink-muted">{t('invites.redeem.invalidDescription')}</p>
        </div>
      ) : preview.isError ? (
        <div className="max-w-md">
          <h1 className="text-2xl font-bold text-ink">{t('invites.redeem.errorTitle')}</h1>
          <p className="mt-2 text-ink-muted">{t('invites.redeem.genericLoadError')}</p>
        </div>
      ) : preview.data.expired || preview.data.alreadyUsed ? (
        <div className="max-w-md">
          <AlertCircleIcon className="text-amber-700 dark:text-amber-300 mx-auto mb-4 h-10 w-10" />
          <h1 className="text-2xl font-bold text-ink">
            {preview.data.expired ? t('invites.redeem.expiredTitle') : t('invites.redeem.alreadyUsedTitle')}
          </h1>
          <p className="mt-2 text-ink-muted">
            {preview.data.expired ? t('invites.redeem.expiredDescription') : t('invites.redeem.alreadyUsedDescription')}
          </p>
        </div>
      ) : (
        <div className="max-w-md">
          {preview.data.babyAvatarUrl ? (
            <img
              src={preview.data.babyAvatarUrl}
              alt=""
              className="mx-auto mb-4 h-20 w-20 rounded-full object-cover shadow-md"
            />
          ) : (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full">
              <UsersIcon className="h-9 w-9" />
            </div>
          )}
          <h1 className="text-2xl font-bold text-ink">
            {t('invites.redeem.title', { babyName: preview.data.babyName })}
          </h1>
          <p className="mt-2 text-ink-muted">{t('invites.redeem.description')}</p>
          <Button
            type="button"
            className="mt-6"
            onClick={handleAccept}
            disabled={redeemInvite.isPending || currentUser.isPending}
          >
            {redeemInvite.isPending ? t('common.saving') : t('invites.redeem.acceptAction')}
          </Button>
        </div>
      )}
    </div>
  )
}
