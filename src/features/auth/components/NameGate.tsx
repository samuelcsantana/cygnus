import { zodResolver } from '@hookform/resolvers/zod'
import type { ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCurrentUser } from '@/features/auth/api/auth.hooks'
import { useUpdateProfile } from '@/features/profile/api/profile.hooks'
import { LogoIcon } from '@/shared/icons/logo-icon'

const nameFormSchema = z.object({ name: z.string().trim().min(1) })
type NameFormInput = z.infer<typeof nameFormSchema>

/**
 * Asks the one thing a code cannot: what to call the person who just signed in.
 *
 * Signing in without a password creates the account from a verified code
 * (`cygnus-api` #35), and the name cannot be collected on the way in — a form
 * that asks for a name only when the address is unknown answers, out loud, the
 * question the whole assisted flow is built to refuse: whether that address has
 * an account here. After the session exists it reveals nothing, which is why it
 * is here and not on the login screen.
 *
 * **It is inert for every account that has a name**, which today is all of them:
 * the query is the one `ProtectedLayout` already makes, and a non-empty name
 * renders the children untouched. Same shape as `LegalAcceptanceGate`, and for
 * the same reason — this can ship before the API that creates nameless accounts,
 * rather than after it, so nobody is ever greeted as "Boa noite, !".
 *
 * While the answer is unknown, the app renders. A hiccup on `GET /auth/me` must
 * not stand between somebody and a health record they already have; the gate
 * exists to fill in a name, not to hold data hostage.
 */
export function NameGate({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const currentUser = useCurrentUser()
  const updateProfile = useUpdateProfile()

  const form = useForm<NameFormInput>({
    resolver: zodResolver(nameFormSchema),
    defaultValues: { name: '' },
  })

  const needsName = currentUser.data ? currentUser.data.name.trim().length === 0 : false

  if (!needsName) {
    return <>{children}</>
  }

  // Only the name goes up. Sending the e-mail back unchanged would be harmless
  // today and a trap tomorrow: `PATCH /users/me` asks for the current password
  // whenever the address changes, and a payload that always carries it is one
  // refactor away from tripping that. `useUpdateProfile` refreshes both the
  // query cache and the identity store, so the greeting is right the moment this
  // gate stops standing here.
  const onSubmit = form.handleSubmit(async (values) => {
    await updateProfile.mutateAsync({ name: values.name.trim() })
  })

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-5">
      <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-sm sm:p-8">
        <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <LogoIcon className="h-5 w-5" />
        </span>

        <h1 className="font-display text-2xl font-extrabold text-ink">{t('auth.nameGate.title')}</h1>
        <p className="mt-1 mb-6 text-ink-muted">{t('auth.nameGate.description')}</p>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div>
            <Label htmlFor="name-gate-name">{t('auth.nameGate.label')}</Label>
            <Input
              id="name-gate-name"
              autoFocus
              autoComplete="name"
              placeholder={t('auth.nameGate.placeholder')}
              aria-invalid={!!form.formState.errors.name}
              {...form.register('name')}
            />
            {form.formState.errors.name && (
              <p className="mt-1.5 text-sm text-rose-600 dark:text-rose-300">{t('auth.nameGate.required')}</p>
            )}
          </div>

          {updateProfile.isError && (
            <p className="text-sm text-rose-600 dark:text-rose-300">{t('auth.nameGate.error')}</p>
          )}

          <Button type="submit" size="cta" className="w-full rounded-2xl" disabled={updateProfile.isPending}>
            {updateProfile.isPending ? t('auth.nameGate.saving') : t('auth.nameGate.submit')}
          </Button>
        </form>
      </div>
    </div>
  )
}
