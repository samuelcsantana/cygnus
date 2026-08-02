import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher'
import { LogoIcon } from '@/shared/icons/logo-icon'

interface AuthLayoutProps {
  children: ReactNode
}

const FEATURE_KEYS = [
  { emoji: '💉', key: 'auth.login.featureVaccines' },
  { emoji: '⭐', key: 'auth.login.featureMilestones' },
  { emoji: '🔔', key: 'auth.login.featureNotifications' },
] as const

export function AuthLayout({ children }: AuthLayoutProps) {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-50 via-surface to-amber-50 p-0 lg:p-6">
      <div className="grid w-full grid-cols-1 overflow-hidden bg-white lg:max-w-5xl lg:grid-cols-2 lg:rounded-[28px] lg:shadow-[0_24px_64px_rgba(42,157,143,0.12),0_4px_16px_rgba(0,0,0,0.06)]">
        <div className="relative hidden flex-col justify-between overflow-hidden bg-teal-600 p-11 lg:flex">
          <div className="absolute inset-0 z-0 bg-gradient-to-br from-teal-500 via-teal-600 to-teal-700" />
          <div className="absolute top-[-10%] left-[-10%] z-0 h-96 w-96 rounded-full bg-white opacity-10 blur-3xl" />
          <div className="absolute right-[-10%] bottom-[-10%] z-0 h-[30rem] w-[30rem] rounded-full bg-white opacity-5 blur-3xl" />

          <div className="relative z-10">
            <div className="mb-12 flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-md">
                <LogoIcon className="h-5 w-5" />
              </div>
              <span className="font-display text-xl font-extrabold tracking-tight text-white">
                {t('common.appName')}
              </span>
            </div>

            <h1 className="font-display text-4xl leading-tight font-black text-white">
              {t('auth.login.brandHeadline')}
            </h1>
            <p className="mt-4 max-w-xs text-[15px] leading-relaxed text-teal-50">
              {t('auth.login.brandTagline')}
            </p>
          </div>

          <div className="relative z-10 flex flex-col gap-3.5">
            {FEATURE_KEYS.map((feature) => (
              <div key={feature.key} className="flex items-center gap-3">
                <span className="text-lg">{feature.emoji}</span>
                <span className="text-[13px] font-medium text-white/85">{t(feature.key)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex w-full flex-col justify-center bg-white p-8 sm:p-12">
          <div className="absolute top-6 right-6">
            <LanguageSwitcher />
          </div>

          <div className="animate-fade-in-up w-full">
            <div className="mb-10 text-center lg:hidden">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <LogoIcon className="h-8 w-8" />
              </div>
              <h2 className="font-display text-3xl font-bold text-ink">{t('common.appName')}</h2>
            </div>

            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
