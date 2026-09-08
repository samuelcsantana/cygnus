import { useState, type ComponentProps } from 'react'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
export function PasswordInput({ className, ...props }: ComponentProps<typeof Input>) {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)
  return (
    <div className={`relative ${className ?? ''}`}>
      <Input {...props} type={visible ? 'text' : 'password'} className="pr-12" />
      <button
        type="button"
        disabled={props.disabled}
        aria-label={t(visible ? 'profile.password.hide' : 'profile.password.show')}
        aria-pressed={visible}
        onClick={() => setVisible(!visible)}
        className="absolute right-0 top-0 flex size-11 items-center justify-center rounded-lg text-ink-muted hover:text-ink disabled:opacity-50"
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  )
}
