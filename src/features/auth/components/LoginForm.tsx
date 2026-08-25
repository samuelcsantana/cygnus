import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { ApiError } from '@/lib/http-client'
import { AlertCircleIcon } from '@/shared/icons/alert-circle-icon'
import { MailIcon } from '@/shared/icons/mail-icon'
import { fieldErrorKey } from '@/shared/utils/zod-error'

import { useLogin, type AssistedMode } from '../api/auth.hooks'
import { loginSchema, type LoginInput } from '../api/auth.schemas'
import { AuthField } from './AuthField'
import { AUTH_ALTERNATIVE_CLASS, AuthSocialSection } from './AuthSocialSection'
import { AuthSubmitButton } from './AuthSubmitButton'

interface LoginFormProps {
  /** Carried back from the assisted flow, so returning does not blank the field. */
  defaultEmail: string
  /** Hands the address typed so far to the flow the user just chose. */
  onStartAssisted: (mode: AssistedMode, email: string) => void
}

export function LoginForm({ defaultEmail, onStartAssisted }: LoginFormProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const login = useLogin()

  // Only ever a same-app relative path (e.g. the invite-redeem flow), never
  // an external URL — guarded below to avoid an open-redirect via this param.
  const redirectTo = searchParams.get('redirectTo')
  const isSafeRedirect = !!redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//')

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: defaultEmail },
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login.mutateAsync(values)
      navigate(isSafeRedirect ? redirectTo : '/dashboard', { replace: true })
    } catch {
      // surfaced below via login.error
    }
  })

  const emailErrorKey = fieldErrorKey(errors.email)
  const passwordErrorKey = fieldErrorKey(errors.password)

  const submitErrorMessage =
    login.error instanceof ApiError && login.error.status === 401
      ? t('auth.login.invalidCredentials')
      : login.error
        ? t('auth.login.genericError')
        : null

  return (
    <div className="space-y-5">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <AuthField
          id="email"
          label={t('auth.login.emailLabel')}
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          placeholder={t('auth.login.emailPlaceholder')}
          errorMessage={emailErrorKey && t(emailErrorKey)}
          {...register('email')}
        />

        <AuthField
          id="password"
          label={t('auth.login.passwordLabel')}
          type="password"
          autoComplete="current-password"
          placeholder={t('auth.login.passwordPlaceholder')}
          errorMessage={passwordErrorKey && t(passwordErrorKey)}
          revealLabels={{ show: t('auth.login.showPassword'), hide: t('auth.login.hidePassword') }}
          labelAction={
            <button
              type="button"
              onClick={() => onStartAssisted('reset', getValues('email'))}
              className="rounded-sm text-[12.5px] font-medium text-emerald-700 underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-emerald-600/40 focus-visible:outline-none dark:text-emerald-400"
            >
              {t('auth.login.forgotPassword')}
            </button>
          }
          {...register('password')}
        />

        {submitErrorMessage && (
          <div
            role="alert"
            // destructive-on-destructive/10 is the pairing --destructive was
            // darkened for (4.77:1); the Button/Badge destructive variants use
            // the same tint. Don't lighten the fill without rechecking it.
            className="flex items-start gap-2.5 rounded-[10px] border border-destructive/25 bg-destructive/10 px-3.5 py-3 text-[13px] font-medium text-destructive"
          >
            <AlertCircleIcon className="mt-px h-4 w-4 shrink-0" />
            <span>{submitErrorMessage}</span>
          </div>
        )}

        <div className="pt-1">
          <AuthSubmitButton
            label={t('auth.login.submit')}
            pendingLabel={t('auth.login.submitting')}
            isPending={login.isPending}
          />
        </div>
      </form>

      <AuthSocialSection>
        <button
          type="button"
          onClick={() => onStartAssisted('passwordless', getValues('email'))}
          className={AUTH_ALTERNATIVE_CLASS}
        >
          <MailIcon className="h-[18px] w-[18px] text-ink-faint" />
          {t('auth.login.passwordless')}
        </button>
      </AuthSocialSection>
    </div>
  )
}
