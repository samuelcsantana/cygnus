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
import { useCurrentUser } from '@/features/auth/api/auth.hooks'
import { useBabies } from '@/features/babies/api/babies.hooks'
import { EmptyState } from '@/shared/components/EmptyState'
import { PencilIcon } from '@/shared/icons/pencil-icon'
import { StethoscopeIcon } from '@/shared/icons/stethoscope-icon'
import { TrashIcon } from '@/shared/icons/trash-icon'

import { useDeleteSpecialist, useSpecialists } from '../api/specialists.hooks'
import { isPrivateEntry, type Specialist } from '../api/specialists.schemas'
import { SpecialistDialog } from '../components/SpecialistDialog'

export function SpecialistsRoute() {
  const { t } = useTranslation()
  const specialists = useSpecialists()
  const babies = useBabies()
  const currentUser = useCurrentUser()
  const deleteSpecialist = useDeleteSpecialist()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Specialist | null>(null)

  const babyNameById = new Map((babies.data ?? []).map((baby) => [baby.id, baby.name]))
  const items = specialists.data ?? []

  function openCreate() {
    setEditTarget(null)
    setIsDialogOpen(true)
  }

  function openEdit(specialist: Specialist) {
    setEditTarget(specialist)
    setIsDialogOpen(true)
  }

  return (
    <div className="animate-fade-in-up">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="font-display text-3xl font-extrabold text-ink">{t('specialists.title')}</h2>
          {/* Sem a lista, `items.length` é zero porque nada carregou, não porque nada foi salvo —
              e "0 profissionais" se lê como fato. Mesma forma das outras telas. */}
          {specialists.isError ? null : (
            <p className="mt-1 text-lg text-ink-muted">
              {specialists.isPending
                ? t('specialists.summaryUnavailable')
                : t('specialists.summary', { count: items.length })}
            </p>
          )}
        </div>
        <Button
          type="button"
          size="cta"
          onClick={openCreate}
          className="rounded-2xl shadow-lg shadow-emerald-900/20 active:scale-[0.98]"
        >
          {t('specialists.addAction')}
        </Button>
      </div>

      <SpecialistDialog
        open={isDialogOpen}
        specialist={editTarget}
        currentUserId={currentUser.data?.id}
        onOpenChange={setIsDialogOpen}
      />

      {specialists.isPending ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {[0, 1].map((index) => (
            <div key={index} className="h-32 animate-pulse rounded-2xl bg-card shadow-sm" />
          ))}
        </div>
      ) : specialists.isError ? (
        <p className="py-16 text-center text-ink-muted">{t('specialists.loadError')}</p>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<StethoscopeIcon className="h-10 w-10" />}
          title={t('specialists.empty.title')}
          description={t('specialists.empty.description')}
          tone="emerald"
          action={
            <Button type="button" size="cta" onClick={openCreate} className="rounded-xl shadow-md shadow-emerald-900/20">
              {t('specialists.empty.cta')}
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((specialist) => {
            const isOwner = specialist.userId === currentUser.data?.id
            const babyNames = specialist.babyIds.map((babyId) => babyNameById.get(babyId)).filter(Boolean)

            return (
              <div
                key={specialist.id}
                className="rounded-2xl bg-card p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] sm:p-6"
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-[15px] font-bold text-ink">{specialist.name}</h3>
                    {specialist.specialty && (
                      <p className="truncate text-[13px] text-ink-muted">{specialist.specialty}</p>
                    )}
                  </div>
                  {/* Quem só enxerga não vê os botões: a API responde 404 para essa pessoa, e um
                      botão que sempre falha é pior do que botão nenhum. */}
                  {isOwner && (
                    <div className="flex flex-shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(specialist)}
                        aria-label={t('specialists.editAction', { name: specialist.name })}
                        className="rounded-lg p-2 text-ink-faint transition-colors hover:bg-muted hover:text-ink"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            type="button"
                            aria-label={t('specialists.deleteAction', { name: specialist.name })}
                            className="text-destructive rounded-lg p-2 transition-colors hover:bg-muted"
                            disabled={deleteSpecialist.isPending}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t('specialists.deleteConfirmTitle')}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t('specialists.deleteConfirmDescription', { name: specialist.name })}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t('specialists.deleteConfirmDismiss')}</AlertDialogCancel>
                            <AlertDialogAction
                              variant="destructive"
                              onClick={() => {
                                deleteSpecialist.mutate(specialist.id, {
                                  onSuccess: () => toast.success(t('specialists.deleteSuccessToast')),
                                  onError: () => toast.error(t('specialists.genericError')),
                                })
                              }}
                            >
                              {t('specialists.deleteConfirmAction')}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>

                {specialist.phone && (
                  <a
                    href={`tel:${specialist.phone.replace(/\s/g, '')}`}
                    className="font-mono text-[13px] text-emerald-700 underline dark:text-emerald-300"
                  >
                    {specialist.phone}
                  </a>
                )}

                <p className="mt-3 text-xs text-ink-muted">
                  {babyNames.length > 0
                    ? t('specialists.attends', { list: babyNames.join(', ') })
                    : isPrivateEntry(specialist)
                      ? t('specialists.privateEntry')
                      : t('specialists.sharedOnly')}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
