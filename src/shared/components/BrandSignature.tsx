import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { BrandMark } from './BrandMark'

interface BrandSignatureProps {
  inverse?: boolean
  compact?: boolean
}

/** The mark carries its own night background, so the same drawing works on light and dark surfaces. */
export function BrandSignature({ inverse = false, compact = false }: BrandSignatureProps) {
  const { t } = useTranslation()
  return (
    <span className="inline-flex items-center gap-3">
      <BrandMark
        className={cn(
          compact ? 'size-10' : 'size-12',
          // On the dark green auth panel the navy tile would sink into the background without an edge.
          inverse && 'rounded-[22.5%] ring-1 ring-white/20',
        )}
      />
      <span className={cn('font-display font-extrabold tracking-tight', compact ? 'text-xl' : 'text-2xl', inverse ? 'text-white' : 'text-ink')}>
        {t('common.appName')}
      </span>
    </span>
  )
}
