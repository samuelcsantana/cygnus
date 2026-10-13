import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { cn } from '@/lib/utils'
import { PUBLIC_CONTAINER } from '@/shared/public-layout'

import { BrandSignature } from './BrandSignature'
import { LanguageSwitcher } from './LanguageSwitcher'
import { ThemeToggle } from './ThemeToggle'

interface PublicHeaderBarProps {
  /** Page actions, placed before the theme and language controls ("Entrar", the demo). */
  children?: ReactNode
}

/**
 * The header row of the public screens: the mark, linking home, on the left; the page's actions,
 * then theme and language, on the right.
 *
 * The landing page and the sign-in screens share it, so going from one to the other changes the
 * content under the header and nothing in it: the mark, the theme button and the language switcher
 * stay where the pointer left them. The wrapping `<header>` is the caller's, because only the
 * landing page's sticks and settles as it scrolls.
 */
export function PublicHeaderBar({ children }: PublicHeaderBarProps) {
  const { t } = useTranslation()

  return (
    <div className={cn(PUBLIC_CONTAINER, 'flex h-[72px] items-center gap-3')}>
      <Link
        to="/"
        aria-label={t('landing.nav.home')}
        className="rounded-lg focus-visible:ring-3 focus-visible:ring-emerald-600/40 focus-visible:outline-none"
      >
        <BrandSignature compact />
      </Link>
      {/* The theme and language controls sit at the right edge, after the
          actions. Placed before them, they moved 30–35px every time the
          language changed, because "Entrar" and "Ver demonstração" change
          width with it, and the next click landed on the wrong code. At the
          edge, with a fixed width, they stay under the pointer. */}
      <div className="ml-auto flex items-center gap-1.5">
        {children}
        {children ? <span aria-hidden className="mx-1 hidden h-6 w-px bg-border sm:block" /> : null}
        <ThemeToggle />
        <LanguageSwitcher />
      </div>
    </div>
  )
}
