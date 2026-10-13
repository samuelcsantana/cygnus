import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

import { useTheme } from '@/hooks/useTheme'
import { config } from '@/lib/config'

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'cygnus-vaccine-schedule': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        limit?: number
        'api-origin'?: string
        theme?: 'light' | 'dark'
      }
    }
  }
}

const ELEMENT_NAME = 'cygnus-vaccine-schedule'
const NAVIGATE_EVENT = 'cygnus:navigate'
/** The published, unhashed widget script — the same URL a host site pastes. */
const EMBED_SCRIPT_SRC = '/embed/embed.js'

interface ScheduleWidgetShowcaseProps {
  /**
   * Where to load the widget from; `null` renders the element without loading
   * anything. Stories pass `null`: neither the Storybook server nor
   * `npm run dev` serves `/embed/embed.js` (it is built by `build:embed` and
   * served next to the app), and a box that stays empty there is the honest
   * result rather than a stand-in drawn to look like the widget.
   */
  scriptSrc?: string | null
}

/**
 * The real embed widget, running on the page that describes it.
 *
 * The landing page says "this card is the public widget", so it loads the
 * published `embed.js` and renders `<cygnus-vaccine-schedule>` exactly as a
 * clinic's or a blog's page would: a host of its own product. Nothing is
 * imported from `embed/` — `src/` and `embed/` stay apart, and the published
 * contract is consumed, not changed.
 *
 * Two host duties fall to this component, as they would to any host:
 * - **Navigation.** The widget never moves the page it sits in; its link emits
 *   `cygnus:navigate` instead (see `embed/protocol.ts`). Here the visitor is
 *   already on the app, so the link goes to sign-up.
 * - **The API origin.** The widget defaults to production; the app passes its
 *   own (`/api` behind the Vercel rewrite, `localhost:3005` locally).
 * - **The theme.** Left alone, the widget follows the OS, and the page has a
 *   theme switch of its own: light page, dark-mode OS, dark card. It gets the
 *   theme on screen, and flips with the switch without re-rendering.
 *
 * The request also wakes the free Render instance while the visitor is still
 * reading, which the sign-in a minute later benefits from.
 */
export function ScheduleWidgetShowcase({ scriptSrc = EMBED_SCRIPT_SRC }: ScheduleWidgetShowcaseProps) {
  const navigate = useNavigate()
  const { resolvedTheme } = useTheme()
  const elementRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!scriptSrc || customElements.get(ELEMENT_NAME)) return
    // Checked by selector, not by a flag: StrictMode runs this effect twice, and
    // a remount after navigating away and back must not add a second copy.
    if (document.querySelector(`script[src="${scriptSrc}"]`)) return

    const script = document.createElement('script')
    script.src = scriptSrc
    script.defer = true
    document.head.appendChild(script)
  }, [scriptSrc])

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const goToSignUp = () => navigate('/register')
    element.addEventListener(NAVIGATE_EVENT, goToSignUp)
    return () => element.removeEventListener(NAVIGATE_EVENT, goToSignUp)
  }, [navigate])

  return <cygnus-vaccine-schedule ref={elementRef} limit={8} api-origin={config.apiBaseUrl} theme={resolvedTheme} />
}
