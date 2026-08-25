import { useState, type ComponentProps, type ReactNode } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { AlertCircleIcon } from '@/shared/icons/alert-circle-icon'
import { EyeIcon } from '@/shared/icons/eye-icon'
import { EyeOffIcon } from '@/shared/icons/eye-off-icon'

interface RevealLabels {
  show: string
  hide: string
}

interface AuthFieldProps extends Omit<ComponentProps<'input'>, 'id'> {
  id: string
  label: string
  /** Already-translated message, or null when the field is valid. */
  errorMessage?: string | null
  /** Present only on password fields: turns on the reveal toggle. */
  revealLabels?: RevealLabels
  /**
   * Rendered opposite the label, on the same row — where "forgot my password"
   * belongs. Putting it there rather than under the field is what keeps it from
   * adding a row of its own to the form's height.
   */
  labelAction?: ReactNode
}

/**
 * One labelled field for the auth screens: 44px tall, tinted fill, hairline
 * border, message slot underneath. Login and register share it so the two
 * screens behind the same segmented control cannot drift apart — which is
 * exactly what had happened before (48px fields on one, 32px on the other).
 *
 * The Input primitive's own sizing is tuned for dense in-app forms; the
 * overrides here are the auth-screen scale, and `text-base` below `md` stays
 * because a smaller font makes iOS Safari zoom the viewport on focus.
 */
export function AuthField({
  id,
  label,
  errorMessage,
  revealLabels,
  labelAction,
  className,
  type,
  ...props
}: AuthFieldProps) {
  const [isRevealed, setIsRevealed] = useState(false)
  const errorId = `${id}-error`
  const inputType = revealLabels ? (isRevealed ? 'text' : 'password') : type

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={id} className="text-[13px] font-medium text-ink">
          {label}
        </Label>
        {labelAction}
      </div>

      <div className="relative">
        <Input
          id={id}
          type={inputType}
          aria-invalid={!!errorMessage}
          aria-describedby={errorMessage ? errorId : undefined}
          className={cn(
            // The fill is a tint of the card from `sm` up, matching the
            // reference's #fafafa-on-white. Below `sm` there is no card — the
            // form sits on the ambient wash — and a translucent fill would let
            // that wash bleed through the field, so it goes opaque instead.
            'h-11 rounded-[10px] border-border bg-card px-3.5 text-base shadow-none transition-[color,box-shadow,border-color] placeholder:text-ink-faint focus-visible:border-emerald-600 focus-visible:ring-emerald-600/25 sm:bg-muted/50 md:text-sm',
            revealLabels && 'pr-11',
            className,
          )}
          {...props}
        />

        {revealLabels && (
          // The label names the action the press performs, so it flips with the
          // state: a fixed label plus aria-pressed reads as "show password,
          // pressed", which leaves it ambiguous what is currently on screen.
          <button
            type="button"
            onClick={() => setIsRevealed((revealed) => !revealed)}
            aria-label={isRevealed ? revealLabels.hide : revealLabels.show}
            className="absolute top-1/2 right-1 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-ink-faint transition-colors hover:bg-muted hover:text-ink focus-visible:ring-3 focus-visible:ring-emerald-600/40 focus-visible:outline-none"
          >
            {isRevealed ? <EyeOffIcon className="h-[18px] w-[18px]" /> : <EyeIcon className="h-[18px] w-[18px]" />}
          </button>
        )}
      </div>

      {errorMessage && (
        <p id={errorId} className="flex items-center gap-1.5 text-[13px] font-medium text-destructive">
          <AlertCircleIcon className="h-3.5 w-3.5 shrink-0" />
          {errorMessage}
        </p>
      )}
    </div>
  )
}
