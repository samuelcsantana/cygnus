import { useRef, useState, type ReactNode } from 'react'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { CameraIcon } from '@/shared/icons/camera-icon'
import { CheckIcon } from '@/shared/icons/check-icon'
import { CloseIcon } from '@/shared/icons/close-icon'

const MAX_SOURCE_FILE_BYTES = 10 * 1024 * 1024
const MAX_DIMENSION_PX = 480
const JPEG_QUALITY = 0.82

async function fileToResizedDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file)
  try {
    const scale = Math.min(1, MAX_DIMENSION_PX / Math.max(bitmap.width, bitmap.height))
    const width = Math.round(bitmap.width * scale)
    const height = Math.round(bitmap.height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('canvas-unsupported')

    context.drawImage(bitmap, 0, 0, width, height)
    return canvas.toDataURL('image/jpeg', JPEG_QUALITY)
  } finally {
    bitmap.close()
  }
}

export interface AvatarColorOption {
  value: string
  label: string
}

interface AvatarUploadFieldProps {
  id?: string
  value: string | undefined
  onValueChange: (value: string) => void
  fallback: ReactNode
  uploadLabel: string
  removeLabel: string
  urlPlaceholder: string
  fileTooLargeError: string
  invalidImageError: string
  /** Border color applied around the preview once `value` is set — has no visible effect while there's no avatar. */
  color: string | undefined
  onColorChange: (color: string) => void
  colorOptions: AvatarColorOption[]
  colorGroupLabel: string
  className?: string
}

// Preview + two ways to set the same underlying value: pick a local photo (resized and
// inlined as a data URL, so no upload endpoint is needed) or paste an image URL directly.
export function AvatarUploadField({
  id,
  value,
  onValueChange,
  fallback,
  uploadLabel,
  removeLabel,
  urlPlaceholder,
  fileTooLargeError,
  invalidImageError,
  color,
  onColorChange,
  colorOptions,
  colorGroupLabel,
  className,
}: AvatarUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (file.size > MAX_SOURCE_FILE_BYTES) {
      setError(fileTooLargeError)
      return
    }

    try {
      const dataUrl = await fileToResizedDataUrl(file)
      setError(null)
      onValueChange(dataUrl)
    } catch {
      setError(invalidImageError)
    }
  }

  return (
    <div className={cn('flex items-center gap-4', className)}>
      <div className="relative flex-shrink-0">
        <div
          className={cn('h-20 w-20 overflow-hidden rounded-full bg-slate-100', value && color && 'border-4')}
          style={value && color ? { borderColor: color } : undefined}
        >
          {value ? (
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">{fallback}</div>
          )}
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label={uploadLabel}
          className="bg-primary absolute -right-1 -bottom-1 flex h-7 w-7 items-center justify-center rounded-full text-white shadow-sm ring-2 ring-white transition-colors hover:brightness-95"
        >
          <CameraIcon className="h-3.5 w-3.5" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="sr-only"
          aria-hidden="true"
          tabIndex={-1}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Input id={id} type="text" placeholder={urlPlaceholder} value={value ?? ''} onChange={(event) => onValueChange(event.target.value)} />
          {value && (
            <button
              type="button"
              onClick={() => onValueChange('')}
              aria-label={removeLabel}
              className="text-ink-faint hover:text-destructive flex-shrink-0 transition-colors"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          )}
        </div>
        {error && <p className="text-destructive mt-1 text-sm">{error}</p>}

        <div className="mt-2.5 flex items-center gap-2" role="group" aria-label={colorGroupLabel}>
          {colorOptions.map((option) => {
            const selected = color === option.value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onColorChange(selected ? '' : option.value)}
                aria-pressed={selected}
                aria-label={option.label}
                className={cn(
                  'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ring-2 ring-offset-2 transition-transform hover:scale-110',
                  selected ? 'ring-ink/30' : 'ring-transparent',
                )}
                style={{ backgroundColor: option.value }}
              >
                {selected && <CheckIcon className="h-3 w-3 text-white" />}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
