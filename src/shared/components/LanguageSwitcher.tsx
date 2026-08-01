import { useTranslation } from 'react-i18next'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { GlobeIcon } from '@/shared/icons/globe-icon'

// Each language's own name, in that language — not translated, per standard
// language-switcher UX (a Spanish speaker looks for "Español", not "Espanhol").
const LANGUAGE_OPTIONS = [
  { value: 'pt-BR', label: 'Português' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
] as const

interface LanguageSwitcherProps {
  className?: string
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { t, i18n } = useTranslation()

  return (
    <Select value={i18n.resolvedLanguage} onValueChange={(value) => void i18n.changeLanguage(value)}>
      <SelectTrigger aria-label={t('common.languageSwitcherLabel')} className={className} size="sm">
        <GlobeIcon className="h-4 w-4 text-slate-400" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {LANGUAGE_OPTIONS.map((language) => (
          <SelectItem key={language.value} value={language.value}>
            {language.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
