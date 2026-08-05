import { enUS, es, ptBR, type Locale } from 'date-fns/locale'
import { useEffect, useState, type ComponentProps } from 'react'
import { useTranslation } from 'react-i18next'

import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import { formatBrDateString, parseBrDateString, parseDateString, toDateString } from '@/lib/date'
import { cn } from '@/lib/utils'
import { CalendarIcon } from '@/shared/icons/calendar-icon'

const DATE_FNS_LOCALES: Record<string, Locale> = { 'pt-BR': ptBR, en: enUS, es }

interface DatePickerFieldProps extends Omit<ComponentProps<typeof Input>, 'value' | 'onChange' | 'type'> {
  value: string
  onValueChange: (value: string) => void
}

// Strips everything but digits and re-inserts the dd-MM-yyyy dashes as the user types, so typing
// "10032020" (or pasting it) becomes "10-03-2020" without the user having to type the dashes
// themselves. Deliberately simple (no cursor-position tracking) — good enough for append/backspace
// typing and full paste, which covers how this field is actually used.
//
// A pasted (or programmatically set) full ISO value is recognized as-is rather than run through
// the digit-reordering mask — otherwise "2026-08-05" would be misread as day="20" month="26".
function maskBrDateInput(rawValue: string): string {
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(rawValue.trim())
  if (isoMatch) {
    const [, year, month, day] = isoMatch
    return `${day}-${month}-${year}`
  }

  const digits = rawValue.replace(/\D/g, '').slice(0, 8)
  const day = digits.slice(0, 2)
  const month = digits.slice(2, 4)
  const year = digits.slice(4, 8)
  return [day, month, year].filter(Boolean).join('-')
}

// Displays and accepts typed input in the Brazilian dd-MM-yyyy standard, while the value passed
// to/from the form (and the API) stays ISO (yyyy-MM-dd) — kept as a real labeled input so it
// stays compatible with RHF/tests — paired with a calendar-icon trigger that opens the shared
// Calendar in a popover.
export function DatePickerField({ id, value, onValueChange, placeholder, disabled, className, ...inputProps }: DatePickerFieldProps) {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const locale = DATE_FNS_LOCALES[i18n.language] ?? ptBR
  // RHF's field.value can be `undefined` before a form's defaultValues resolve, even though the
  // prop type says `string`.
  const safeValue = value ?? ''
  const selectedDate = parseDateString(safeValue)

  // Local text mirrors the ISO value formatted as dd-MM-yyyy, but only re-syncs when the ISO
  // value itself changes (calendar pick, form reset) — not on every keystroke — so an in-progress,
  // not-yet-complete date the user is typing isn't clobbered.
  const [text, setText] = useState(() => formatBrDateString(safeValue))
  useEffect(() => {
    setText(formatBrDateString(safeValue))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeValue])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor>
        <div className="relative">
          <Input
            id={id}
            value={text}
            onChange={(event) => {
              const nextText = maskBrDateInput(event.target.value)
              setText(nextText)
              const parsed = parseBrDateString(nextText) ?? parseDateString(nextText)
              if (parsed) onValueChange(toDateString(parsed))
            }}
            onClick={() => setOpen(true)}
            onFocus={() => setOpen(true)}
            placeholder={placeholder ?? t('common.datePicker.placeholder')}
            disabled={disabled}
            autoComplete="off"
            inputMode="numeric"
            maxLength={10}
            className={cn('pr-9', className)}
            {...inputProps}
          />
          <button
            type="button"
            disabled={disabled}
            aria-label={t('common.datePicker.openLabel')}
            onClick={() => setOpen(true)}
            className="absolute inset-y-0 right-0 flex w-8 items-center justify-center text-ink-muted transition-colors hover:text-ink disabled:pointer-events-none disabled:opacity-50"
          >
            <CalendarIcon className="h-4 w-4" />
          </button>
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        className="w-auto p-0"
        // Radix focuses the first focusable element inside the content by default when it opens —
        // here that's a calendar day, which would steal focus away from the input the moment the
        // popover opens (via click/focus), breaking typing. Keep focus on the input instead.
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <Calendar
          mode="single"
          locale={locale}
          captionLayout="dropdown"
          defaultMonth={selectedDate}
          selected={selectedDate}
          onSelect={(date) => {
            if (date) {
              onValueChange(toDateString(date))
              setOpen(false)
            }
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
