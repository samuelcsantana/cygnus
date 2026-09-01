import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { useCurrentUser } from '@/features/auth/api/auth.hooks'
import { useInvitePreview, useRedeemInvite } from '@/features/babies/api/invites.hooks'
import { ApiError } from '@/lib/http-client'
import { AlertCircleIcon } from '@/shared/icons/alert-circle-icon'
import { UsersIcon } from '@/shared/icons/users-icon'

/**
 * Sits outside ProtectedLayout (see router.tsx) so it renders the invite
 * preview for logged-out visitors too — only the "accept" action itself
 * requires an authenticated session (see handleAccept).
 *
 * Since 01/09/2026 it renders *inside* AuthLayout, which draws the brand panel,
 * the card, the theme and language controls and the legal footer. So this file
 * owns only the column's content: no page wrapper, no logo, no centring. The
 * shell was duplicated here before, and worse than the duplication was the
 * seam — an invite sends the visitor to /login and back, and the screen used to
 * change identity in the middle of that round trip.
 *
 * That arrangement is not self-enforcing: it also depends on the
 * `expectsAnonymous` flag below, without which this route's own 401 boots the
 * visitor to /login. `InviteRedeemRoute.test.tsx` is what keeps the two in
 * sync.
 */
export function InviteRedeemRoute() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { code = '' } = useParams<{ code: string }>()
  const preview = useInvitePreview(code)
  // `expectsAnonymous` is load-bearing here, not a precaution: this route sits
  // outside ProtectedLayout precisely so a logged-out visitor can read the
  // invite, and without the flag the 401 from /auth/me trips the global
  // unauthorized handler and hard-navigates them to /login before the preview
  // ever paints. The screen would then be unreachable for the exact audience
  // it exists to serve — someone who followed an invite link.
  const currentUser = useCurrentUser({ expectsAnonymous: true })
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
    <div className="flex flex-col items-center gap-6 text-center">
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
          {/* h-12 and full width, matching AuthSubmitButton rather than the
              Button default. This is the only action on the screen — the whole
              page exists for this one tap — and at the raw h-8 default it was
              117x32, the smallest primary action in the app while every other
              primary path is 44px or taller. The fill is the Button default,
              which since #57 is --primary everywhere; only the scale is
              overridden here. */}
          <Button
            type="button"
            className="mt-6 h-12 w-full text-[15px] font-semibold"
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
