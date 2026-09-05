import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useMedicalSpecialties } from '@/features/appointments/api/appointments.hooks'
import { useBabies } from '@/features/babies/api/babies.hooks'
import { AutocompleteInput } from '@/shared/components/AutocompleteInput'
import { CloseIcon } from '@/shared/icons/close-icon'
import { StethoscopeIcon } from '@/shared/icons/stethoscope-icon'

import { useCoGuardians, useCreateSpecialist, useUpdateSpecialist } from '../api/specialists.hooks'
import type { Specialist } from '../api/specialists.schemas'

interface SpecialistDialogProps {
  open: boolean
  /** Ausente cria; presente edita. */
  specialist: Specialist | null
  currentUserId: string | undefined
  onOpenChange: (open: boolean) => void
}

export function SpecialistDialog({ open, specialist, currentUserId, onOpenChange }: SpecialistDialogProps) {
  const { t } = useTranslation()
  const babies = useBabies()
  const babyList = babies.data ?? []
  const coGuardians = useCoGuardians(currentUserId)
  const { data: specialtySuggestions = [] } = useMedicalSpecialties()

  const createSpecialist = useCreateSpecialist()
  const updateSpecialist = useUpdateSpecialist()
  const isSaving = createSpecialist.isPending || updateSpecialist.isPending
  const isError = createSpecialist.isError || updateSpecialist.isError

  const [name, setName] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [phone, setPhone] = useState('')
  const [babyIds, setBabyIds] = useState<string[]>([])
  const [sharedWithUserIds, setSharedWithUserIds] = useState<string[]>([])

  useEffect(() => {
    if (!open) return
    setName(specialist?.name ?? '')
    setSpecialty(specialist?.specialty ?? '')
    setPhone(specialist?.phone ?? '')
    setBabyIds(specialist?.babyIds ?? [])
    setSharedWithUserIds(specialist?.sharedWithUserIds ?? [])
  }, [open, specialist])

  function toggle(list: string[], value: string): string[] {
    return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
  }

  async function handleSave() {
    if (!name.trim()) return
    const input = { name, specialty, phone, babyIds, sharedWithUserIds }

    try {
      if (specialist) {
        await updateSpecialist.mutateAsync({ specialistId: specialist.id, input })
      } else {
        await createSpecialist.mutateAsync(input)
      }
    } catch {
      return // a mensagem aparece abaixo
    }

    toast.success(specialist ? t('specialists.updateSuccessToast') : t('specialists.addSuccessToast'))
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="flex max-h-[85vh] flex-col overflow-hidden p-0 sm:max-w-lg">
        <div className="relative shrink-0 bg-gradient-to-br from-emerald-800 to-emerald-700 px-7 pt-7 pb-6">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label={t('common.close')}
            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
          <StethoscopeIcon className="mb-2 h-8 w-8 text-white" />
          <DialogTitle className="font-display text-xl font-extrabold text-white">
            {specialist ? t('specialists.editTitle') : t('specialists.addTitle')}
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm text-white/80">{t('specialists.dialogSubtitle')}</DialogDescription>
        </div>

        <div className="space-y-6 overflow-y-auto p-7">
          <div>
            <Label htmlFor="specialist-name">{t('specialists.nameLabel')}</Label>
            <Input
              id="specialist-name"
              className="mt-2"
              placeholder={t('specialists.namePlaceholder')}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <Label htmlFor="specialist-specialty">{t('specialists.specialtyLabel')}</Label>
              <AutocompleteInput
                id="specialist-specialty"
                className="mt-2"
                placeholder={t('specialists.specialtyPlaceholder')}
                value={specialty}
                onValueChange={setSpecialty}
                suggestions={specialtySuggestions}
              />
            </div>
            <div>
              <Label htmlFor="specialist-phone">{t('specialists.phoneLabel')}</Label>
              <Input
                id="specialist-phone"
                type="tel"
                className="mt-2 font-mono"
                placeholder={t('specialists.phonePlaceholder')}
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </div>
          </div>

          {/* Nenhuma criança é resposta válida, e a legenda diz o que isso significa — senão a
              diferença entre "guardei um telefone" e "guardei e o outro responsável vê" fica
              invisível numa lista. */}
          <fieldset>
            <legend className="text-sm leading-none font-medium">{t('specialists.babiesLabel')}</legend>
            <p className="mt-1 text-xs text-ink-muted">{t('specialists.babiesHint')}</p>
            <div className="mt-3 flex flex-col gap-2">
              {babyList.map((baby) => (
                <label key={baby.id} className="flex items-center gap-2.5 text-sm text-ink">
                  <input
                    type="checkbox"
                    className="accent-primary h-4 w-4 flex-shrink-0"
                    checked={babyIds.includes(baby.id)}
                    onChange={() => setBabyIds((current) => toggle(current, baby.id))}
                  />
                  {baby.name}
                </label>
              ))}
            </div>
          </fieldset>

          {/* Só aparece quando há com quem compartilhar. A API restringe ao mesmo conjunto, então
              uma lista vazia aqui significa que não existe ninguém elegível — e um campo vazio sem
              explicação seria pior do que campo nenhum. */}
          {coGuardians.length > 0 && (
            <fieldset>
              <legend className="text-sm leading-none font-medium">{t('specialists.shareLabel')}</legend>
              <p className="mt-1 text-xs text-ink-muted">{t('specialists.shareHint')}</p>
              <div className="mt-3 flex flex-col gap-2">
                {coGuardians.map((guardian) => (
                  <label key={guardian.userId} className="flex items-center gap-2.5 text-sm text-ink">
                    <input
                      type="checkbox"
                      className="accent-primary h-4 w-4 flex-shrink-0"
                      checked={sharedWithUserIds.includes(guardian.userId)}
                      onChange={() => setSharedWithUserIds((current) => toggle(current, guardian.userId))}
                    />
                    <span className="min-w-0">
                      {guardian.name}
                      <span className="block text-xs text-ink-muted">{guardian.email}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {isError && (
            <p role="alert" className="text-destructive text-sm">
              {t('specialists.genericError')}
            </p>
          )}

          <div className="flex items-center justify-end gap-4 border-t border-border pt-6">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-2 py-2 text-sm font-bold text-ink-muted transition-colors hover:text-ink"
            >
              {t('common.cancel')}
            </button>
            <Button type="button" onClick={handleSave} disabled={!name.trim() || isSaving}>
              {isSaving ? t('common.saving') : t('specialists.saveAction')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
