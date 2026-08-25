import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { ApiError } from '@/lib/http-client'
import { AlertCircleIcon } from '@/shared/icons/alert-circle-icon'
import { ArrowLeftIcon } from '@/shared/icons/arrow-left-icon'
import { fieldErrorKey } from '@/shared/utils/zod-error'

import { useRequestAssistedCode, useVerifyAssistedCode, type AssistedMode } from '../api/auth.hooks'
import {
  assistedRequestSchema,
  codeFormSchema,
  newPasswordSchema,
  type AssistedRequestInput,
  type CodeFormInput,
  type NewPasswordInput,
} from '../api/auth.schemas'
import { AuthField } from './AuthField'
import { AuthSubmitButton } from './AuthSubmitButton'

/** Seconds before another code may be requested. */
const RESEND_COOLDOWN = 60

/**
 * Three outcomes the person can act on differently, so they must not collapse
 * into one message:
 *
 * - **401/410 on verify** — the code was wrong or has expired. Asking for
 *   another one fixes it, and the copy has to say so.
 * - **429** — the rate limit the API declares on all four assisted endpoints.
 *   Retrying immediately is the one thing that does not help, so "try again"
 *   is actively wrong advice here; the copy says to wait. No duration is named
 *   because the window is the server's to change, and `Retry-After` does not
 *   survive into ApiError, which carries only status and the parsed body.
 * - **anything else** — no user-side remedy beyond a retry.
 */
function assistedFailureKey(failure: unknown): string {
  if (!(failure instanceof ApiError)) return 'auth.assisted.genericError'
  if (failure.status === 401 || failure.status === 410) return 'auth.assisted.invalidCode'
  if (failure.status === 429) return 'auth.assisted.rateLimited'
  return 'auth.assisted.genericError'
}

interface AuthAssistedFlowProps {
  mode: AssistedMode
  /** Whatever was already typed into the login form's e-mail field. */
  initialEmail: string
  /** Hands the e-mail back so the login form is not blank on the way out. */
  onExit: (email: string) => void
}

/**
 * "Sign in without a password" and "reset my password", on the login screen
 * itself rather than on routes of their own.
 *
 * They are one machine: e-mail → code → session, with reset inserting a
 * password step before the end. Building them as two components would have
 * duplicated the request, the cooldown and the code entry three times over.
 *
 * Because the URL does not change, the browser's back button does not cancel
 * this — it leaves the site. That is why every step carries its own visible
 * "back", and why leaving is always possible in one press.
 */
