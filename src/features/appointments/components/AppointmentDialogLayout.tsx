import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import type { Baby } from '@/features/babies/api/babies.schemas'
import { babyAvatarAppearance, babyInitials } from '@/shared/utils/babyAvatarColor'
import { CloseIcon } from '@/shared/icons/close-icon'
import { StethoscopeIcon } from '@/shared/icons/stethoscope-icon'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  baby?: Baby
  professional?: string
  specialty?: string
  date?: string
  location?: string
  stage: string
  dirty: boolean
  busy: boolean
  progress?: ReactNode
  children: ReactNode
  footer: (close: () => void) => ReactNode
}

export function AppointmentDialogLayout({
  open,
  onOpenChange,
  title,
  baby,
  professional,
  specialty,
  date,
  location,
  stage,
  dirty,
  busy,
  progress,
  children,
  footer,
}: Props) {
  const { t } = useTranslation()
  const [discard, setDiscard] = useState(false)
  const heading = useRef<HTMLHeadingElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const avatar = babyAvatarAppearance(baby?.id ?? '', baby?.avatarColor)
  const close = () => {
    if (busy) return
    if (dirty) setDiscard(true)
    else onOpenChange(false)
  }
  useEffect(() => {
    if (!open) {
      setDiscard(false)
      return
    }
    content.current?.scrollTo?.({ top: 0 })
    heading.current?.focus()
  }, [stage, open])

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!value) close()
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="grid h-[min(680px,calc(100dvh-32px))] grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden p-0 sm:max-w-[900px] md:grid-cols-[280px_minmax(0,1fr)] md:grid-rows-1"
          onOpenAutoFocus={(event) => {
            event.preventDefault()
            heading.current?.focus()
          }}
        >
          <aside className="flex min-w-0 flex-col bg-violet-950 px-5 py-4 text-white md:px-7 md:py-8">
            <div className="mb-8 hidden items-center gap-3 md:flex">
              <StethoscopeIcon className="size-6" />
              <span className="text-sm font-bold">{t('appointments.editor.record')}</span>
            </div>
            <div className="flex items-center gap-3 pr-9 md:pr-0">
              <span
                className={`flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full text-lg font-bold ${avatar.className}`}
                style={avatar.style}
              >
                {baby?.avatarUrl ? (
                  <img src={baby.avatarUrl} alt="" className="size-full object-cover" />
                ) : (
                  babyInitials(baby?.name ?? '') || <StethoscopeIcon className="size-5" />
                )}
              </span>
              <div className="min-w-0">
                <p className="text-xs text-white/80">{t('appointments.editor.child')}</p>
                <p className="truncate font-bold">{baby?.name ?? t('appointments.editor.chooseChild')}</p>
              </div>
            </div>
            <div className="mt-3 md:mt-8">
              <p className="hidden text-xs font-bold uppercase tracking-wider text-white/80 md:block">
                {t('appointments.editor.professional')}
              </p>
              <p className="font-display text-lg font-extrabold md:mt-3 md:break-words md:text-3xl">
                {professional || t('appointments.editor.preview')}
              </p>
              {specialty && <p className="mt-1 text-sm text-white/80">{specialty}</p>}
              {location && (
                <p className="mt-3 hidden break-words text-sm text-white/80 md:block">{location}</p>
              )}
              {date && <p className="mt-3 hidden font-mono text-sm text-white/80 md:block">{date}</p>}
            </div>
            <div className="mt-auto hidden border-t border-white/20 pt-6 md:block">
              <p className="font-semibold">{t('appointments.editor.railTitle')}</p>
              <p className="mt-2 text-sm leading-relaxed text-white/80">
                {t('appointments.editor.railHint')}
              </p>
            </div>
          </aside>
          <div className="flex min-h-0 min-w-0 flex-col">
            <header className="shrink-0 border-b border-border px-5 py-5 md:px-8 md:py-6">
              <button
                type="button"
                onClick={close}
                disabled={busy}
                aria-label={t('common.close')}
                className="absolute top-2 right-2 flex size-11 items-center justify-center rounded-full bg-background text-ink-muted hover:bg-muted disabled:opacity-50"
              >
                <CloseIcon className="size-4" />
              </button>
              <DialogTitle
                ref={heading}
                tabIndex={-1}
                className="pr-8 font-display text-xl font-extrabold outline-none md:text-2xl"
              >
                {title}
              </DialogTitle>
              <DialogDescription className="mt-1">{t('appointments.editor.subtitle')}</DialogDescription>
              {progress && <div className="mt-4">{progress}</div>}
            </header>
            <div
              ref={content}
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 md:px-8 md:py-6"
            >
              <fieldset disabled={busy} className="min-w-0 disabled:opacity-60">
                {children}
              </fieldset>
            </div>
            <footer className="shrink-0 border-t border-border bg-background px-5 py-4 md:px-8">
              <div className="flex items-center justify-between gap-3">{footer(close)}</div>
            </footer>
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog open={discard} onOpenChange={setDiscard}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('appointments.editor.discardTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('appointments.editor.discardHint')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('appointments.editor.keepEditing')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => onOpenChange(false)}>
              {t('appointments.editor.discard')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
