import { useId, type CSSProperties } from 'react'
import { cn } from '@/lib/utils'
import { BRAND_MARK_FACES, BRAND_MARK_SKY, BRAND_MARK_STAR_FILL, BRAND_MARK_STARS } from '@/shared/brand-mark'

/**
 * The Cygnus mark: an origami swan on a night sky, with three stars.
 *
 * **Why a swan.** Cygnus is the Swan constellation, so the mark and the name tell one story, and
 * swans carry their young on their backs, which is what this app is for. The three stars stand for
 * the constellation without drawing it: drawn as a constellation (dots joined by lines), the Northern
 * Cross read as an "X" at icon size.
 *
 * **Why no dots anywhere.** The first mark was a nest, and three rounds of nest pictograms collided
 * with stronger symbols: a bowl with an egg on top read as a person, two eggs as a smiling face, a
 * ring with an egg inside as an eye, a nest seen from above as Wi-Fi. A curve with dots is the
 * vocabulary of faces, and a 24px monochrome glyph cannot escape it. That is why the stars are
 * four-pointed and the swan has no eye.
 *
 * **Why polygons and not a font or a raster.** The previous mark was a letter outlined from Fraunces
 * so it would never wait for a font download. The same holds here: flat polygons in a 64 unit box,
 * which stay sharp from the 16px browser tab to the 512px install icon.
 *
 * The drawing itself lives in `shared/brand-mark.ts`, next to the SVG it must match.
 */
interface BrandMarkProps {
  className?: string
  /**
   * Fold the paper into the swan as it appears: the faces arrive one by one
   * and the stars light last (option 35; the motion is in index.css, under
   * `[data-mark-fold]`). The caller decides when — BrandSignature does it once
   * per visit, on the first screen.
   */
  fold?: boolean
}

/** Decorative: every place that shows the mark also shows the name, so it stays hidden from assistive tech. */
export function BrandMark({ className, fold = false }: BrandMarkProps) {
  // The mark is drawn several times on one page (sidebar, dialogs), and a gradient referenced by a
  // duplicated id resolves to whichever copy comes first — which may sit inside a hidden subtree and
  // not paint. useId is unique per instance, but React 19 wraps it in characters that are not safe
  // inside url(#…), so only letters, digits, "-" and "_" are kept.
  const skyId = `brand-sky-${useId().replace(/[^A-Za-z0-9_-]/g, '')}`
  return (
    // block: an inline svg sits on a text baseline and leaves a few pixels of descender space below it.
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
      data-mark-fold={fold || undefined}
      className={cn('block shrink-0', className)}
    >
      <defs>
        <linearGradient id={skyId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={BRAND_MARK_SKY[0]} />
          <stop offset="1" stopColor={BRAND_MARK_SKY[1]} />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14.4" fill={`url(#${skyId})`} />
      {BRAND_MARK_FACES.map((face, index) => (
        // `--k` orders the fold, back faces first, as the drawing is layered.
        <polygon key={face.points} points={face.points} fill={face.fill} style={{ '--k': index } as CSSProperties} />
      ))}
      {BRAND_MARK_STARS.map((d) => (
        <path key={d} d={d} fill={BRAND_MARK_STAR_FILL} />
      ))}
    </svg>
  )
}
