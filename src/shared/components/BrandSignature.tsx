import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { LogoIcon } from '@/shared/icons/logo-icon'

interface BrandSignatureProps {
  inverse?: boolean
  compact?: boolean
}

/** Keep the monogram at the same proportion as the installed app icon. */
export function BrandSignature({ inverse = false, compact = false }: BrandSignatureProps) {
  const { t } = useTranslation()
  return (
    <span className="inline-flex items-center gap-3">
      <span aria-hidden="true" className={cn(
        'flex shrink-0 items-center justify-center rounded-xl',
        compact ? 'size-10' : 'size-12',
        inverse ? 'bg-white text-emerald-800' : 'bg-primary text-primary-foreground',
      )}>
        <LogoIcon className="h-[77.5%] w-[77.5%]" />
      </span>
      <span className={cn('font-display font-extrabold tracking-tight', compact ? 'text-xl' : 'text-2xl', inverse ? 'text-white' : 'text-ink')}>
        {t('common.appName')}
      </span>
    </span>
  )
}
