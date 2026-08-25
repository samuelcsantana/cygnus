import { Button } from '@/components/ui/button'
import { useSmoothPending } from '@/hooks/useSmoothPending'
import { cn } from '@/lib/utils'
import { SpinnerIcon } from '@/shared/icons/spinner-icon'

interface AuthSubmitButtonProps {
  label: string
  pendingLabel: string
  isPending: boolean
}

/**
 * The primary action on both auth screens.
 *
 * The fill is the design reference's emerald ramp (800 → 600, left to right),
 * not `--primary`: the reference's green is a different hue from the app's teal
 * token, and the two auth screens are the only place it appears. Promoting it
 * app-wide is a one-token change in index.css, not a change here.
 *
 * `bg-emerald-800` is listed alongside the gradient on purpose — it beats the
 * variant's `bg-primary` in tailwind-merge (same group, last wins), so no stale
 * teal is left painting underneath. White text is pinned rather than inherited
 * from --primary-foreground, which flips to near-black in dark mode while this
 * fill stays emerald. Contrast: white on the stop under the centred label runs
 * 5.1–5.6:1; the 600 end alone would be 3.8:1, which is why no label is ever
 * allowed to reach it (the fixed max-width keeps them centred).
 */
export function AuthSubmitButton({ label, pendingLabel, isPending }: AuthSubmitButtonProps) {
  // What the user sees is smoothed; what the button *does* is not. The press is
  // refused from the first millisecond, while the spinner only appears if the
  // request is actually slow enough to be worth mentioning.
  const showPending = useSmoothPending(isPending)

  return (
    <Button
      type="submit"
      disabled={isPending}
      aria-busy={isPending}
      className={cn(
        'h-12 w-full rounded-[10px] bg-emerald-800 bg-gradient-to-r from-emerald-800 to-emerald-600 text-[15px] font-semibold text-white shadow-lg shadow-emerald-900/20 transition-all hover:bg-emerald-900 hover:from-emerald-900 hover:to-emerald-700 hover:shadow-emerald-900/30 dark:shadow-emerald-950/40',
        // The button is disabled while the request is in flight, but the base
        // variant's `disabled:opacity-50` washes the fill out until "Entrando…"
        // is barely legible — and a request in progress is not an inactive
        // control the user should read as unavailable. The spinner already says
        // it cannot be pressed. Written as the same `disabled:` variant so
        // tailwind-merge drops the 50 rather than emitting both and leaving the
        // winner to source order.
        showPending && 'disabled:opacity-100',
      )}
    >
      {showPending ? (
        <>
          <SpinnerIcon className="h-4 w-4 animate-spin" />
          {pendingLabel}
        </>
      ) : (
        label
      )}
    </Button>
  )
}
