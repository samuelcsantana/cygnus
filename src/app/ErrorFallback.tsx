import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { BrandMark } from '@/shared/components/BrandMark'

interface ErrorFallbackProps {
  onReload: () => void
}

export function ErrorFallback({ onReload }: ErrorFallbackProps) {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <BrandMark className="mb-2 size-16" />
      <h1 className="text-2xl font-bold text-ink">{t('errors.boundary.title')}</h1>
      <p className="max-w-md text-ink-muted">{t('errors.boundary.description')}</p>
      <Button onClick={onReload}>{t('errors.boundary.reload')}</Button>
    </div>
  )
}
