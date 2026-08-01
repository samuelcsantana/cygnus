import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ApiError } from '@/lib/http-client'
import { fieldErrorKey } from '@/shared/utils/zod-error'

import { useLogin } from '../api/auth.hooks'
import { loginSchema, type LoginInput } from '../api/auth.schemas'

export function LoginForm() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const login = useLogin()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login.mutateAsync(values)
      navigate('/dashboard', { replace: true })
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
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <div>
        <Label htmlFor="email">{t('auth.login.emailLabel')}</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder={t('auth.login.emailPlaceholder')}
          aria-invalid={!!errors.email}
          aria-describedby={emailErrorKey ? 'email-error' : undefined}
          className="mt-2"
          {...register('email')}
        />
        {emailErrorKey && (
          <p id="email-error" className="mt-1 text-sm text-destructive">
            {t(emailErrorKey)}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="password">{t('auth.login.passwordLabel')}</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder={t('auth.login.passwordPlaceholder')}
          aria-invalid={!!errors.password}
          aria-describedby={passwordErrorKey ? 'password-error' : undefined}
          className="mt-2"
          {...register('password')}
        />
        {passwordErrorKey && (
          <p id="password-error" className="mt-1 text-sm text-destructive">
            {t(passwordErrorKey)}
          </p>
        )}
      </div>

      {submitErrorMessage && (
        <p role="alert" className="text-sm text-destructive">
          {submitErrorMessage}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={login.isPending}>
        {login.isPending ? t('common.loading') : t('auth.login.submit')}
      </Button>
    </form>
  )
}
