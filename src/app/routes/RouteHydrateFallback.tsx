import { useTranslation } from 'react-i18next'

export function RouteHydrateFallback() {
  const { t } = useTranslation()

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6" aria-busy="true">
      <div role="status" aria-live="polite" className="flex flex-col items-center gap-3 text-muted-foreground">
        <div aria-hidden="true" className="border-t-transparent h-8 w-8 animate-spin rounded-full border-2 border-primary" />
        <span className="text-sm font-medium">{t('common.loading')}</span>
      </div>
    </main>
  )
}
