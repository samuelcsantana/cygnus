import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ApiError } from '@/lib/http-client'
import { fieldErrorKey } from '@/shared/utils/zod-error'

import { useRegister } from '../api/auth.hooks'
import { registerSchema, type RegisterInput } from '../api/auth.schemas'

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
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <div>
        <Label htmlFor="name">{t('auth.register.nameLabel')}</Label>
        <Input
          id="name"
          autoComplete="name"
          placeholder={t('auth.register.namePlaceholder')}
          aria-invalid={!!errors.name}
          aria-describedby={nameErrorKey ? 'name-error' : undefined}
          className="mt-2"
          {...register('name')}
        />
        {nameErrorKey && (
          <p id="name-error" className="text-destructive mt-1 text-sm">
            {t(nameErrorKey)}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="email">{t('auth.register.emailLabel')}</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder={t('auth.register.emailPlaceholder')}
          aria-invalid={!!errors.email}
          aria-describedby={emailErrorKey ? 'email-error' : undefined}
          className="mt-2"
          {...register('email')}
        />
        {emailErrorKey && (
          <p id="email-error" className="text-destructive mt-1 text-sm">
            {t(emailErrorKey)}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="password">{t('auth.register.passwordLabel')}</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder={t('auth.register.passwordPlaceholder')}
          aria-invalid={!!errors.password}
          aria-describedby={passwordErrorKey ? 'password-error' : undefined}
          className="mt-2"
          {...register('password')}
        />
        {passwordErrorKey && (
          <p id="password-error" className="text-destructive mt-1 text-sm">
            {t(passwordErrorKey)}
          </p>
        )}
      </div>

      {submitErrorMessage && (
        <p role="alert" className="text-destructive text-sm">
          {submitErrorMessage}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={registerUser.isPending}>
        {registerUser.isPending ? t('common.saving') : t('auth.register.submit')}
      </Button>
    </form>
  )
}
