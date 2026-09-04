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
import { useMedicalSpecialties } from '@/features/appointments/api/appointments.hooks'
import { cn } from '@/lib/utils'
import { AutocompleteInput } from '@/shared/components/AutocompleteInput'
import { PlusIcon } from '@/shared/icons/plus-icon'
import { StethoscopeIcon } from '@/shared/icons/stethoscope-icon'
import { TrashIcon } from '@/shared/icons/trash-icon'

import { useCreateSpecialist, useDeleteSpecialist, useSpecialists } from '../api/specialists.hooks'

interface SpecialistsSectionProps {
  babyId: string
  className?: string
}

/**
 * Quem cuida da criança, ao lado de quem tem acesso a ela.
 *
 * Fica no mesmo diálogo que a `GuardiansSection` porque responde à mesma pergunta — quem está em
 * volta desta criança — e porque a lista é **por criança**, não por conta: o acesso neste schema é
 * decidido criança a criança, e um especialista pendurado na conta seria invisível ao outro
 * guardião.
 *
 * Apagar daqui mexe só nesta lista. A consulta guarda o nome como foi escrito no dia e continua
 * inteira; é a API que anula o vínculo. O texto de confirmação diz isso, porque quem clica em
 * excluir num app de saúde precisa saber o que **não** vai sumir junto.
 */
export function SpecialistsSection({ babyId, className }: SpecialistsSectionProps) {
  const { t } = useTranslation()
  const specialists = useSpecialists(babyId)
  const deleteSpecialist = useDeleteSpecialist(babyId)
  const [isFormOpen, setIsFormOpen] = useState(false)

  return (
    <div className={cn('rounded-2xl border border-border bg-muted/50 p-5', className)}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <StethoscopeIcon className="text-primary mt-0.5 h-4 w-4 flex-shrink-0" />
          <div>
            <h3 className="font-display text-sm font-extrabold text-ink">{t('specialists.sectionTitle')}</h3>
            <p className="mt-0.5 text-xs text-ink-muted">{t('specialists.sectionDescription')}</p>
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => setIsFormOpen((open) => !open)}>
          <PlusIcon className="h-3.5 w-3.5" />
          {t('specialists.addAction')}
        </Button>
      </div>

      {isFormOpen && <SpecialistForm babyId={babyId} onSaved={() => setIsFormOpen(false)} />}

      {specialists.isPending ? (
        <p className="text-xs text-ink-muted">{t('common.loading')}</p>
      ) : specialists.isError ? (
        <p role="alert" className="text-destructive text-xs">
          {t('specialists.loadError')}
        </p>
      ) : specialists.data.length === 0 ? (
        <p className="text-xs text-ink-muted">{t('specialists.empty')}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {specialists.data.map((specialist) => (
            <li
              key={specialist.id}
              className="flex items-center justify-between gap-3 rounded-xl bg-card px-3.5 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-ink">{specialist.name}</p>
                <p className="truncate text-xs text-ink-muted">
                  {specialist.specialty}
                  {specialist.specialty && specialist.phone && ' · '}
                  {/* O telefone em mono e como link discável: num celular, tocar nele é o gesto
                      que a pessoa quer às 3h, e o mono é a mesma regra do resto do app para dado
                      que se lê em voz alta ou se digita. */}
                  {specialist.phone && (
                    <a href={`tel:${specialist.phone.replace(/\s/g, '')}`} className="font-mono underline">
                      {specialist.phone}
                    </a>
                  )}
                </p>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive flex-shrink-0"
                    aria-label={t('specialists.deleteAction', { name: specialist.name })}
                    disabled={deleteSpecialist.isPending}
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </Button>
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
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

interface SpecialistFormProps {
  babyId: string
  onSaved: () => void
}

function SpecialistForm({ babyId, onSaved }: SpecialistFormProps) {
  const { t } = useTranslation()
  const createSpecialist = useCreateSpecialist(babyId)
  const { data: specialtySuggestions = [] } = useMedicalSpecialties()
  const [name, setName] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [phone, setPhone] = useState('')

  async function handleSave() {
    if (!name.trim()) return

    try {
      await createSpecialist.mutateAsync({ name, specialty, phone })
    } catch {
      return
    }

    setName('')
    setSpecialty('')
    setPhone('')
    toast.success(t('specialists.addSuccessToast'))
    onSaved()
  }

  return (
    // Não é um <form>: este bloco vive dentro do formulário de perfil da criança, e um form
    // aninhado é HTML inválido — o submit de dentro dispara o de fora e salva a criança sem que
    // ninguém tenha pedido.
    <div className="mb-4 space-y-3 rounded-xl bg-card p-4">
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

      {createSpecialist.isError && (
        <p role="alert" className="text-destructive text-xs">
          {t('specialists.genericError')}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="button" size="sm" onClick={handleSave} disabled={!name.trim() || createSpecialist.isPending}>
          {createSpecialist.isPending ? t('common.saving') : t('specialists.saveAction')}
        </Button>
      </div>
    </div>
  )
}
