import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { BrandMark } from './BrandMark'

interface BrandSignatureProps {
  inverse?: boolean
  compact?: boolean
}

const FOLDED_THIS_VISIT_KEY = 'cygnus-mark-folded'

/**
 * Whether the mark should fold on this screen: yes for the first one of the
 * visit (the browser tab's session), no after. Folding on every page would
 * turn a greeting into a tic.
 *
 * Read in the state initializer and recorded after mount, so StrictMode's
 * double render and two signatures on one screen (the sign-in panel and its
 * phone-width twin) agree on the answer. Without session storage the answer
 * is no: the mark simply appears.
 */
function useFoldOncePerVisit(): boolean {
  const [fold] = useState(() => {
    try {
      return window.sessionStorage.getItem(FOLDED_THIS_VISIT_KEY) === null
    } catch {
      return false
    }
  })

  useEffect(() => {
    if (!fold) return
    try {
      window.sessionStorage.setItem(FOLDED_THIS_VISIT_KEY, '1')
    } catch {
      // Storage refused: the next screen may fold again, which is harmless.
    }
  }, [fold])

  return fold
}

/** The mark carries its own night background, so the same drawing works on light and dark surfaces. */
export function BrandSignature({ inverse = false, compact = false }: BrandSignatureProps) {
  const { t } = useTranslation()
  const fold = useFoldOncePerVisit()
  return (
    <span className="inline-flex items-center gap-3">
      <BrandMark
        fold={fold}
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
