import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { LinkIcon } from '@/shared/icons/link-icon'
import { PlusIcon } from '@/shared/icons/plus-icon'
import { TrashIcon } from '@/shared/icons/trash-icon'
import { UsersIcon } from '@/shared/icons/users-icon'
import { useAuthIdentityStore } from '@/shared/stores/authIdentity.store'

import { useBabyGuardians, useCreateBabyInvite, useRemoveBabyGuardian } from '../api/babies.hooks'
import type { Guardian } from '../api/babies.schemas'

interface GuardiansSectionProps {
  babyId: string
  babyName: string
  className?: string
}

export function GuardiansSection({ babyId, babyName, className }: GuardiansSectionProps) {
  const { t } = useTranslation()
  const guardians = useBabyGuardians(babyId)
  const identity = useAuthIdentityStore((state) => state.identity)
  const [isInviteOpen, setIsInviteOpen] = useState(false)

  const currentUserRole = guardians.data?.find((guardian) => guardian.userId === identity?.id)?.role
  const isCurrentUserOwner = currentUserRole === 'OWNER'

  return (
    <div className={cn('rounded-2xl border border-border bg-muted/50 p-5', className)}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <UsersIcon className="text-primary mt-0.5 h-4 w-4 flex-shrink-0" />
          <div>
            <h3 className="font-display text-sm font-extrabold text-ink">{t('babies.guardians.sectionTitle')}</h3>
            <p className="mt-0.5 text-xs text-ink-muted">{t('babies.guardians.sectionDescription')}</p>
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => setIsInviteOpen((open) => !open)}>
          <PlusIcon className="h-3.5 w-3.5" />
          {t('babies.guardians.inviteAction')}
        </Button>
      </div>

      {isInviteOpen && <InvitePanel babyId={babyId} />}

      {guardians.isPending ? (
        <p className="text-xs text-ink-muted">{t('common.loading')}</p>
      ) : guardians.isError ? (
        <p role="alert" className="text-destructive text-xs">
          {t('babies.guardians.loadError')}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {guardians.data.map((guardian) => (
            <GuardianRow
              key={guardian.userId}
              guardian={guardian}
              babyId={babyId}
              babyName={babyName}
              canRemove={isCurrentUserOwner && guardian.role !== 'OWNER'}
              canLeave={guardian.role !== 'OWNER' && guardian.userId === identity?.id}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

interface GuardianRowProps {
  guardian: Guardian
  babyId: string
  babyName: string
  canRemove: boolean
  canLeave: boolean
}

function GuardianRow({ guardian, babyId, babyName, canRemove, canLeave }: GuardianRowProps) {
  const { t } = useTranslation()
  const removeGuardian = useRemoveBabyGuardian(babyId)

  // Radix's AlertDialogAction always closes the alert dialog immediately on
  // click, before this async handler settles — so a failure can't be shown
  // inline inside the (already-unmounted) AlertDialogContent; a toast is the
  // only reliable way to surface it. Mirrors AdhocVaccineList/MilestoneTimeline.
  const handleRemove = async () => {
    try {
      await removeGuardian.mutateAsync(guardian.userId)
      toast.success(canLeave ? t('babies.guardians.leaveSuccessToast') : t('babies.guardians.removeSuccessToast'))
    } catch {
      toast.error(t('babies.guardians.removeGenericError'))
    }
  }

  return (
    <li className="flex items-center gap-3 rounded-xl bg-card p-3 shadow-[0_1px_6px_rgba(0,0,0,0.03)]">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-ink">{guardian.name}</p>
        <p className="truncate text-xs text-ink-muted">{guardian.email}</p>
      </div>
      <span
        className={cn(
          'flex-shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold',
          guardian.role === 'OWNER' ? 'bg-teal-50 text-teal-700' : 'bg-violet-50 text-violet-600',
        )}
      >
        {guardian.role === 'OWNER' ? t('babies.guardians.roleOwner') : t('babies.guardians.roleGuardian')}
      </span>

      {(canRemove || canLeave) && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <span className="relative inline-flex flex-shrink-0">
              <button
                type="button"
                aria-label={
                  canLeave
                    ? t('babies.guardians.leaveAction')
                    : t('babies.guardians.removeAction', { name: guardian.name })
                }
                className="text-destructive relative rounded-lg p-1.5 opacity-60 transition-opacity hover:bg-rose-50 hover:opacity-100 focus-visible:opacity-100"
              >
                <span className="absolute -inset-2.5" aria-hidden="true" />
                <TrashIcon className="h-3.5 w-3.5" />
              </button>
            </span>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {canLeave ? t('babies.guardians.leaveConfirmTitle') : t('babies.guardians.removeConfirmTitle')}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {canLeave
                  ? t('babies.guardians.leaveConfirmDescription', { babyName })
                  : t('babies.guardians.removeConfirmDescription', { name: guardian.name, babyName })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('babies.guardians.confirmDismiss')}</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={handleRemove} disabled={removeGuardian.isPending}>
                {canLeave ? t('babies.guardians.leaveConfirmAction') : t('babies.guardians.removeConfirmAction')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </li>
  )
}

interface InvitePanelProps {
  babyId: string
}

function InvitePanel({ babyId }: InvitePanelProps) {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const createInvite = useCreateBabyInvite(babyId)

  const inviteLink = createInvite.data ? `${window.location.origin}/invites/${createInvite.data.code}` : null

  const handleGenerate = async () => {
    try {
      await createInvite.mutateAsync(email.trim() || undefined)
      toast.success(t('babies.guardians.invite.successToast'))
    } catch {
      toast.error(t('babies.guardians.invite.genericError'))
    }
  }

  const handleCopy = async () => {
    if (!inviteLink) return
    try {
      await navigator.clipboard.writeText(inviteLink)
      toast.success(t('babies.guardians.invite.copiedToast'))
    } catch {
      toast.error(t('babies.guardians.invite.copyError'))
    }
  }

  return (
    <div className="mb-4 rounded-xl bg-card p-4 shadow-[0_1px_6px_rgba(0,0,0,0.03)]">
      {inviteLink ? (
        <div>
          <Label htmlFor="invite-link">{t('babies.guardians.invite.linkLabel')}</Label>
          <div className="mt-2 flex items-center gap-2">
            <Input id="invite-link" type="text" readOnly value={inviteLink} className="flex-1" />
            <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
              <LinkIcon className="h-3.5 w-3.5" />
              {t('babies.guardians.invite.copyAction')}
            </Button>
          </div>
          <button
            type="button"
            onClick={() => createInvite.reset()}
            className="text-primary mt-3 text-xs font-semibold hover:underline"
          >
            {t('babies.guardians.invite.newInviteAction')}
          </button>
        </div>
      ) : (
        <div>
          <Label htmlFor="invite-email">{t('babies.guardians.invite.emailLabel')}</Label>
          <Input
            id="invite-email"
            type="email"
            placeholder={t('babies.guardians.invite.emailPlaceholder')}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2"
          />
          <p className="mt-1 text-xs text-ink-muted">{t('babies.guardians.invite.emailHint')}</p>
          <div className="mt-3 flex justify-end">
            <Button type="button" size="sm" onClick={handleGenerate} disabled={createInvite.isPending}>
              {createInvite.isPending ? t('common.saving') : t('babies.guardians.invite.generateAction')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
