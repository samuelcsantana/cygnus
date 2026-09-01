import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Opaque field background — a deliberate departure from the generated shadcn file.
 *
 * The default is `bg-transparent`, which only works over white. `AppShellLayout`
 * paints the page with `bg-surface` (#f6f7f4), so on every screen of the app —
 * and not inside a dialog, where the white card hid it — the page grey showed
 * through the field and it stopped reading as a field. Spotted first on the
 * `/vaccines` search.
 *
 * `bg-background` works in both places: over the page the field is the only
 * white thing and stands out; over a white card it merges with the surface and
 * the border defines it, which is the ordinary form drawing.
 *
 * Dark mode is unchanged: `dark:bg-input/30` beats the base variant under
 * `.dark`, and the problem never existed there — a translucent lift over a dark
 * surface is subtle and legible.
 *
 * The same applies to `textarea.tsx` and the `SelectTrigger` in `select.tsx`:
 * all three are fields, and a field owns its background.
 */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-background px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
