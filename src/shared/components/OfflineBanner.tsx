import { useTranslation } from 'react-i18next'

import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { AlertCircleIcon } from '@/shared/icons/alert-circle-icon'

// Persistent (not dismissible) banner reflecting connectivity state rather
// than a one-off message — it should reappear automatically if the user goes
// offline again, so dismissing it would be misleading.
export function OfflineBanner() {
  const { t } = useTranslation()
  const isOnline = useOnlineStatus()

  if (isOnline) {
    return null
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-center text-[13px] font-semibold text-white"
    >
      <AlertCircleIcon className="h-4 w-4 flex-shrink-0" />
      {t('common.offline.message')}
    </div>
  )
}
