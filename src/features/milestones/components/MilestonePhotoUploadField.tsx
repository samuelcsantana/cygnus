import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'
import { CloseIcon } from '@/shared/icons/close-icon'
import { UploadIcon } from '@/shared/icons/upload-icon'

import { useUploadMilestonePhoto } from '../api/milestones.hooks'

const MAX_FILE_BYTES = 5 * 1024 * 1024
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ACCEPT_ATTR = ACCEPTED_TYPES.join(',')

interface MilestonePhotoUploadFieldProps {
  id?: string
  value: string | undefined
  onValueChange: (value: string) => void
  className?: string
}

// Two visual states share this component: a local instant preview (an object
// URL, shown the moment a file is picked) while the real upload is in
// flight, then the server's returned URL once it lands — see handleFileChange.
export function MilestonePhotoUploadField({ id, value, onValueChange, className }: MilestonePhotoUploadFieldProps) {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null)
  const [clientError, setClientError] = useState<string | null>(null)
  const uploadPhoto = useUploadMilestonePhoto()

  // Revoke the local object URL on unmount / whenever it's replaced, so we
  // don't leak blob references once the real (or no) photo is in place.
  useEffect(() => {
    return () => {
      if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl)
    }
  }, [localPreviewUrl])

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setClientError(null)

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setClientError(t('milestones.form.photoInvalidType'))
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      setClientError(t('milestones.form.photoTooLarge'))
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setLocalPreviewUrl(objectUrl)

    try {
      const url = await uploadPhoto.mutateAsync(file)
      onValueChange(url)
    } catch {
      setClientError(t('milestones.form.photoUploadError'))
    } finally {
      setLocalPreviewUrl(null)
    }
  }

  const handleRemove = () => {
    onValueChange('')
    setClientError(null)
  }

  const previewSrc = localPreviewUrl ?? (value || null)
  const isUploading = uploadPhoto.isPending

  return (
    <div className={cn('space-y-2', className)}>
      {previewSrc ? (
        <div className="relative inline-flex">
          <img
            src={previewSrc}
            alt=""
            className={cn('h-28 w-28 rounded-xl object-cover shadow-sm', isUploading && 'opacity-50')}
          />
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="border-t-transparent h-6 w-6 animate-spin rounded-full border-2 border-primary" />
            </div>
          )}
          {!isUploading && (
            <button
              type="button"
              onClick={handleRemove}
              aria-label={t('milestones.form.photoRemoveAria')}
              className="bg-ink/70 absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full text-white shadow-sm transition-colors hover:bg-ink"
            >
              <CloseIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex h-28 w-28 flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-200 text-ink-faint transition-colors hover:border-primary hover:text-primary"
        >
          <UploadIcon className="h-5 w-5" />
          <span className="text-[11px] font-semibold">{t('milestones.form.photoUploadAction')}</span>
        </button>
      )}

      <input
        ref={fileInputRef}
        id={id}
        type="file"
        accept={ACCEPT_ATTR}
        onChange={handleFileChange}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
      />

      {clientError && (
        <p role="alert" className="text-destructive text-sm">
          {clientError}
        </p>
      )}
    </div>
  )
}
