import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Baby } from '@/features/babies/api/babies.schemas'
import { formatDateDisplay } from '@/lib/date'
import { config } from '@/lib/config'
import { cn } from '@/lib/utils'
import { TrashIcon } from '@/shared/icons/trash-icon'
import { babyAvatarAppearance, babyInitials } from '@/shared/utils/babyAvatarColor'
import { useDeleteMilestone } from '../api/milestones.hooks'
import type { Milestone } from '../api/milestones.schemas'
import { MILESTONE_CATEGORY_META } from './category-meta'
import { EditMilestoneDialog } from './EditMilestoneDialog'

export function MilestoneTimeline({ items, babies }: { items: Milestone[]; babies: Baby[] }) {
  const { i18n } = useTranslation()
  const [editTarget, setEditTarget] = useState<Milestone | null>(null)
  const groups = new Map<string, Milestone[]>()
  for (const item of items) {
    const month = item.achievedAt.slice(0, 7)
    const group = groups.get(month)
    if (group) group.push(item)
    else groups.set(month, [item])
  }
  return (
    <div className="space-y-8">
      {[...groups].map(([month, memories]) => {
        const [year, monthNumber] = month.split('-').map(Number)
        const label = new Intl.DateTimeFormat(i18n.language, {
          month: 'long',
          year: 'numeric',
        }).format(new Date(year!, monthNumber! - 1, 1))
        return (
          <section
            key={month}
            aria-label={label}
            className="grid gap-3 lg:grid-cols-[140px_minmax(0,1fr)] lg:gap-6"
          >
            <h2 className="pt-2 font-display text-lg font-bold capitalize text-ink">{label}</h2>
            <ol className="space-y-4 border-l border-amber-600/25 pl-3 sm:pl-5">
              {memories.map((milestone) => (
                <li key={milestone.id} className="relative min-w-0">
                  <span
                    aria-hidden="true"
                    className="absolute -left-[17px] top-7 h-2 w-2 rounded-full bg-amber-700 sm:-left-[25px]"
                  />
                  <MilestoneCard
                    milestone={milestone}
                    baby={
                      babies.length > 1
                        ? babies.find((baby) => baby.id === milestone.babyId)
                        : undefined
                    }
                    onEdit={() => setEditTarget(milestone)}
                  />
                </li>
              ))}
            </ol>
          </section>
        )
      })}
      <EditMilestoneDialog
        babies={babies}
        milestone={editTarget}
        onOpenChange={(open) => !open && setEditTarget(null)}
      />
    </div>
  )
}

export function MilestoneCard({
  milestone,
  baby,
  onEdit,
}: {
  milestone: Milestone
  baby?: Baby
  onEdit: () => void
}) {
  const { t, i18n } = useTranslation()
  const deletion = useDeleteMilestone(milestone.babyId)
  const [confirm, setConfirm] = useState(false)
  const [photoOpen, setPhotoOpen] = useState(false)
  const [failedPhoto, setFailedPhoto] = useState<string | null>(null)
  const meta = MILESTONE_CATEGORY_META[milestone.category]
  const avatar = baby ? babyAvatarAppearance(baby.id, baby.avatarColor) : null
  const hasPhoto = !!milestone.photoUrl && failedPhoto !== milestone.photoUrl
  // API assets use CORS; other externally hosted photos may not support it.
  const photoCrossOrigin =
    milestone.photoUrl &&
    /^https?:/.test(config.apiBaseUrl) &&
    milestone.photoUrl.startsWith(new URL(config.apiBaseUrl).origin + '/')
      ? ('anonymous' as const)
      : undefined

  return (
    <>
      <article
        className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
        aria-label={milestone.title}
      >
        <div className={cn('grid', hasPhoto && 'md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]')}>
          {hasPhoto && (
            <button
              type="button"
              onClick={() => setPhotoOpen(true)}
              aria-label={t('milestones.page.enlarge', { title: milestone.title })}
              className="group relative min-w-0 bg-muted focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-primary"
            >
              <img
                crossOrigin={photoCrossOrigin}
                src={milestone.photoUrl!}
                alt={milestone.title}
                loading="lazy"
                onError={() => setFailedPhoto(milestone.photoUrl)}
                className="h-56 w-full object-cover md:h-full md:max-h-96 md:min-h-64"
              />
              <span className="absolute right-3 bottom-3 rounded-lg bg-card px-3 py-2 text-xs font-semibold text-ink shadow-sm">
                {t('milestones.page.viewPhoto')}
              </span>
            </button>
          )}
          <div className="flex min-w-0 flex-col p-5 sm:p-6">
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
              <time dateTime={milestone.achievedAt} className="font-medium text-ink-muted">
                {formatDateDisplay(milestone.achievedAt, i18n.language)}
              </time>
              <span className={cn('rounded-full px-2.5 py-1 font-semibold', meta.badgeClass)}>
                <span aria-hidden="true">{meta.emoji} </span>
                {t(`milestones.category.${milestone.category.toLowerCase()}`)}
              </span>
            </div>
            <h3 className="break-words font-display text-xl font-extrabold text-ink">
              {milestone.title}
            </h3>
            {baby && (
              <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-ink-muted">
                <span
                  style={avatar?.style}
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px]',
                    avatar?.className,
                  )}
                >
                  {babyInitials(baby.name)}
                </span>
                {baby.name}
              </div>
            )}
            {milestone.description && (
              <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-ink-muted">
                {milestone.description}
              </p>
            )}
            {milestone.photoUrl && !hasPhoto && (
              <p role="status" className="mt-3 text-sm text-ink-muted">
                {t('milestones.page.photoUnavailable')}
              </p>
            )}
            <div className="mt-auto flex items-center justify-between gap-3 pt-5">
              <Button
                variant="ghost"
                disabled={deletion.isPending}
                onClick={onEdit}
                aria-label={t('milestones.edit.action', { title: milestone.title })}
                className="min-h-11 text-amber-800 dark:text-amber-300"
              >
                {t('milestones.page.edit')}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                disabled={deletion.isPending}
                onClick={() => setConfirm(true)}
                aria-label={t('milestones.delete.action', { title: milestone.title })}
                className="h-11 w-11 text-ink-muted hover:text-destructive"
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </article>
      <Dialog open={photoOpen} onOpenChange={setPhotoOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="break-words pr-6">{milestone.title}</DialogTitle>
            <DialogDescription>
              {formatDateDisplay(milestone.achievedAt, i18n.language)}
            </DialogDescription>
          </DialogHeader>
          {milestone.photoUrl && (
            <img
              crossOrigin={photoCrossOrigin}
              src={milestone.photoUrl}
              alt={milestone.title}
              className="max-h-[65dvh] w-full rounded-xl object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
      <AlertDialog open={confirm} onOpenChange={(open) => !deletion.isPending && setConfirm(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('milestones.delete.confirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('milestones.delete.confirmDescription', { title: milestone.title })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletion.isPending}>
              {t('milestones.delete.confirmDismiss')}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deletion.isPending}
              onClick={async (event) => {
                event.preventDefault()
                if (deletion.isPending) return
                try {
                  await deletion.mutateAsync(milestone.id)
                  setConfirm(false)
                  toast.success(t('milestones.delete.successToast'))
                } catch {
                  toast.error(t('milestones.delete.genericError'))
                }
              }}
            >
              {t(deletion.isPending ? 'common.loading' : 'milestones.delete.confirmAction')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
