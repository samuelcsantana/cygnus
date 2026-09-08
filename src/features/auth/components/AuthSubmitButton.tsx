import { Button } from '@/components/ui/button'
import { useSmoothPending } from '@/hooks/useSmoothPending'
import { cn } from '@/lib/utils'
import { SpinnerIcon } from '@/shared/icons/spinner-icon'

interface AuthSubmitButtonProps {
  label: string
  pendingLabel: string
  isPending: boolean
}

/** A solid, muted green keeps white labels legible across the entire button. */
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
        'h-12 w-full rounded-xl bg-auth-button text-[15px] font-semibold text-white shadow-none transition-colors hover:bg-auth-button-hover',
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
