import { useSearchDestination } from '@/shared/stores/searchDestination.store'
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
import { type Specialist } from '../api/specialists.schemas'
import { SpecialistDialog } from '../components/SpecialistDialog'
import { SpecialistCard } from '../components/SpecialistCard'
import { SearchInput } from '@/shared/components/SearchInput'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useSelectedBabyStore } from '@/shared/stores/selectedBaby.store'

export function SpecialistsRoute() {
  const { t, i18n } = useTranslation()
  const specialists = useSpecialists()
  const babies = useBabies()
  const currentUser = useCurrentUser()
  const deleteSpecialist = useDeleteSpecialist()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Specialist | null>(null)

  const selectedId = useSelectedBabyStore((state) => state.selectedBabyId)
  const select = useSelectedBabyStore((state) => state.select)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'ALL' | 'OWN' | 'SHARED'>('ALL')
  const debounced = useDebouncedValue(search)
  const normalize = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase()
  const term = normalize(debounced)
  const allContacts = () => {
    select(null)
    setFilter('ALL')
    setSearch('')
  }
  const accessKnown = currentUser.isSuccess

  const destination = useSearchDestination('/profissionais')
  const items = (specialists.data ?? []).filter(
    (item) => !destination || destination.keys.includes(`specialist:${item.id}`),
  )
  const scoped = items.filter((item) => !selectedId || item.babyIds.includes(selectedId))
  const filtered = scoped.filter(
    (item) =>
      filter === 'ALL' ||
      (accessKnown &&
        (filter === 'OWN'
          ? item.userId === currentUser.data?.id
          : item.userId !== currentUser.data?.id)),
  )
  const visible = filtered
    .filter(
      (item) =>
        !term ||
        [item.name, item.specialty, item.phone].some(
          (value) =>
            value &&
            (normalize(value).includes(term) ||
              (value === item.phone &&
                /^[+\d\s().-]+$/.test(term) &&
                term.replace(/\D/g, '').length > 0 &&
                value.replace(/\D/g, '').includes(term.replace(/\D/g, '')))),
        ),
    )
    .sort((a, b) => a.name.localeCompare(b.name, i18n.language))

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
          <h1 className="font-display text-3xl font-extrabold text-ink">
            {t('specialists.title')}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">{t('specialists.page.intro')}</p>
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

      {selectedId && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
          <p className="text-sm text-ink-muted">{t('specialists.page.childContext')}</p>
          <button
            type="button"
            onClick={allContacts}
            className="min-h-11 px-3 text-sm font-semibold text-primary"
          >
            {t('specialists.page.allContacts')}
          </button>
        </div>
      )}
      {items.length > 0 && (
        <div className="mb-5 space-y-3">
          <div
            role="group"
            aria-label={t('specialists.page.filters')}
            className="flex flex-wrap gap-2"
          >
            {(['ALL', 'OWN', 'SHARED'] as const).map((value) => (
              <button
                type="button"
                key={value}
                aria-pressed={filter === value}
                disabled={value !== 'ALL' && !accessKnown}
                onClick={() => setFilter(value)}
                className={`min-h-11 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50 ${filter === value ? 'bg-primary text-primary-foreground' : 'bg-card text-ink-muted hover:bg-muted'}`}
              >
                {t(`specialists.page.${value}`)}
              </button>
            ))}
          </div>
          <SearchInput
            id="specialist-search"
            label={t('specialists.page.search')}
            placeholder={t('specialists.page.search')}
            value={search}
            onChange={setSearch}
            clearLabel={t('vaccines.searchUi.clear')}
            inputClassName="h-12 rounded-xl"
            className="w-full sm:max-w-lg"
          />
          <p role="status" className="text-sm text-ink-muted">
            {t('specialists.summary', { count: visible.length })}
          </p>
        </div>
      )}
      {babies.isError && (
        <div role="alert" className="mb-4 rounded-xl bg-card p-4 text-sm">
          <p>{t('specialists.page.linksError')}</p>
          <button
            type="button"
            onClick={() => void babies.refetch()}
            className="min-h-11 font-semibold text-primary"
          >
            {t('nav.shell.retry')}
          </button>
        </div>
      )}
      {currentUser.isError && (
        <div role="alert" className="mb-4 rounded-xl bg-card p-4 text-sm">
          <p>{t('specialists.page.accessUnknown')}</p>
          <button
            type="button"
            onClick={() => void currentUser.refetch()}
            className="min-h-11 font-semibold text-primary"
          >
            {t('nav.shell.retry')}
          </button>
        </div>
      )}
      {specialists.isPending ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {[0, 1].map((index) => (
            <div key={index} className="h-32 animate-pulse rounded-2xl bg-card shadow-sm" />
          ))}
        </div>
      ) : specialists.isError ? (
        <div role="alert" className="rounded-2xl bg-card p-8 text-center">
          <p>{t('specialists.loadError')}</p>
          <button
            type="button"
            onClick={() => void specialists.refetch()}
            className="mt-3 min-h-11 font-semibold text-primary"
          >
            {t('nav.shell.retry')}
          </button>
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<StethoscopeIcon className="h-10 w-10" />}
          title={t('specialists.empty.title')}
          description={t('specialists.empty.description')}
          tone="emerald"
          action={
            <Button
              type="button"
              size="cta"
              onClick={openCreate}
              className="rounded-xl shadow-md shadow-emerald-900/20"
            >
              {t('specialists.empty.cta')}
            </Button>
          }
        />
      ) : (
        <>
          {!visible.length && (
            <div className="rounded-2xl border border-border bg-card p-8 text-center">
              <p className="text-sm text-ink-muted">
                {t(
                  term
                    ? 'specialists.page.noSearch'
                    : selectedId && !scoped.length
                      ? 'specialists.page.noLinks'
                      : 'specialists.page.noFilter',
                )}
              </p>
              {(term || filter !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('')
                    setFilter('ALL')
                  }}
                  className="mt-3 min-h-11 font-semibold text-primary"
                >
                  {t('specialists.page.clear')}
                </button>
              )}
            </div>
          )}
          <div className="grid items-stretch gap-4 lg:grid-cols-2">
            {visible.map((specialist) => {
              const isOwner = accessKnown && specialist.userId === currentUser.data?.id
              return (
                <SpecialistCard
                  key={specialist.id}
                  specialist={specialist}
                  babies={babies.data ?? []}
                  linksPending={babies.isPending}
                  linksError={babies.isError}
                  accessKnown={accessKnown}
                  isOwner={isOwner}
                  actions={
                    isOwner && (
                      <div className="flex flex-shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(specialist)}
                          disabled={deleteSpecialist.isPending}
                          aria-label={t('specialists.editAction', { name: specialist.name })}
                          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-3 text-sm font-semibold text-ink-muted hover:bg-muted"
                        >
                          <PencilIcon aria-hidden className="h-4 w-4" />
                          {t('specialists.page.edit')}
                        </button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button
                              type="button"
                              aria-label={t('specialists.deleteAction', { name: specialist.name })}
                              className="text-ink-muted flex size-11 items-center justify-center rounded-xl transition-colors hover:bg-muted hover:text-destructive"
                              disabled={deleteSpecialist.isPending}
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                {t('specialists.deleteConfirmTitle')}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {t('specialists.deleteConfirmDescription', {
                                  name: specialist.name,
                                })}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>
                                {t('specialists.deleteConfirmDismiss')}
                              </AlertDialogCancel>
                              <AlertDialogAction
                                variant="destructive"
                                onClick={() => {
                                  deleteSpecialist.mutate(specialist.id, {
                                    onSuccess: () =>
                                      toast.success(t('specialists.deleteSuccessToast')),
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
                    )
                  }
                />
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
