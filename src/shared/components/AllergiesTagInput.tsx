import { useState, type KeyboardEvent } from 'react'

interface AllergiesTagInputProps {
  id?: string
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  removeLabel: (item: string) => string
}

export function AllergiesTagInput({ id, value, onChange, placeholder, removeLabel }: AllergiesTagInputProps) {
  const [draft, setDraft] = useState('')

  function commitDraft() {
    const trimmed = draft.trim()
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed])
    }
    setDraft('')
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      commitDraft()
    } else if (event.key === 'Backspace' && draft === '' && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div className="focus-within:border-primary focus-within:ring-primary/10 mt-2 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 focus-within:bg-white focus-within:ring-4">
      {value.map((item) => (
        <span
          key={item}
          className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium"
        >
          {item}
          <button
            type="button"
            onClick={() => onChange(value.filter((existing) => existing !== item))}
            aria-label={removeLabel(item)}
            className="text-primary/70 hover:text-primary"
          >
            ×
          </button>
        </span>
      ))}
      <input
        id={id}
        type="text"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commitDraft}
        placeholder={placeholder}
        className="min-w-[120px] flex-1 bg-transparent text-sm outline-none placeholder:text-ink-faint"
      />
    </div>
  )
}