export function AuthAssistedFlow({ mode, initialEmail, onExit }: AuthAssistedFlowProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [step, setStep] = useState<'email' | 'code' | 'password'>('email')
  const [email, setEmail] = useState(initialEmail)
  const [code, setCode] = useState('')
  const [cooldown, setCooldown] = useState(0)

  const requestCode = useRequestAssistedCode(mode)
  const verifyCode = useVerifyAssistedCode(mode)

  useEffect(() => {
    if (cooldown <= 0) return
    const id = setInterval(() => setCooldown((seconds) => Math.max(0, seconds - 1)), 1000)
    return () => clearInterval(id)
  }, [cooldown])

  const emailForm = useForm<AssistedRequestInput>({
    resolver: zodResolver(assistedRequestSchema),
    defaultValues: { email: initialEmail },
  })
  const codeForm = useForm<CodeFormInput>({ resolver: zodResolver(codeFormSchema) })
  const passwordForm = useForm<NewPasswordInput>({ resolver: zodResolver(newPasswordSchema) })

  const requestFor = async (address: string) => {
    await requestCode.mutateAsync({ email: address })
    setEmail(address)
    setCooldown(RESEND_COOLDOWN)
  }

  const onSubmitEmail = emailForm.handleSubmit(async (values) => {
    try {
      await requestFor(values.email)
      setStep('code')
      toast.info(t('auth.assisted.requestSent'))
    } catch {
      // surfaced below via requestCode.error
    }
  })

  const onSubmitCode = codeForm.handleSubmit(async (values) => {
    // Passwordless redeems the code straight away; reset has to collect the new
    // password first, because both travel to the server in the same call.
    if (mode === 'reset') {
      setCode(values.code)
      setStep('password')
      return
    }
    try {
      await verifyCode.mutateAsync({ email, code: values.code, password: '' })
      navigate('/dashboard', { replace: true })
    } catch {
      // surfaced below via verifyCode.error
    }
  })

  const onSubmitPassword = passwordForm.handleSubmit(async (values) => {
    try {
      await verifyCode.mutateAsync({ email, code, password: values.password })
      navigate('/dashboard', { replace: true })
    } catch {
      // surfaced below via verifyCode.error
    }
  })

  const handleResend = async () => {
    if (cooldown > 0) return
    try {
      await requestFor(email)
      toast.info(t('auth.assisted.resent'))
    } catch {
      // surfaced below via requestCode.error
    }
  }

  const goBack = () => {
    if (step === 'password') return setStep('code')
    if (step === 'code') return setStep('email')
    onExit(emailForm.getValues('email') || initialEmail)
  }

  const failure = verifyCode.error ?? requestCode.error
  const failureMessage = failure ? t(assistedFailureKey(failure)) : null

  const title = mode === 'reset' ? t('auth.assisted.resetTitle') : t('auth.assisted.passwordlessTitle')
  // The subtitle follows the step, not the flow: "confirm your e-mail" is
  // wrong once the e-mail has been confirmed. The code step needs none — the
  // "code sent to …" line under it says the same thing with the address in it.
  const subtitle =
    step === 'email'
      ? mode === 'reset'
        ? t('auth.assisted.resetSubtitle')
        : t('auth.assisted.passwordlessSubtitle')
      : step === 'password'
        ? t('auth.assisted.passwordSubtitle')
        : null

  return (
    <div className="mt-7">
      <button
        type="button"
        onClick={goBack}
        className="mb-5 -ml-1 inline-flex items-center gap-1.5 rounded-lg px-1 py-1 text-[13px] font-medium text-ink-muted transition-colors hover:text-ink focus-visible:ring-3 focus-visible:ring-emerald-600/40 focus-visible:outline-none"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        {t('auth.assisted.back')}
      </button>

      <div className="mb-6">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-balance text-ink">{title}</h1>
        {subtitle && <p className="mt-1.5 text-[13.5px] text-ink-muted">{subtitle}</p>}
      </div>

      {step === 'email' && (
        <form onSubmit={onSubmitEmail} className="space-y-4" noValidate>
          <AuthField
            id="assisted-email"
            label={t('auth.assisted.emailLabel')}
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            placeholder={t('auth.assisted.emailPlaceholder')}
            errorMessage={fieldErrorKey(emailForm.formState.errors.email) && t(fieldErrorKey(emailForm.formState.errors.email)!)}
            {...emailForm.register('email')}
          />

          {failureMessage && <FlowError message={failureMessage} />}

          <div className="pt-1">
            <AuthSubmitButton
              label={t('auth.assisted.sendCode')}
              pendingLabel={t('auth.assisted.sending')}
              isPending={requestCode.isPending}
            />
          </div>
        </form>
      )}

      {step === 'code' && (
        <form onSubmit={onSubmitCode} className="space-y-4" noValidate>
          <p className="text-[13px] text-ink-muted">
            {t('auth.assisted.codeSentTo', { email })}{' '}
            <button
              type="button"
              onClick={() => setStep('email')}
              className="rounded-sm font-semibold text-emerald-700 underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-emerald-600/40 focus-visible:outline-none dark:text-emerald-400"
            >
              {t('auth.assisted.changeEmail')}
            </button>
          </p>

          {/* One field, not six boxes: `one-time-code` is what gets the OS to
              offer the code from the notification, and six inputs break paste,
              password managers and screen-reader navigation. */}
          <AuthField
            id="assisted-code"
            label={t('auth.assisted.codeLabel')}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder={t('auth.assisted.codePlaceholder')}
            className="text-center text-lg font-semibold tracking-[0.5em] md:text-lg"
            errorMessage={fieldErrorKey(codeForm.formState.errors.code) && t(fieldErrorKey(codeForm.formState.errors.code)!)}
            {...codeForm.register('code')}
          />

          {failureMessage && <FlowError message={failureMessage} />}

          <div className="space-y-3 pt-1">
            <AuthSubmitButton
              label={t('auth.assisted.verify')}
              pendingLabel={t('auth.assisted.verifying')}
              isPending={verifyCode.isPending}
            />
            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0 || requestCode.isPending}
              className="w-full rounded-lg py-1 text-[13px] font-medium text-ink-muted transition-colors hover:text-ink focus-visible:ring-3 focus-visible:ring-emerald-600/40 focus-visible:outline-none disabled:pointer-events-none disabled:text-ink-faint"
            >
              {cooldown > 0 ? t('auth.assisted.resendIn', { seconds: cooldown }) : t('auth.assisted.resend')}
            </button>
          </div>
        </form>
      )}

      {step === 'password' && (
        <form onSubmit={onSubmitPassword} className="space-y-4" noValidate>
          <AuthField
            id="assisted-password"
            label={t('auth.assisted.newPasswordLabel')}
            type="password"
            autoComplete="new-password"
            placeholder={t('auth.assisted.newPasswordPlaceholder')}
            revealLabels={{ show: t('auth.assisted.showPassword'), hide: t('auth.assisted.hidePassword') }}
            errorMessage={
              fieldErrorKey(passwordForm.formState.errors.password) &&
              t(fieldErrorKey(passwordForm.formState.errors.password)!)
            }
            {...passwordForm.register('password')}
          />

          <AuthField
            id="assisted-confirm-password"
            label={t('auth.assisted.confirmPasswordLabel')}
            type="password"
            autoComplete="new-password"
            placeholder={t('auth.assisted.confirmPasswordPlaceholder')}
            revealLabels={{ show: t('auth.assisted.showPassword'), hide: t('auth.assisted.hidePassword') }}
            errorMessage={
              fieldErrorKey(passwordForm.formState.errors.confirmPassword) &&
              t(fieldErrorKey(passwordForm.formState.errors.confirmPassword)!)
            }
            {...passwordForm.register('confirmPassword')}
          />

          {failureMessage && <FlowError message={failureMessage} />}

          <div className="pt-1">
            <AuthSubmitButton
              label={t('auth.assisted.savePassword')}
              pendingLabel={t('auth.assisted.saving')}
              isPending={verifyCode.isPending}
            />
          </div>
        </form>
      )}
    </div>
  )
}

function FlowError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-[10px] border border-destructive/25 bg-destructive/10 px-3.5 py-3 text-[13px] font-medium text-destructive"
    >
      <AlertCircleIcon className="mt-px h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  )
}
