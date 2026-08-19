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
}

// A visually-icon-only search affordance still needs a real associated
// <label> for screen reader users — kept off-screen
// with sr-only rather than dropped in favor of just aria-label/placeholder.
export function SearchInput({ id, label, value, onChange, placeholder, className }: SearchInputProps) {
  return (
    <div className={cn('relative', className)}>
      <Label htmlFor={id} className="sr-only">
        {label}
      </Label>
      <SearchIcon className="text-ink-faint pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
      <Input
        id={id}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="pl-9"
      />
    </div>
  )
}
