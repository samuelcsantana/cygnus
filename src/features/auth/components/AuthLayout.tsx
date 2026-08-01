import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher'
import { LogoIcon } from '@/shared/icons/logo-icon'

interface AuthLayoutProps {
  children: ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen flex-1">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-primary p-12 lg:flex">
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary to-indigo-600 opacity-90" />
        <div className="absolute top-[-10%] left-[-10%] z-0 h-96 w-96 rounded-full bg-white opacity-10 blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] z-0 h-[30rem] w-[30rem] rounded-full bg-indigo-300 opacity-20 blur-3xl" />

        <div className="relative z-10">
          <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-md">
            <LogoIcon className="h-6 w-6" />
          </div>
          <h1 className="text-5xl font-extrabold leading-tight tracking-tight text-white">
            {t('common.appName')}
          </h1>
          <p className="mt-4 max-w-md text-xl font-light text-teal-50">{t('auth.login.brandTagline')}</p>
        </div>

        <div className="relative z-10 flex items-center gap-4 text-sm text-white/80">
          <span>{t('auth.login.copyright', { year: new Date().getFullYear() })}</span>
        </div>
      </div>

      <div className="relative flex w-full items-center justify-center bg-white p-8 sm:p-12 lg:w-1/2">
        <div className="absolute top-6 right-6">
          <LanguageSwitcher />
        </div>

        <div className="animate-fade-in-up w-full max-w-md">
          <div className="mb-10 text-center lg:hidden">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <LogoIcon className="h-8 w-8" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900">{t('common.appName')}</h2>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}
