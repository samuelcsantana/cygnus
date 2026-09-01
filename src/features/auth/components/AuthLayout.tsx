import { useTranslation } from 'react-i18next'
import { Link, Outlet, useMatches } from 'react-router-dom'

import authHeroUrl from '@/assets/auth-hero.avif'
import { cn } from '@/lib/utils'

import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher'
import { ThemeToggle } from '@/shared/components/ThemeToggle'
import { BellIcon } from '@/shared/icons/bell-icon'
import { CalendarIcon } from '@/shared/icons/calendar-icon'
import { CheckIcon } from '@/shared/icons/check-icon'
import { LogoIcon } from '@/shared/icons/logo-icon'
import { SparkleIcon } from '@/shared/icons/sparkle-icon'

import { AuthBackdrop } from './AuthBackdrop'
import { AuthTabs } from './AuthTabs'

// Real icons rather than emoji: emoji render as a different glyph on every
// platform, so the panel could not be trusted to look the same twice.
const FEATURES = [
  { Icon: CalendarIcon, title: 'auth.brand.featureVaccinesTitle', hint: 'auth.brand.featureVaccinesHint' },
  { Icon: SparkleIcon, title: 'auth.brand.featureMilestonesTitle', hint: 'auth.brand.featureMilestonesHint' },
  { Icon: BellIcon, title: 'auth.brand.featureAlertsTitle', hint: 'auth.brand.featureAlertsHint' },
] as const

/**
 * Set by the two routes that belong to the segmented control, and by nothing
 * else. A route that shares this shell without being one of the pair — today
 * `/invites/:code`, which is neither "sign in" nor "sign up" — simply omits it
 * and opts out of both the tabs and the height floor.
 *
 * A route flag rather than a pathname check in the layout: the layout should
 * not have to know which URLs exist, and a fourth public screen added later
 * gets the right default by saying nothing.
 */
export interface AuthRouteHandle {
  authTabs?: boolean
}

/**
 * The shell behind /login, /register and /invites/:code, wired in router.tsx as
 * the parent route of all three rather than rendered inside each one.
 *
 * That is not a tidiness preference. As siblings, each route rendered its own
 * copy, so switching tabs unmounted this entire subtree and built a new one:
 * new card, new panel, new <img> for the photograph — measured, the DOM nodes
 * came back tagged as fresh. Under one parent route React keeps the shell
 * mounted and swaps only what is inside the Outlet.
 *
 * The invite joined in 01/09/2026. It was the last public screen still drawing
 * its own full-page shell, which made the one flow that crosses both — follow
 * an invite, get sent to /login, come back — change identity halfway through.
 */
