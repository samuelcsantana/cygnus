import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { LogoIcon } from '@/shared/icons/logo-icon'

interface ErrorFallbackProps {
  onReload: () => void
}

export function ErrorFallback({ onReload }: ErrorFallbackProps) {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="bg-primary/10 text-primary mb-2 inline-flex h-16 w-16 items-center justify-center rounded-2xl">
        <LogoIcon className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900">{t('errors.boundary.title')}</h1>
      <p className="max-w-md text-slate-500">{t('errors.boundary.description')}</p>
      <Button onClick={onReload}>{t('errors.boundary.reload')}</Button>
    </div>
  )
}
