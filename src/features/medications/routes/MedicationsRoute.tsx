import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import type { Baby } from '@/features/babies/api/babies.schemas'
import { todayDateString } from '@/lib/date'
import { BabyFilterChips } from '@/shared/components/BabyFilterChips'
import { EmptyState } from '@/shared/components/EmptyState'
import { HeartIcon } from '@/shared/icons/heart-icon'

import { useAllBabiesMedications, useEndMedication } from '../api/medications.hooks'
import { isOngoing, type Medication } from '../api/medications.schemas'
import { AddMedicationDialog } from '../components/AddMedicationDialog'
import { EditMedicationDialog } from '../components/EditMedicationDialog'
import { MedicationCard } from '../components/MedicationCard'
import { MedicationRecordNotice } from '../components/MedicationRecordNotice'

export function MedicationsRoute() {
  const { t } = useTranslation()
  const { isPending, isError, isEmpty, babies, items } = useAllBabiesMedications()
  const [babyFilter, setBabyFilter] = useState<string | null>(null)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Medication | null>(null)

  const filteredItems = items.filter((item) => !babyFilter || item.babyId === babyFilter)
  // Sem fim registrado primeiro: é o que alguém abre a tela para conferir. O resto é histórico, e
  // histórico se lê do mais recente para trás — a ordem que a API já manda.
  const orderedItems = [...filteredItems.filter(isOngoing), ...filteredItems.filter((item) => !isOngoing(item))]

  if (isEmpty) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="animate-fade-in-up">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="font-display text-3xl font-extrabold text-ink">{t('medications.title')}</h2>
          {/* Sem a lista, `items.length` é zero porque nada carregou, não porque nada foi
              registrado — e "0 medicamentos" se lê como um fato sobre a criança. Mesma forma das
              outras telas. */}
          {isError ? null : (
            <p className="mt-1 text-lg text-ink-muted">
              {isPending ? t('medications.summaryUnavailable') : t('medications.summary', { count: items.length })}
            </p>
          )}
        </div>
        <Button
          type="button"
          size="cta"
          onClick={() => setIsAddOpen(true)}
          className="rounded-2xl shadow-lg shadow-emerald-900/20 active:scale-[0.98]"
        >
          {t('medications.action')}
        </Button>
      </div>

      {/* No topo da tela, antes de qualquer dose aparecer. */}
      <MedicationRecordNotice className="mb-6" />

      <AddMedicationDialog open={isAddOpen} onOpenChange={setIsAddOpen} />
      <EditMedicationDialog medication={editTarget} onOpenChange={() => setEditTarget(null)} />

      {babies.length > 1 && (
        <BabyFilterChips babies={babies} value={babyFilter} onChange={setBabyFilter} className="mb-6" />
      )}

      {isPending ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {[0, 1].map((index) => (
            <div key={index} className="h-44 animate-pulse rounded-2xl bg-card shadow-sm" />
          ))}
        </div>
      ) : isError ? (
        <p className="py-16 text-center text-ink-muted">{t('medications.genericError')}</p>
      ) : orderedItems.length === 0 ? (
        <EmptyState
          icon={<HeartIcon className="h-10 w-10" />}
          title={t('medications.empty.title')}
          description={t('medications.empty.description')}
          tone="rose"
          action={
            <Button
              type="button"
              size="cta"
              onClick={() => setIsAddOpen(true)}
              className="rounded-xl shadow-md shadow-emerald-900/20"
            >
              {t('medications.empty.cta')}
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {orderedItems.map((medication) => (
            <MedicationRow key={medication.id} medication={medication} babies={babies} onEdit={setEditTarget} />
          ))}
        </div>
      )}
    </div>
  )
}

interface MedicationRowProps {
  medication: Medication
  babies: Baby[]
  onEdit: (medication: Medication) => void
}

/**
 * O hook de encerrar precisa do `babyId` do registro, e um hook não pode ser chamado dentro de um
 * `map`. Daí a linha ser um componente: cada uma monta o seu, com a criança certa.
 */
function MedicationRow({ medication, babies, onEdit }: MedicationRowProps) {
  const { t } = useTranslation()
  const endMedication = useEndMedication(medication.babyId)
  const baby = babies.find((candidate) => candidate.id === medication.babyId)

  return (
    <MedicationCard
      medication={medication}
      baby={baby}
      onEdit={() => onEdit(medication)}
      onEnd={() => {
        // Encerra hoje, que é o caso esmagador — "acabou o frasco". Uma data diferente é uma
        // correção, e correção se faz no formulário, onde ela pode ser lida antes de ser salva.
        endMedication.mutate(
          { medicationId: medication.id, endedOn: todayDateString() },
          {
            onSuccess: () => toast.success(t('medications.endSuccessToast')),
            onError: () => toast.error(t('medications.form.genericError')),
          },
        )
      }}
    />
  )
}