export function AuthLayout() {
  const { t } = useTranslation()
  const matches = useMatches()
  const showsTabs = matches.some((match) => (match.handle as AuthRouteHandle | undefined)?.authTabs === true)

  return (
    <div className="relative flex min-h-dvh flex-col bg-surface">
      <AuthBackdrop />

      {/* The hero photograph, below `lg` only. Above that the brand panel
          carries it, and showing it in both places would be the same image
          twice on one screen.

          It exists here because the panel is `lg:flex`, so until 01/09/2026 the
          photograph — half the identity of these screens — did not exist on a
          phone, which is where most of this app's traffic is.

          The scrim is a vertical gradient, opaque at both ends and thin in the
          middle, and that shape is not decoration: the only text painted on
          this background is the theme/language row at the top and the
          copyright and legal links at the bottom. The middle is covered by the
          card, which is opaque at every width for exactly this reason, so the
          photograph can be read there at full strength while no glyph is ever
          composited over it. Same technique as the panel's own bottom scrim.

          The bottom stop lands at 88%, not 100%, and the 12% below it is solid
          surface. That is where the copyright and the two legal links sit, and
          they are 12px `ink-faint`: with the gradient still interpolating under
          them the composite read rgb(225,227,224) and the ratio was 4.03:1,
          under the 4.5 floor. Solid surface there restores the 4.75:1 that
          token is measured at.

          Nothing here is gate-covered: axe reads the nearest opaque ancestor
          and sees neither the <img> nor a sibling gradient. The measured ratios
          are in AUTH.md §3.1 and the probe that produced them is
          `verification/auth-chrome-contrast.mjs` — re-run it if the stops, the
          photograph or the chrome's position move. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden lg:hidden">
        <img src={authHeroUrl} alt="" decoding="async" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-surface via-surface/25 via-45% to-surface to-88%" />
      </div>

      <div className="relative z-10 flex flex-1 flex-col px-4 pt-4 pb-6 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8">
        {/* Not in the reference, which shows neither control. Kept because the
            app ships three locales and a dark theme, and this is the only
            screen an unauthenticated user can reach to choose either. */}
        <div className="flex items-center justify-end gap-1.5">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>

        <main className="flex flex-1 items-center justify-center py-6 sm:py-8">
          {/* 896px wide, split 44/56 — measured off the reference, where the
              panel is 394px of an 896px card.

              One floor per breakpoint, so the card never resizes when the
              segmented control switches routes — otherwise the card is centred
              in the page, its height changes by the 25px of register's third
              field, and the tab bar itself drops 13px on the way to /login.

              Three values rather than one because the height is set by how the
              copy wraps at that column width. Re-swept from 360 to 1920 on
              01/09/2026, after the card gained padding below `sm` to sit on the
              photograph: register measures 807 below `sm`, 818 up to `lg` and
              710 above it, with login 46px under the first and 25px under the
              other two. The floors are those numbers, rounded up.

              The band below `sm` is flat at 786 from 380 to 620 and jumps to
              807 at 360 alone, where a line of copy wraps — so the floor is set
              by the narrowest phone, not by the typical one.

              If either form gains or loses a row, re-measure. This exact
              regression already happened once: the padding change took login
              from 752 to 761 past a 752 floor, and the segmented control
              started drifting 4px again. `layout.mjs` is what caught it. */}
          <div
            className={cn(
              'grid w-full max-w-[26rem] grid-cols-1 overflow-hidden rounded-3xl border border-border/70 bg-card shadow-2xl shadow-emerald-900/12 lg:max-w-[56rem] lg:grid-cols-[11fr_14fr] dark:shadow-black/40',
              // The floor belongs to the tabbed pair, not to the shell: see above.
              showsTabs && 'min-h-[50.5rem] sm:min-h-[51.25rem] lg:min-h-[44.5rem]',
            )}
          >
            {/* Brand panel, desktop only. The gradient is 165° — near-vertical
                with a slight rightward tilt — because that is what the
                reference samples to: #065f46 at the top, #047354 at half
                height, #098c65 at the bottom, while the horizontal shift
                across the panel is only ~10 units. A `to-br` diagonal, which
                is the obvious first guess, gets the middle right and both
                bottom corners wrong.

                The scrim below it is not in the reference, and is the one
                deliberate departure: the reference's own bottom third puts
                11.5px text on #098c65 — 4.26:1 for white, and about 2.9:1 for
                the dimmed grey it actually uses, both under the AA floor this
                repo gates on. Pulling emerald-900 back in over the bottom
                three fifths lands every line of panel copy between 4.73:1 and
                5.92:1 (measured on the composited pixels, not estimated) and
                changes nothing where text is not sitting. axe cannot evaluate
                text over a gradient at all, so nothing here is gate-covered:
                re-measure if the stops, the scrim or the copy positions move. */}
            {/* `isolate` is load-bearing: the two blend modes below composite
                against whatever sits under them *in the same stacking context*,
                and neither `relative` nor `overflow-hidden` opens one. Without
                it the photograph blends with the page behind the card rather
                than with this panel's own emerald. */}
            <div className="relative isolate hidden flex-col overflow-hidden bg-emerald-900 p-10 lg:flex">
              {/* Decorative, so alt="" — the panel's own copy already says
                  everything this photograph says. object-cover on a 3:4 source
                  in a ~4:7 panel crops the sides, which is why it is centred:
                  the two hands sit mid-frame and survive the crop. */}
              <img
                src={authHeroUrl}
                alt=""
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover mix-blend-luminosity"
              />
              {/* Darkened by multiplying rather than by a flat veil. A veil at
                  this strength would drag the bright and the dark parts of the
                  photograph toward the same value and flatten it into texture;
                  multiply scales them, so the grip stays readable while the
                  whole panel drops far enough for white type. */}
              <div aria-hidden className="absolute inset-0 bg-emerald-950/55 mix-blend-multiply" />
              <div aria-hidden className="absolute inset-0 bg-linear-165 from-emerald-900/45 via-emerald-800/30 to-emerald-700/25" />
              <div aria-hidden className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-emerald-950/65 to-transparent" />

              <div className="relative z-10 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/20">
                  <LogoIcon className="h-5 w-5" />
                </span>
                <span className="font-display text-[17px] font-extrabold tracking-tight text-white">
                  {t('common.appName')}
                </span>
              </div>

              <div className="relative z-10 mt-14">
                <span aria-hidden className="mb-6 block h-[3px] w-7 rounded-full bg-emerald-500" />
                {/* Marketing copy, not the page heading: the <h1> is the screen
                    title in the form column, the one element present at every
                    breakpoint. A heading here would be the document's first
                    heading on desktop and missing entirely on mobile. */}
                <p className="font-display text-[34px] leading-[1.15] font-extrabold tracking-tight text-white">
                  {t('auth.brand.headline')}
                </p>
                <p className="mt-4 max-w-[19rem] text-[13.5px] leading-relaxed text-emerald-50">
                  {t('auth.brand.tagline')}
                </p>
              </div>

              <ul className="relative z-10 mt-9 flex flex-col gap-4">
                {FEATURES.map(({ Icon, title, hint }) => (
                  <li key={title} className="flex items-start gap-3">
                    <span className="mt-px flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-white/10 text-white ring-1 ring-white/15">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="flex flex-col">
                      <span className="text-[13px] leading-5 font-semibold text-white">{t(title)}</span>
                      <span className="text-[11.5px] leading-4 text-emerald-50">{t(hint)}</span>
                    </span>
                  </li>
                ))}
              </ul>

              <p className="relative z-10 mt-auto flex items-center gap-2 border-t border-white/15 pt-6 text-[11.5px] text-emerald-50">
                <CheckIcon className="h-3.5 w-3.5 shrink-0" />
                {t('auth.brand.trust')}
              </p>
            </div>

            {/* Form column. The card is opaque and bordered at every width,
                including below `sm`, where it used to be bare.

                That reversed a deliberate call — the form sat straight on the
                wash to avoid a box inside a box on a phone. The photograph
                behind it is what changed the arithmetic: without an opaque
                card, every label, input and tab would be composited over
                photograph pixels, and that is the one contrast case no gate in
                this repo can see. A box inside a box costs a little air; text
                over a photograph costs legibility that nothing measures. */}
            {/* Top-anchored on purpose. With the column centred, the floor
                above only moves the problem: the shorter route floats down by
                half the difference and takes the segmented control with it.
                Anchored, the tabs sit a fixed distance below the card's top
                edge and the slack all falls to the bottom, where nothing is. */}
            <div className="flex flex-col justify-start p-6 sm:p-10 lg:p-12">
              <div className="animate-fade-in-up w-full">
                <div className="mb-8 flex flex-col items-center lg:hidden">
                  <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-[18px] bg-gradient-to-br from-emerald-800 to-emerald-600 text-white">
                    <LogoIcon className="h-7 w-7" />
                  </span>
                  <span className="font-display text-base font-extrabold tracking-tight text-ink">
                    {t('common.appName')}
                  </span>
                </div>

                {showsTabs && <AuthTabs />}
                <Outlet />
              </div>
            </div>
          </div>
        </main>

        <p className="text-center text-xs text-ink-faint">
          {t('auth.brand.copyright', { year: new Date().getFullYear() })} · {t('auth.brand.footerNote')}
        </p>
        {/* Os dois documentos ficam alcançáveis das telas públicas, que é onde
            alguém decide se cria a conta. Links de texto inline: o critério
            2.5.8 tem exceção para eles, e crescê-los mudaria a tipografia do
            rodapé sem melhorar a ergonomia. */}
        <p className="text-center text-xs text-ink-faint">
          <Link to="/privacidade" className="underline-offset-4 hover:underline">
            {t('legal.footerPrivacy')}
          </Link>
          {' · '}
          <Link to="/termos" className="underline-offset-4 hover:underline">
            {t('legal.footerTerms')}
          </Link>
        </p>
      </div>
    </div>
  )
}
