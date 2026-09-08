import { useRef } from 'react'
import { X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { SearchIcon } from '@/shared/icons/search-icon'

interface SearchInputProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  className?: string
  inputClassName?: string
  clearLabel?: string
}

// A visually-icon-only search affordance still needs a real associated
// <label> for screen reader users — kept off-screen
// with sr-only rather than dropped in favor of just aria-label/placeholder.
export function SearchInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  className,
  inputClassName,
  clearLabel,
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <div className={cn('relative', className)}>
      <Label htmlFor={id} className="sr-only">
        {label}
      </Label>
      <SearchIcon className="text-ink-faint pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
      <Input
        ref={inputRef}
        id={id}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={cn(
          'pl-9',
          clearLabel && 'pr-12 [&::-webkit-search-cancel-button]:appearance-none',
          inputClassName,
        )}
      />
      {clearLabel && value && (
        <button
          type="button"
          aria-label={clearLabel}
          onClick={() => {
            onChange('')
            inputRef.current?.focus()
          }}
          className="absolute right-0 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-xl text-ink-muted hover:text-ink"
        >
          <X aria-hidden className="size-4" />
        </button>
      )}
    </div>
  )
}
