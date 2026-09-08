import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function VaccineProofField({
  value,
  onChange,
  onProcessingChange,
}: {
  value: string
  onChange: (value: string) => void
  onProcessingChange?: (busy: boolean) => void
}) {
  const { t } = useTranslation()
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  async function select(file?: File) {
    if (!file) return
    setError(false)
    if (!file.type.startsWith('image/') || file.size > 10 * 1024 * 1024) {
      setError(true)
      return
    }
    setBusy(true)
    onProcessingChange?.(true)
    try {
      const bitmap = await createImageBitmap(file)
      try {
        const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(bitmap.width * scale)
        canvas.height = Math.round(bitmap.height * scale)
        const context = canvas.getContext('2d')
        if (!context) throw new Error('canvas-unavailable')
        context.fillStyle = '#fff'
        context.fillRect(0, 0, canvas.width, canvas.height)
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
        const url = canvas.toDataURL('image/jpeg', 0.85)
        // Leave room for the other fields within the API's JSON body limit.
        if (url.length > 700_000) throw new Error('image-too-large')
        onChange(url)
      } finally {
        bitmap.close()
      }
    } catch {
      setError(true)
    } finally {
      setBusy(false)
      onProcessingChange?.(false)
    }
  }
  return (
    <div className="rounded-2xl border border-dashed border-border p-4">
      <p className="text-sm font-bold">{t('vaccines.editor.proof')}</p>
      <p className="mt-1 text-xs leading-relaxed text-ink-muted">{t('vaccines.editor.proofHint')}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {value && (
          <img
            src={value}
            alt={t('vaccines.editor.proofPreview')}
            className="size-16 rounded-lg border border-border object-cover"
          />
        )}
        <Button type="button" variant="outline" disabled={busy} onClick={() => input.current?.click()}>
          {t(busy ? 'vaccines.editor.processing' : 'vaccines.editor.choosePhoto')}
        </Button>
        {value && (
          <Button type="button" variant="ghost" disabled={busy} onClick={() => onChange('')}>
            {t('vaccines.editor.removePhoto')}
          </Button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-label={t('vaccines.editor.choosePhoto')}
        tabIndex={-1}
        disabled={busy}
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          void select(file)
        }}
      />
      {error && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {t('vaccines.editor.proofError')}
        </p>
      )}
      <details className="mt-3">
        <summary className="cursor-pointer text-xs text-ink-muted">{t('vaccines.editor.useLink')}</summary>
        <Label htmlFor="photoUrl" className="sr-only">
          {t('vaccines.applicationDetails.photoUrlLabel')}
        </Label>
        <Input
          id="photoUrl"
          type="url"
          disabled={busy}
          value={value.startsWith('data:') ? '' : value}
          onChange={(event) => onChange(event.target.value)}
          className="mt-2"
          placeholder="https://"
        />
      </details>
    </div>
  )
}
