import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { SearchInput } from '@/shared/components/SearchInput'

import { SearchResultsList } from './SearchResultsList'

interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Search across the whole account, from anywhere in the app.
 *
 * A dialog rather than a panel under the field, and the same one at every width:
 * on a phone the top bar has no room for a field at all, and two implementations
 * of the same search — an inline dropdown and a sheet — is how the two drift.
 *
 * The query resets on open, not on close. Closing with Escape and reopening to
 * find the previous search still there reads as the app having lost the
 * keystrokes; starting fresh is what the gesture means.
 */
export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (open) setQuery('')
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        // Near the top, not centred: the results grow downward, and a centred
        // box jumps under the reader's eyes as they type.
        className="top-[8%] w-full max-w-[calc(100%-1.5rem)] translate-y-0 gap-0 p-0 sm:max-w-xl"
      >
        <DialogTitle className="sr-only">{t('search.title')}</DialogTitle>
        <div className="border-b border-border p-3">
          <SearchInput
            id="app-search"
            label={t('search.title')}
            value={query}
            onChange={setQuery}
            placeholder={t('search.placeholder')}
          />
        </div>
        <SearchResultsList query={query} onNavigate={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}
