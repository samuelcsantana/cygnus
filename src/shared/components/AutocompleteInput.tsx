import { useEffect, useId, useMemo, useRef, useState, type ComponentProps, type KeyboardEvent } from 'react'

import { Input } from '@/components/ui/input'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface AutocompleteInputProps extends Omit<ComponentProps<typeof Input>, 'value' | 'onChange'> {
  value: string
  onValueChange: (value: string) => void
  suggestions: string[]
  maxSuggestions?: number
}

// A free-text input backed by a filtered suggestion list: the user can pick a suggestion
// or keep typing their own value, so it never restricts submission to what's in `suggestions`.
export function AutocompleteInput({
  value,
  onValueChange,
  suggestions,
  maxSuggestions = 8,
  className,
  onFocus,
  onBlur,
  onKeyDown,
  ...inputProps
}: AutocompleteInputProps) {
  const [open, setOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const listboxId = useId()
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([])

  const filteredSuggestions = useMemo(() => {
    const query = value.trim().toLowerCase()
    const matches = query ? suggestions.filter((suggestion) => suggestion.toLowerCase().includes(query)) : suggestions
    return matches.slice(0, maxSuggestions)
  }, [value, suggestions, maxSuggestions])

  const showSuggestions = open && filteredSuggestions.length > 0

  // Keyboard navigation moves `highlightedIndex` without moving the mouse, so the newly
  // highlighted option needs to be scrolled into view manually.
  useEffect(() => {
    if (highlightedIndex >= 0) {
      optionRefs.current[highlightedIndex]?.scrollIntoView({ block: 'nearest' })
    }
  }, [highlightedIndex])

  function selectSuggestion(suggestion: string) {
    onValueChange(suggestion)
    setOpen(false)
    setHighlightedIndex(-1)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!showSuggestions) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlightedIndex((index) => (index + 1) % filteredSuggestions.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlightedIndex((index) => (index <= 0 ? filteredSuggestions.length - 1 : index - 1))
    } else if (event.key === 'Enter' && highlightedIndex >= 0) {
      const highlighted = filteredSuggestions[highlightedIndex]
      if (highlighted) {
        event.preventDefault()
        selectSuggestion(highlighted)
      }
    } else if (event.key === 'Escape') {
      setOpen(false)
      setHighlightedIndex(-1)
    }
  }

  return (
    <Popover open={showSuggestions} onOpenChange={(next) => !next && setOpen(false)}>
      <PopoverAnchor>
        <Input
          role="combobox"
          aria-expanded={showSuggestions}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={highlightedIndex >= 0 ? `${listboxId}-option-${highlightedIndex}` : undefined}
          autoComplete="off"
          value={value}
          onChange={(event) => {
            onValueChange(event.target.value)
            setOpen(true)
            setHighlightedIndex(-1)
          }}
          onFocus={(event) => {
            setOpen(true)
            onFocus?.(event)
          }}
          onBlur={(event) => {
            setOpen(false)
            onBlur?.(event)
          }}
          onKeyDown={(event) => {
            handleKeyDown(event)
            onKeyDown?.(event)
          }}
          className={className}
          {...inputProps}
        />
      </PopoverAnchor>
      <PopoverContent
        id={listboxId}
        role="listbox"
        align="start"
        onOpenAutoFocus={(event) => event.preventDefault()}
        // Open/close is driven entirely by the input's own focus/blur/typing/Escape
        // handling above, not by Radix's outside-interaction heuristics — which would
        // otherwise misfire here, since the input lives in the Anchor, not the Content,
        // so the very focus event that opens the popover looks like "focus outside".
        onFocusOutside={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
        // Without this, a mousedown anywhere in here (e.g. on the scrollbar track/thumb) blurs
        // the input, which closes the popover mid-drag — the list disappears before the user can
        // actually scroll it. Preventing the default here stops that blur; option clicks below
        // still get their own onMouseDown handler since preventDefault doesn't stop propagation.
        onMouseDown={(event) => event.preventDefault()}
        // This popover is portaled outside the parent Dialog's own DOM subtree, so the Dialog's
        // scroll lock (react-remove-scroll) treats wheel events over it as "outside" and cancels
        // them before they reach the browser's native scroll handling — even though this list is
        // itself scrollable. Scrolling it manually here works regardless of that lock.
        onWheel={(event) => {
          event.currentTarget.scrollTop += event.deltaY
        }}
        className="max-h-56 w-(--radix-popper-anchor-width) gap-0.5 overflow-y-auto p-1"
      >
        {filteredSuggestions.map((suggestion, index) => (
          <button
            key={suggestion}
            ref={(el) => {
              optionRefs.current[index] = el
            }}
            id={`${listboxId}-option-${index}`}
            type="button"
            role="option"
            aria-selected={index === highlightedIndex}
            // onMouseDown (not onClick) fires before the input's onBlur, so the
            // selection registers before the popover would otherwise close.
            onMouseDown={(event) => {
              event.preventDefault()
              selectSuggestion(suggestion)
            }}
            className={cn(
              'w-full rounded-md px-2.5 py-1.5 text-left text-sm text-ink transition-colors',
              index === highlightedIndex ? 'bg-primary/10 text-primary' : 'hover:bg-muted',
            )}
          >
            {suggestion}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}
