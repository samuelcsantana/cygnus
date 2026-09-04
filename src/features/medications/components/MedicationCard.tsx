import { useTranslation } from 'react-i18next'

import type { Baby } from '@/features/babies/api/babies.schemas'
import { formatDateDisplay } from '@/lib/date'
import { cn } from '@/lib/utils'
import { babyAvatarAppearance, babyInitials } from '@/shared/utils/babyAvatarColor'

import { isOngoing, type Medication } from '../api/medications.schemas'

interface MedicationCardProps {
  medication: Medication
  baby?: Baby
  onEnd: () => void
  onEdit: () => void
}

export function MedicationCard({ medication, baby, onEnd, onEdit }: MedicationCardProps) {
  const { t, i18n } = useTranslation()
  const ongoing = isOngoing(medication)
  const avatarAppearance = baby ? babyAvatarAppearance(baby.id, baby.avatarColor) : null

  return (
    <div
      className={cn(
        'rounded-2xl bg-card p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] sm:p-6',
        // A borda marca o que não tem fim registrado, do mesmo jeito que a consulta agendada é
        // marcada em `AppointmentCard`. Âmbar e não verde: "sem fim registrado" é uma pendência de
        // registro, não uma afirmação de que está tudo certo.
        ongoing ? 'border-[1.5px] border-amber-200' : 'border-[1.5px] border-transparent',
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3.5">
          {baby && (
            <span
              className={cn(
                'flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-base font-black',
                avatarAppearance?.className,
              )}
              style={avatarAppearance?.style}
              title={baby.name}
            >
              {babyInitials(baby.name)}
            </span>
          )}
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-bold text-ink">{medication.name}</h3>
            <p className="truncate text-[13px] text-ink-muted">
              {baby?.name}
              {baby && medication.reason && ' · '}
              {medication.reason}
            </p>
          </div>
        </div>

        {/* "Sem fim registrado", e não "em uso": o app sabe o que alguém escreveu, não o que a
            criança está tomando hoje. A diferença é a única coisa que impede este rótulo de virar
            uma afirmação que ninguém verificou.

            amber-700 sobre amber-50 e ink-muted sobre muted são pares opacos — o contraste é medido
            contra o próprio chip, não contra o cartão. */}
        <span
          className={cn(
            'flex-shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold',
            ongoing ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' : 'bg-muted text-ink-muted',
          )}
        >
          {ongoing ? t('medications.status.open') : t('medications.status.ended')}
        </span>
      </div>

      {/* Dose e frequência em mono porque são o dado factual da receita, lido em voz alta ou
          conferido caractere a caractere — mesma regra do tipo sanguíneo e da carteirinha. */}
      {(medication.dosage || medication.frequency) && (
        <p className="mb-1 font-mono text-[13px] text-ink">
          {medication.dosage}
          {medication.dosage && medication.frequency && ' · '}
          {medication.frequency}
        </p>
      )}

      <p className="text-[13px] text-ink-muted">
        <span className="font-mono">{formatDateDisplay(medication.startedOn, i18n.language)}</span>
        {medication.endedOn ? (
          <>
            {' → '}
            <span className="font-mono">{formatDateDisplay(medication.endedOn, i18n.language)}</span>
          </>
        ) : null}
        {medication.prescriberName && ` · ${medication.prescriberName}`}
      </p>

      {medication.notes && (
        <div className="mt-3 rounded-[10px] bg-surface px-3.5 py-2.5">
          <p className="text-[13px] leading-relaxed text-ink-muted">📋 {medication.notes}</p>
        </div>
      )}

      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={onEdit}
          className="flex-1 rounded-xl border-2 border-border py-2.5 text-sm font-bold text-ink-muted transition-colors hover:bg-muted"
        >
          {t('medications.editAction')}
        </button>
        {ongoing && (
          <button
            type="button"
            onClick={onEnd}
            className="flex-1 rounded-xl bg-emerald-50 py-2.5 text-sm font-bold text-emerald-700 transition-colors hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/40"
          >
            {t('medications.endAction')}
          </button>
        )}
      </div>
    </div>
  )
}
