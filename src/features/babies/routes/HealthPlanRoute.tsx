import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { EmptyState } from '@/shared/components/EmptyState'
import { IdCardIcon } from '@/shared/icons/id-card-icon'
import { babyAvatarAppearance, babyInitials } from '@/shared/utils/babyAvatarColor'

import { useBabies, useUpdateBaby } from '../api/babies.hooks'
import type { Baby } from '../api/babies.schemas'

/**
 * O plano de saúde de cada criança, numa tela só.
 *
 * Saiu do formulário de perfil porque é o que se procura na recepção da clínica, sozinho e com
 * pressa — e ali estava no meio de foto, data de nascimento e alergias, atrás de um botão de editar
 * dentro de um diálogo. Aqui as crianças da casa aparecem juntas, que é como a pergunta chega:
 * "qual é a carteirinha do Miguel?".
 */
export function HealthPlanRoute() {
  const { t } = useTranslation()
  const babies = useBabies()
  const babyList = babies.data ?? []

  if (babies.isPending) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        {[0, 1].map((index) => (
          <div key={index} className="h-40 animate-pulse rounded-2xl bg-card shadow-sm" />
        ))}
      </div>
    )
  }

  if (babies.isError) {
    return <p className="py-16 text-center text-ink-muted">{t('babies.dashboard.loadError')}</p>
  }

  if (babyList.length === 0) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="animate-fade-in-up">
      <div className="mb-6">
        <h2 className="font-display text-3xl font-extrabold text-ink">{t('healthPlan.title')}</h2>
        <p className="mt-1 text-lg text-ink-muted">{t('healthPlan.subtitle')}</p>
      </div>

      {babyList.every((baby) => !baby.healthPlanName && !baby.healthPlanNumber) && (
        <EmptyState
          icon={<IdCardIcon className="h-10 w-10" />}
          title={t('healthPlan.empty.title')}
          description={t('healthPlan.empty.description')}
          tone="emerald"
        />
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {babyList.map((baby) => (
          <HealthPlanCard key={baby.id} baby={baby} />
        ))}
      </div>
    </div>
  )
}

function HealthPlanCard({ baby }: { baby: Baby }) {
  const { t } = useTranslation()
  const updateBaby = useUpdateBaby(baby.id)
  const appearance = babyAvatarAppearance(baby.id, baby.avatarColor)

  const [planName, setPlanName] = useState(baby.healthPlanName ?? '')
  const [planNumber, setPlanNumber] = useState(baby.healthPlanNumber ?? '')

  // A lista pode ser revalidada enquanto a tela está aberta; sem isto, o que voltou do servidor
  // ficaria invisível atrás do estado local.
  useEffect(() => {
    setPlanName(baby.healthPlanName ?? '')
    setPlanNumber(baby.healthPlanNumber ?? '')
  }, [baby.healthPlanName, baby.healthPlanNumber])

  const isDirty = planName !== (baby.healthPlanName ?? '') || planNumber !== (baby.healthPlanNumber ?? '')

  async function handleSave() {
    try {
      // `useUpdateBaby` manda o perfil inteiro — o formulário de perfil é a origem desse contrato —
      // então os demais campos vão como estão, sem alteração.
      await updateBaby.mutateAsync({
        name: baby.name,
        birthDate: baby.birthDate,
        sexAtBirth: baby.sexAtBirth ?? undefined,
        bloodType: baby.bloodType ?? undefined,
        allergies: baby.allergies,
        healthPlanName: planName,
        healthPlanNumber: planNumber,
        avatarUrl: baby.avatarUrl ?? '',
        avatarColor: baby.avatarColor ?? '',
      })
    } catch {
      toast.error(t('healthPlan.genericError'))
      return
    }
    toast.success(t('healthPlan.savedToast'))
  }

  return (
    <div className="rounded-2xl bg-card p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        {baby.avatarUrl ? (
          <img
            src={baby.avatarUrl}
            alt=""
            className={cn('h-10 w-10 flex-shrink-0 rounded-full object-cover', baby.avatarColor && 'border-2')}
            style={baby.avatarColor ? { borderColor: baby.avatarColor } : undefined}
          />
        ) : (
          <span
            className={cn(
              'font-display flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-black',
              appearance.className,
            )}
            style={appearance.style}
          >
            {babyInitials(baby.name)}
          </span>
        )}
        <h3 className="truncate text-[15px] font-bold text-ink">{baby.name}</h3>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor={`plan-name-${baby.id}`}>{t('babies.form.healthPlanNameLabel')}</Label>
          <Input
            id={`plan-name-${baby.id}`}
            className="mt-2"
            placeholder={t('babies.form.healthPlanNamePlaceholder')}
            value={planName}
            onChange={(event) => setPlanName(event.target.value)}
          />
        </div>
        <div>
          <Label htmlFor={`plan-number-${baby.id}`}>{t('babies.form.healthPlanNumberLabel')}</Label>
          <Input
            id={`plan-number-${baby.id}`}
            className="mt-2 font-mono"
            placeholder={t('babies.form.healthPlanNumberPlaceholder')}
            value={planNumber}
            onChange={(event) => setPlanNumber(event.target.value)}
          />
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <Button type="button" size="sm" onClick={handleSave} disabled={!isDirty || updateBaby.isPending}>
          {updateBaby.isPending ? t('common.saving') : t('healthPlan.saveAction')}
        </Button>
      </div>
    </div>
  )
}
