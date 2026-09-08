import { useRef, useState, type ReactNode } from 'react'

import { cn } from '@/lib/utils'
import { CameraIcon } from '@/shared/icons/camera-icon'
import { CheckIcon } from '@/shared/icons/check-icon'

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
  fileTooLargeError: string
  invalidImageError: string
  /** Background for initials, border for a photo. */
  color: string | undefined
  onColorChange: (color: string) => void
  colorOptions: AvatarColorOption[]
  colorGroupLabel: string
  className?: string
  disabled?: boolean
  onProcessingChange?: (processing: boolean) => void
}

/**
 * Pré-visualização, um botão de câmera e a paleta de cor da borda.
 *
 * **Uma forma só de definir a foto: escolher um arquivo**, redimensionado e embutido como data URL
 * (por isso não existe endpoint de upload para avatar). O campo de colar URL foi removido — ele
 * pedia que a pessoa tivesse a imagem hospedada em algum lugar, o que quase ninguém tem, e ocupava
 * a largura toda do bloco por um caminho que quase ninguém usa.
 *
 * Um `avatarUrl` que já esteja gravado como endereço http continua sendo exibido normalmente: o
 * schema não mudou, só o jeito de preencher.
 */
export function AvatarUploadField({
  id,
  value,
  onValueChange,
  fallback,
  uploadLabel,
  removeLabel,
  fileTooLargeError,
  invalidImageError,
  color,
  onColorChange,
  colorOptions,
  colorGroupLabel,
  className,
  disabled,
  onProcessingChange,
}: AvatarUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (file.size > MAX_SOURCE_FILE_BYTES) {
      setError(fileTooLargeError)
      return
    }

    try {
      setProcessing(true)
      onProcessingChange?.(true)
      const dataUrl = await fileToResizedDataUrl(file)
      setError(null)
      onValueChange(dataUrl)
    } catch {
      setError(invalidImageError)
    } finally {
      setProcessing(false)
      onProcessingChange?.(false)
    }
  }

  return (
    <fieldset
      disabled={disabled || processing}
      aria-busy={processing}
      className={cn('flex min-w-0 items-center gap-4', className)}
    >
      <div className="relative flex-shrink-0">
        <div
          data-testid="avatar-preview"
          className="h-16 w-16 overflow-hidden rounded-full border-4 bg-muted md:h-28 md:w-28"
          style={{
            borderColor: color || 'transparent',
            backgroundColor: color || undefined,
            color: color ? '#fff' : undefined,
          }}
        >
          {value ? (
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">{fallback}</div>
          )}
        </div>
        <button
          type="button"
          id={id}
          onClick={() => fileInputRef.current?.click()}
          aria-label={uploadLabel}
          className="bg-primary absolute -right-2 -bottom-2 flex h-11 w-11 items-center justify-center rounded-full text-primary-foreground shadow-sm ring-2 ring-white transition-colors hover:brightness-95 disabled:opacity-50"
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
        {/* Remover é um alvo de texto e não mais um "x" ao lado de um campo que deixou de existir.
            Só aparece quando há foto: sem ela não há o que remover. */}
        {value && (
          <button
            type="button"
            onClick={() => onValueChange('')}
            className="min-h-11 text-sm font-bold underline underline-offset-4 transition-colors"
          >
            {removeLabel}
          </button>
        )}
        {error && (
          <p role="alert" className="mt-1 text-sm">
            {error}
          </p>
        )}

        {colorOptions.length > 0 && (
          <div
            className={cn(
              'grid grid-cols-4 items-center max-[340px]:grid-cols-2',
              value && 'mt-2.5',
            )}
            role="group"
            aria-label={colorGroupLabel}
          >
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
                    'flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border-8 border-transparent bg-clip-padding ring-2 transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2',
                    selected ? 'ring-ink/30' : 'ring-transparent',
                  )}
                  style={{ backgroundColor: option.value }}
                >
                  {selected && <CheckIcon className="h-3 w-3 text-white" />}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </fieldset>
  )
}
