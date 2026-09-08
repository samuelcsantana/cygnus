import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { GoogleSignInButton } from './GoogleSignInButton'

/**
 * Shared styling for the alternatives to the primary action. They are secondary
 * buttons rather than links because each one starts a sign-in, and they are
 * identical to each other on purpose: no method here is the recommended one.
 */
export const AUTH_ALTERNATIVE_CLASS =
  'flex h-12 w-full items-center justify-center gap-2.5 rounded-[10px] border border-border bg-card text-sm font-medium text-ink transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-emerald-600/40 focus-visible:outline-none'

interface AuthSocialSectionProps {
  /** Extra alternatives, stacked under the Google button (sign-in only). */
  children?: ReactNode
}

/**
 * "or" rule plus the alternative sign-in methods.
 *
 * Availability comes from the API, which owns the Google OAuth configuration.
 */
export function AuthSocialSection({ children }: AuthSocialSectionProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3" aria-hidden>
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-ink-faint">{t('auth.social.or')}</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <div className="space-y-3">
        <GoogleSignInButton />

        {children}
      </div>
    </div>
  )
}
