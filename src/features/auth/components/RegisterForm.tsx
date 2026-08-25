import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { ApiError } from '@/lib/http-client'
import { AlertCircleIcon } from '@/shared/icons/alert-circle-icon'
import { fieldErrorKey } from '@/shared/utils/zod-error'

import { useRegister } from '../api/auth.hooks'
import { registerSchema, type RegisterInput } from '../api/auth.schemas'
import { AuthField } from './AuthField'
import { AuthSocialSection } from './AuthSocialSection'
import { AuthSubmitButton } from './AuthSubmitButton'

export function RegisterForm() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const registerUser = useRegister()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      await registerUser.mutateAsync(values)
      toast.success(t('auth.register.successToast'))
      navigate('/login', { replace: true })
    } catch {
      // surfaced below via registerUser.error
    }
  })

  const nameErrorKey = fieldErrorKey(errors.name)
  const emailErrorKey = fieldErrorKey(errors.email)
  const passwordErrorKey = fieldErrorKey(errors.password)

  const submitErrorMessage =
    registerUser.error instanceof ApiError && registerUser.error.status === 409
      ? t('auth.register.emailTaken')
      : registerUser.error
        ? t('auth.register.genericError')
        : null

  return (
    <div className="space-y-5">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <AuthField
          id="name"
          label={t('auth.register.nameLabel')}
          autoComplete="name"
          placeholder={t('auth.register.namePlaceholder')}
          errorMessage={nameErrorKey && t(nameErrorKey)}
          {...register('name')}
        />

        <AuthField
          id="email"
          label={t('auth.register.emailLabel')}
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          placeholder={t('auth.register.emailPlaceholder')}
          errorMessage={emailErrorKey && t(emailErrorKey)}
          {...register('email')}
        />

        <AuthField
          id="password"
          label={t('auth.register.passwordLabel')}
          type="password"
          autoComplete="new-password"
          placeholder={t('auth.register.passwordPlaceholder')}
          errorMessage={passwordErrorKey && t(passwordErrorKey)}
          revealLabels={{ show: t('auth.register.showPassword'), hide: t('auth.register.hidePassword') }}
          {...register('password')}
        />

        {submitErrorMessage && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-[10px] border border-destructive/25 bg-destructive/10 px-3.5 py-3 text-[13px] font-medium text-destructive"
          >
            <AlertCircleIcon className="mt-px h-4 w-4 shrink-0" />
            <span>{submitErrorMessage}</span>
          </div>
        )}

        <div className="pt-1">
          <AuthSubmitButton
            label={t('auth.register.submit')}
            pendingLabel={t('auth.register.submitting')}
            isPending={registerUser.isPending}
          />
        </div>
      </form>

      <AuthSocialSection />
    </div>
  )
}
