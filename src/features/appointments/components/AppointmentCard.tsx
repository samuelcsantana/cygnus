import { useTranslation } from 'react-i18next'

import type { Baby } from '@/features/babies/api/babies.schemas'
import { formatDateDisplay, formatDayMonthParts, splitScheduledAt } from '@/lib/date'
import { cn } from '@/lib/utils'
import { StethoscopeIcon } from '@/shared/icons/stethoscope-icon'
import { babyAvatarAppearance, babyInitials } from '@/shared/utils/babyAvatarColor'
import { formatCentimeters, formatKilograms } from '@/shared/utils/measurements'

import type { Appointment } from '../api/appointments.schemas'
import { AppointmentStatusBadge } from './AppointmentStatusBadge'

interface AppointmentCardProps {
  appointment: Appointment
  baby?: Baby
  onReschedule: () => void
  onViewDetails: () => void
}

export function AppointmentCard({ appointment, baby, onReschedule, onViewDetails }: AppointmentCardProps) {
  const { t, i18n } = useTranslation()
  const { date, time } = splitScheduledAt(appointment.scheduledAt)
  const { day, month } = formatDayMonthParts(date, i18n.language)
  const isScheduled = appointment.status === 'SCHEDULED'
  const avatarAppearance = baby ? babyAvatarAppearance(baby.id, baby.avatarColor) : null

  return (
    <div
      className={cn(
        'rounded-2xl bg-card p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] sm:p-6',
        isScheduled ? 'border-[1.5px] border-violet-200' : 'border-[1.5px] border-transparent',
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3.5">
          {/* Só a consulta agendada troca o avatar pelo bloco de data.
              Numa lista misturada, a data que importa escanear é a que ainda
              vai acontecer; numa consulta concluída ela é histórico, e um bloco
              gritando o dia competiria com as que pedem ação.

              Adaptado da referência `LoginAndDashboardDesign`, que faz o mesmo
              corte entre "Próximas" e "Histórico" — lá em duas seções, aqui
              dentro de uma lista só, porque esta é cronológica e mesclada entre
              as crianças da casa.

              `bg-violet-600`, e não o `violet-500` que é a cor de consultas
              deste app: branco sobre o 500 mede **4.32:1** e reprova. O 600
              (stock, o `@theme` não redefine essa parada) dá 5.70:1. */}
          {isScheduled ? (
            <span
              className="flex h-12 w-12 flex-shrink-0 flex-col items-center justify-center rounded-2xl bg-violet-600 text-white"
              aria-hidden
            >
              <span className="font-mono text-lg leading-none">{day}</span>
              <span className="mt-0.5 text-[10px] leading-none uppercase">{month}</span>
            </span>
          ) : baby ? (
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
          ) : (
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
              <StethoscopeIcon className="h-5 w-5" />
            </span>
          )}
          <div>
            <h3 className="text-[15px] font-bold text-ink">{appointment.doctorName}</h3>
            <p className="flex items-center gap-1.5 text-[13px] text-ink-muted">
              {/* Com o bloco de data ocupando o lugar do avatar, a criança
                  perderia sua marca de cor — o que numa lista de várias
                  crianças é o que se olha primeiro. O ponto colorido devolve
                  isso sem roubar espaço; o nome ao lado continua sendo quem
                  informa, então ele é `aria-hidden`. */}
              {isScheduled && baby && (
                <span
                  aria-hidden
                  className={cn('h-2 w-2 flex-shrink-0 rounded-full', avatarAppearance?.className)}
                  style={avatarAppearance?.style}
                />
              )}
              {baby?.name}
              {baby && appointment.specialty && ' · '}
              {appointment.specialty}
            </p>
          </div>
        </div>
        <div className="flex-shrink-0 text-right">
          <AppointmentStatusBadge status={appointment.status} />
          {/* A data completa continua escrita aqui, inclusive na agendada: o
              bloco à esquerda é `aria-hidden`, então sem esta linha a data
              simplesmente não existiria para leitor de tela — e o ano, que o
              bloco não mostra, não existiria para ninguém. */}
          <p className="font-mono mt-1 text-xs text-ink-faint">
            {formatDateDisplay(date, i18n.language)} · {time}
          </p>
        </div>
      </div>

      {/* O que a visita mediu, em etiquetas — o desenho que a referência usa no
          histórico, e o mais barato: cabe na linha que já existe e não abre
          seção nova.

          Só aparecem quando há medida, e medida só existe em consulta que
          aconteceu (a API recusa nas demais). Os números vão em mono porque são
          dado factual, e o rótulo fica em `sr-only`: para quem vê, o ícone e a
          unidade já dizem o que é; para quem ouve, "15,8 kg" sozinho não diz. */}
      {(appointment.weightGrams !== null || appointment.heightMillimeters !== null) && (
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {appointment.weightGrams !== null && (
            <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-xs text-ink-muted">
              <span aria-hidden>⚖️</span>
              <span className="sr-only">{t('common.weight')} </span>
              <span className="font-mono">{formatKilograms(appointment.weightGrams, i18n.language)}</span>
            </span>
          )}
          {appointment.heightMillimeters !== null && (
            <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-xs text-ink-muted">
              <span aria-hidden>📏</span>
              <span className="sr-only">{t('common.height')} </span>
              <span className="font-mono">{formatCentimeters(appointment.heightMillimeters, i18n.language)}</span>
            </span>
          )}
        </div>
      )}

      {appointment.reason && <p className="mb-1 text-[13px] text-ink-muted">{appointment.reason}</p>}
      {appointment.location && <p className="mb-1 text-[13px] text-ink-muted">{appointment.location}</p>}

      {appointment.notes && (
        <div className="mt-3 rounded-[10px] bg-surface px-3.5 py-2.5">
          <p className="text-[13px] leading-relaxed text-ink-muted">📋 {appointment.notes}</p>
        </div>
      )}

      {isScheduled ? (
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={onReschedule}
            className="flex-1 rounded-xl border-2 border-border py-2.5 text-sm font-bold text-ink-muted transition-colors hover:border-border hover:bg-muted"
          >
            {t('appointments.reschedule.action')}
          </button>
          <button
            type="button"
            onClick={onViewDetails}
            className="flex-1 rounded-xl bg-violet-50 dark:bg-violet-950/40 py-2.5 text-sm font-bold text-violet-700 dark:text-violet-300 transition-colors hover:bg-violet-100 dark:hover:bg-violet-900/40"
          >
            {t('appointments.detail.action')}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onViewDetails}
          className={cn(
            'mt-4 w-full rounded-xl py-2.5 text-sm font-bold transition-colors',
            // Cancelada é neutra, não verde. O DESIGN.md já mapeia
            // `Appointment CANCELLED` para slate neutro, e o badge no topo do
            // cartão segue isso — só este botão não seguia, porque o ternário
            // era binário (agendada ou "todo o resto") e jogava cancelada no
            // mesmo balde de concluída. Consulta cancelada com botão verde lê
            // como se estivesse tudo certo com ela.
            appointment.status === 'CANCELLED'
              ? 'bg-muted text-ink-muted hover:bg-muted/70'
              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40',
          )}
        >
          {t('appointments.detail.action')}
        </button>
      )}
    </div>
  )
}
